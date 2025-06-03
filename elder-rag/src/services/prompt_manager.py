"""
Prompt管理系统
负责动态选择模板、管理prompt生成流程、支持意图识别和模板选择
"""

import re
from typing import List, Dict, Any, Optional, Tuple
from .prompt_template import (
    BasePromptTemplate, 
    PromptContext, 
    QueryIntent,
    DiseaseNutritionTemplate,
    NutrientDeficiencyTemplate,
    DietPlanningTemplate,
    FoodSelectionTemplate
)
from .few_shot_examples import FewShotExampleManager
from .retriever import SearchResult


class IntentClassifier:
    """查询意图分类器"""
    
    def __init__(self):
        # 意图识别规则
        self.intent_patterns = {
            QueryIntent.DISEASE_NUTRITION: [
                r"糖尿病|高血压|心血管|冠心病|脑血管|骨质疏松",
                r"疾病.*饮食|患者.*营养|病人.*吃",
                r"并发症|控制.*饮食|疾病.*管理"
            ],
            QueryIntent.NUTRIENT_DEFICIENCY: [
                r"缺.*[钙铁锌硒]|维生素|营养素|矿物质",
                r"补充.*[钙铁锌硒]|怎么补|如何补",
                r"营养不良|吸收不好|缺乏"
            ],
            QueryIntent.DIET_PLANNING: [
                r"食谱|菜谱|一日.*饮食|膳食.*计划",
                r"如何.*搭配|怎么.*安排|制定.*饮食",
                r"一天.*吃什么|三餐.*安排"
            ],
            QueryIntent.FOOD_SELECTION: [
                r"能.*吃|可以.*吃|适合.*吃|不能.*吃",
                r"[能否可]以.*食用|是否.*适宜|有.*禁忌",
                r"什么.*食物|哪些.*食品|选择.*食材"
            ],
            QueryIntent.SYMPTOM_RELIEF: [
                r"便秘|失眠|消化不良|食欲不振|恶心",
                r"症状.*缓解|不适.*改善|问题.*解决"
            ]
        }
    
    def classify_intent(self, query: str) -> Tuple[QueryIntent, float]:
        """
        分类查询意图
        
        Args:
            query: 用户查询
            
        Returns:
            (意图, 置信度)
        """
        intent_scores = {}
        
        for intent, patterns in self.intent_patterns.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, query):
                    score += 1
            
            if score > 0:
                intent_scores[intent] = score / len(patterns)
        
        if intent_scores:
            best_intent = max(intent_scores.keys(), key=lambda x: intent_scores[x])
            confidence = intent_scores[best_intent]
            return best_intent, confidence
        else:
            return QueryIntent.GENERAL_NUTRITION, 0.0
    
    def get_multiple_intents(self, query: str, threshold: float = 0.3) -> List[Tuple[QueryIntent, float]]:
        """获取多个可能的意图"""
        intent_scores = {}
        
        for intent, patterns in self.intent_patterns.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, query):
                    score += 1
            
            if score > 0:
                intent_scores[intent] = score / len(patterns)
        
        # 筛选超过阈值的意图
        valid_intents = [(intent, score) for intent, score in intent_scores.items() if score >= threshold]
        
        # 按分数排序
        valid_intents.sort(key=lambda x: x[1], reverse=True)
        
        return valid_intents


class PromptManager:
    """Prompt管理器"""
    
    def __init__(self):
        self.intent_classifier = IntentClassifier()
        self.few_shot_manager = FewShotExampleManager()
        
        # 模板注册
        self.templates = {
            QueryIntent.DISEASE_NUTRITION: DiseaseNutritionTemplate(),
            QueryIntent.NUTRIENT_DEFICIENCY: NutrientDeficiencyTemplate(), 
            QueryIntent.DIET_PLANNING: DietPlanningTemplate(),
            QueryIntent.FOOD_SELECTION: FoodSelectionTemplate()
        }
    
    def generate_prompt(
        self, 
        user_query: str, 
        search_results: List[SearchResult],
        use_few_shot: bool = True,
        user_profile: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        生成完整的prompt
        
        Args:
            user_query: 用户查询
            search_results: 检索结果
            use_few_shot: 是否使用few-shot示例
            user_profile: 用户档案
            
        Returns:
            完整的prompt
        """
        # 1. 意图分类
        primary_intent, confidence = self.intent_classifier.classify_intent(user_query)
        
        # 2. 选择模板
        template = self._select_template(primary_intent, confidence)
        
        # 3. 转换检索结果格式
        knowledge_items = self._convert_search_results(search_results)
        
        # 4. 构建上下文
        context = PromptContext(
            user_query=user_query,
            intent=primary_intent,
            retrieved_knowledge=knowledge_items,
            user_profile=user_profile
        )
        
        # 5. 生成基础prompt
        base_prompt = template.generate_prompt(context)
        
        # 6. 添加few-shot示例
        if use_few_shot:
            few_shot_prompt = self._add_few_shot_examples(base_prompt, primary_intent)
            return few_shot_prompt
        
        return base_prompt
    
    def _select_template(self, intent: QueryIntent, confidence: float) -> BasePromptTemplate:
        """选择合适的模板"""
        # 如果置信度低或者没有对应模板，使用通用模板
        if confidence < 0.5 or intent not in self.templates:
            # 使用疾病营养模板作为通用模板
            return self.templates[QueryIntent.DISEASE_NUTRITION]
        
        return self.templates[intent]
    
    def _convert_search_results(self, search_results: List[SearchResult]) -> List[Dict[str, Any]]:
        """转换检索结果为字典格式"""
        knowledge_items = []
        
        for result in search_results:
            knowledge_items.append({
                "id": result.document_id,
                "title": result.title,
                "content": result.content,
                "category": result.category,
                "keywords": result.keywords,
                "similarity_score": result.similarity_score,
                "relevance_score": result.relevance_score
            })
        
        return knowledge_items
    
    def _add_few_shot_examples(self, base_prompt: str, intent: QueryIntent) -> str:
        """添加few-shot示例"""
        # 获取相关示例
        examples = self.few_shot_manager.get_examples_by_intent(intent, max_examples=1)
        
        if not examples:
            return base_prompt
        
        # 格式化示例
        examples_text = self.few_shot_manager.format_examples_for_prompt(examples)
        
        # 组合prompt
        enhanced_prompt = f"""下面是一些专业营养师回答类似问题的示例，请参考其分析思路和回答风格：

{examples_text}

现在请按照相同的专业标准回答用户的问题：

{base_prompt}"""
        
        return enhanced_prompt
    
    def analyze_query_complexity(self, query: str) -> Dict[str, Any]:
        """分析查询复杂度"""
        # 获取多个可能的意图
        multiple_intents = self.intent_classifier.get_multiple_intents(query)
        
        # 基础分析
        query_length = len(query)
        word_count = len(query.split())
        
        # 复杂度评估
        complexity_score = 0
        
        # 长度因子
        if query_length > 50:
            complexity_score += 1
        if word_count > 10:
            complexity_score += 1
        
        # 多意图因子
        if len(multiple_intents) > 1:
            complexity_score += 1
        
        # 特殊词汇因子
        complex_terms = ["并发症", "禁忌", "相互作用", "药物", "治疗"]
        for term in complex_terms:
            if term in query:
                complexity_score += 1
                break
        
        # 确定复杂度等级
        if complexity_score <= 1:
            complexity = "simple"
        elif complexity_score <= 2:
            complexity = "medium"
        else:
            complexity = "complex"
        
        return {
            "complexity": complexity,
            "complexity_score": complexity_score,
            "query_length": query_length,
            "word_count": word_count,
            "multiple_intents": multiple_intents,
            "primary_intent": multiple_intents[0] if multiple_intents else (QueryIntent.GENERAL_NUTRITION, 0.0)
        }
    
    def get_template_info(self, intent: QueryIntent) -> Dict[str, Any]:
        """获取模板信息"""
        if intent not in self.templates:
            return {"error": "Template not found"}
        
        template = self.templates[intent]
        
        return {
            "template_name": template.template_name,
            "intent": intent.value,
            "cot_steps": [
                {
                    "step_name": step.step_name,
                    "description": step.description,
                    "instruction": step.instruction
                }
                for step in template.cot_steps
            ],
            "system_role": template.system_role
        }
    
    def validate_prompt_quality(self, prompt: str) -> Dict[str, Any]:
        """验证prompt质量"""
        issues = []
        score = 100
        
        # 检查长度
        if len(prompt) < 500:
            issues.append("Prompt过短，可能信息不足")
            score -= 20
        elif len(prompt) > 5000:
            issues.append("Prompt过长，可能影响模型性能")
            score -= 10
        
        # 检查必要组件
        required_components = ["用户咨询", "专业资料", "分析思路", "回答要求"]
        missing_components = []
        
        for component in required_components:
            if component not in prompt:
                missing_components.append(component)
                score -= 15
        
        if missing_components:
            issues.append(f"缺少必要组件: {', '.join(missing_components)}")
        
        # 检查结构化程度
        if "**" not in prompt:
            issues.append("缺少格式化标记，结构不够清晰")
            score -= 10
        
        # 检查CoT指导
        if "步骤" not in prompt and "分析" not in prompt:
            issues.append("缺少思维链指导")
            score -= 15
        
        quality_level = "excellent" if score >= 90 else "good" if score >= 70 else "needs_improvement"
        
        return {
            "score": max(score, 0),
            "quality_level": quality_level,
            "issues": issues,
            "prompt_length": len(prompt),
            "has_required_components": len(missing_components) == 0
        } 