"""
RAG Chain 核心系统
实现检索增强生成的完整流程：查询分析 → 知识检索 → Prompt生成 → 回答生成 → 质量评估

注意：当前使用模拟回答生成器，可替换为真实LLM API调用
"""

import time
import json
import os
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

from .vector_store import VectorStore
from .retriever import ElderNutritionRetriever, SearchConfig, SearchStrategy, SearchResult
from .prompt_manager import PromptManager
from .prompt_template import QueryIntent


class RAGMode(Enum):
    """RAG模式枚举"""
    BASIC = "basic"                    # 基础模式：简单检索+生成
    ENHANCED = "enhanced"              # 增强模式：智能检索+Few-shot
    EXPERT = "expert"                  # 专家模式：多轮优化+质量保障
    INTERACTIVE = "interactive"        # 交互模式：对话式问答


@dataclass
class RAGConfig:
    """RAG配置"""
    mode: RAGMode = RAGMode.ENHANCED
    
    # 检索配置
    search_strategy: SearchStrategy = SearchStrategy.HYBRID
    top_k: int = 3
    similarity_threshold: float = 0.3
    enable_reranking: bool = True
    
    # Prompt配置
    use_few_shot: bool = True
    enable_quality_check: bool = True
    
    # 生成配置
    max_response_length: int = 1000
    response_style: str = "professional"  # professional, friendly, detailed
    include_sources: bool = True
    
    # 质量配置
    min_quality_score: float = 70.0
    enable_auto_retry: bool = True
    max_retry_attempts: int = 2
    
    # LLM配置 (新增)
    use_real_llm: bool = False          # 是否使用真实LLM
    llm_provider: str = "openai"        # LLM提供商: openai, anthropic, qwen, etc.
    llm_model: str = "gpt-4"           # 模型名称
    llm_api_key: Optional[str] = None   # API密钥
    llm_base_url: Optional[str] = None  # 自定义API地址


@dataclass
class RAGContext:
    """RAG上下文信息"""
    user_query: str
    session_id: str
    conversation_history: List[Dict[str, Any]] = field(default_factory=list)
    user_profile: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RAGResponse:
    """RAG响应结果"""
    query: str
    answer: str
    sources: List[SearchResult]
    confidence_score: float
    quality_score: float
    processing_time: float
    intent: QueryIntent
    prompt_used: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class ResponseGenerator:
    """回答生成器（支持模拟和真实LLM）"""
    
    def __init__(self, config: RAGConfig = None):
        self.config = config or RAGConfig()
        self.response_templates = self._load_response_templates()
        
        # 如果启用真实LLM，初始化LLM客户端
        if self.config.use_real_llm:
            self._init_llm_client()
    
    def _init_llm_client(self):
        """初始化LLM客户端"""
        if self.config.llm_provider == "openai":
            try:
                import openai
                self.llm_client = openai.OpenAI(
                    api_key=self.config.llm_api_key or os.getenv("OPENAI_API_KEY"),
                    base_url=self.config.llm_base_url
                )
            except ImportError:
                print("⚠️ openai库未安装，请运行: pip install openai")
                self.config.use_real_llm = False
        
        elif self.config.llm_provider == "anthropic":
            try:
                import anthropic
                self.llm_client = anthropic.Anthropic(
                    api_key=self.config.llm_api_key or os.getenv("ANTHROPIC_API_KEY")
                )
            except ImportError:
                print("⚠️ anthropic库未安装，请运行: pip install anthropic")
                self.config.use_real_llm = False
        
        elif self.config.llm_provider == "qwen":
            # 通义千问等国产模型的接入示例
            # 这里需要根据具体API进行实现
            print("🚧 通义千问接入开发中...")
            self.config.use_real_llm = False
        
        else:
            print(f"❌ 不支持的LLM提供商: {self.config.llm_provider}")
            self.config.use_real_llm = False
    
    def generate_response(
        self, 
        prompt: str, 
        config: RAGConfig,
        context: RAGContext
    ) -> Tuple[str, float]:
        """
        生成回答（支持真实LLM和模拟LLM）
        
        Args:
            prompt: 生成的prompt
            config: RAG配置
            context: 上下文信息
            
        Returns:
            (回答文本, 置信度分数)
        """
        if config.use_real_llm and hasattr(self, 'llm_client'):
            # 使用真实LLM生成回答
            return self._generate_with_real_llm(prompt, config, context)
        else:
            # 使用模拟回答生成器
            return self._generate_with_simulation(prompt, config, context)
    
    def _generate_with_real_llm(
        self,
        prompt: str,
        config: RAGConfig,
        context: RAGContext
    ) -> Tuple[str, float]:
        """使用真实LLM生成回答"""
        try:
            if config.llm_provider == "openai":
                response = self.llm_client.chat.completions.create(
                    model=config.llm_model,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=config.max_response_length,
                    temperature=0.7
                )
                answer = response.choices[0].message.content
                confidence = 0.9  # 基于真实LLM的高置信度
                
            elif config.llm_provider == "anthropic":
                message = self.llm_client.messages.create(
                    model=config.llm_model,
                    max_tokens=config.max_response_length,
                    messages=[
                        {"role": "user", "content": prompt}
                    ]
                )
                answer = message.content[0].text
                confidence = 0.9
            
            else:
                # 其他提供商的实现
                raise NotImplementedError(f"LLM提供商 {config.llm_provider} 尚未实现")
            
            return answer, confidence
            
        except Exception as e:
            print(f"❌ LLM API调用失败: {str(e)}")
            print("🔄 回退到模拟回答生成器")
            return self._generate_with_simulation(prompt, config, context)
    
    def _generate_with_simulation(
        self,
        prompt: str,
        config: RAGConfig,
        context: RAGContext
    ) -> Tuple[str, float]:
        """使用模拟回答生成器（当前默认方式）"""
        # 基于prompt内容生成模拟回答
        if "糖尿病" in prompt:
            answer = self._generate_diabetes_response(prompt, config)
        elif "缺钙" in prompt or "钙质" in prompt:
            answer = self._generate_calcium_response(prompt, config)
        elif "高血压" in prompt:
            answer = self._generate_hypertension_response(prompt, config)
        elif "食谱" in prompt or "饮食计划" in prompt:
            answer = self._generate_diet_plan_response(prompt, config)
        else:
            answer = self._generate_general_response(prompt, config)
        
        # 根据配置调整回答风格
        answer = self._adjust_response_style(answer, config.response_style)
        
        # 计算置信度（基于prompt质量和内容匹配度）
        confidence = self._calculate_confidence(prompt, answer)
        
        return answer, confidence
    
    def _generate_diabetes_response(self, prompt: str, config: RAGConfig) -> str:
        """生成糖尿病相关回答"""
        base_response = """您好！关于糖尿病老年人的饮食管理，我为您提供以下专业建议：

**核心饮食原则**：
1. **控制总热量**：根据体重和活动量，建议每日1600-1800千卡
2. **选择低糖指数食物**：优选燕麦、糙米、全麦制品
3. **增加膳食纤维**：每日25-30克，多食用绿叶蔬菜和豆类
4. **定时定量进餐**：建议三餐加两次健康加餐，规律饮食

**推荐食物搭配**：
- **主食**：燕麦片、糙米饭、全麦面条（每餐100-150g）
- **蛋白质**：瘦肉、鱼类、豆腐、鸡蛋（每日100-150g）
- **蔬菜**：菠菜、西兰花、芹菜、黄瓜（每日400-500g）
- **水果**：苹果、梨、柚子（每日100-200g，控制糖分）

**重要注意事项**：
- 定期监测血糖变化，记录饮食与血糖的关系
- 药物调整需咨询内分泌科医生
- 出现低血糖症状时及时处理
- 配合适量运动，促进血糖控制

希望这些建议对您有帮助！如有其他问题，请随时咨询。"""
        
        return base_response
    
    def _generate_calcium_response(self, prompt: str, config: RAGConfig) -> str:
        """生成补钙相关回答"""
        base_response = """您好！老年人钙质补充确实很重要，我为您制定科学的补钙方案：

**为什么老年人容易缺钙**：
随着年龄增长，钙的吸收率下降，同时流失增加，容易导致骨质疏松。

**天然食物补钙方案**：
1. **奶制品**（每日250-500ml）
   - 牛奶、酸奶、奶酪
   - 每100ml牛奶含钙约100mg

2. **豆制品**（每日100-150g）
   - 豆腐、豆干、豆浆
   - 100g豆腐含钙约150mg

3. **绿叶蔬菜**（每日200-300g）
   - 菠菜、小白菜、芥蓝
   - 钙含量高且吸收率好

4. **小鱼小虾**（每周2-3次）
   - 带骨小鱼、虾皮
   - 优质钙源

**促进吸收的方法**：
- 适量晒太阳，补充维生素D
- 适度运动，促进骨骼健康
- 避免与咖啡、茶同时大量饮用

**每日推荐搭配**：
- 早餐：牛奶250ml + 豆浆200ml
- 午餐：小白菜100g + 豆腐50g
- 晚餐：菠菜150g + 虾皮5g

这样可达到每日1000-1200mg的推荐摄入量。"""
        
        return base_response
    
    def _generate_hypertension_response(self, prompt: str, config: RAGConfig) -> str:
        """生成高血压相关回答"""
        base_response = """您好！高血压老年人的饮食管理非常重要，我为您提供专业指导：

**降压饮食原则**：
1. **低盐饮食**：每日盐分控制在5-6g以内
2. **增加钾摄入**：多食用香蕉、土豆、西红柿
3. **控制脂肪**：减少饱和脂肪，选择橄榄油等健康油脂
4. **适量蛋白质**：鱼类、豆类为主要来源

**推荐食物**：
- **谷物**：燕麦、糙米、全麦制品
- **蔬菜**：芹菜、菠菜、冬瓜、黄瓜（每日400-500g）
- **水果**：香蕉、苹果、橙子（每日200-300g）
- **蛋白质**：深海鱼、鸡胸肉、豆腐

**烹饪建议**：
- 多用蒸、煮、炖的方式，减少油炸
- 用天然香料调味：姜、蒜、胡椒
- 多用醋、柠檬汁提味
- 食用油每日不超过25g

**注意事项**：
- 定期监测血压变化
- 配合适量运动
- 药物治疗需遵医嘱
- 保持情绪稳定，避免压力"""
        
        return base_response
    
    def _generate_diet_plan_response(self, prompt: str, config: RAGConfig) -> str:
        """生成饮食规划回答"""
        base_response = """您好！我为您制定一个营养均衡的老年人一日饮食计划：

**营养目标**：
- 总热量：1600-1800kcal
- 蛋白质：每公斤体重1.0-1.2g
- 膳食纤维：25-30g
- 水分：1200-1500ml

**一日食谱安排**：

**早餐（7:00-8:00）**：
- 小米粥 150ml
- 煮鸡蛋 1个
- 凉拌黄瓜 100g
- 牛奶 250ml

**上午加餐（10:00）**：
- 苹果 150g 或香蕉 100g

**午餐（12:00-13:00）**：
- 二米饭 100g
- 清蒸鱼 100g
- 炒时蔬 150g
- 紫菜蛋花汤 200ml

**下午加餐（15:30）**：
- 无糖酸奶 150ml
- 核桃 3个

**晚餐（18:00-19:00）**：
- 燕麦粥 150ml
- 清炒菠菜 150g
- 清炖豆腐 100g
- 银耳汤 200ml

**制作要点**：
1. 少油少盐，清淡为主
2. 食材新鲜，搭配多样
3. 细嚼慢咽，定时进餐
4. 适量饮水，避免过饱"""
        
        return base_response
    
    def _generate_general_response(self, prompt: str, config: RAGConfig) -> str:
        """生成通用营养回答"""
        base_response = """您好！感谢您的营养咨询。

**一般营养建议**：
1. **均衡饮食**：确保各类营养素摄入充足
2. **多样化选择**：每日摄入多种颜色的蔬菜水果
3. **适量运动**：配合饮食调整，促进健康
4. **规律作息**：保证充足睡眠，有助营养吸收

**老年人营养要点**：
- 蛋白质：选择优质蛋白，如鱼类、豆类
- 钙质：充足的奶制品和绿叶蔬菜
- 维生素：多种维生素的均衡补充
- 水分：每日1200-1500ml的充足饮水

**温馨提醒**：
每个人的身体状况不同，建议根据个人情况调整饮食。如有特殊疾病或用药情况，请咨询专业医生或营养师。

如您需要更具体的建议，请提供更详细的健康状况信息。"""
        
        return base_response
    
    def _adjust_response_style(self, answer: str, style: str) -> str:
        """调整回答风格"""
        if style == "friendly":
            # 添加更亲切的表达
            answer = answer.replace("您好！", "您好呀！亲爱的朋友，")
            answer = answer.replace("建议", "建议您")
            answer += "\n\n愿您身体健康，生活愉快！🌸"
        elif style == "detailed":
            # 添加更多细节说明
            answer += "\n\n**补充说明**：以上建议基于一般老年人营养需求制定，具体实施时请考虑个人体质、疾病状况和饮食习惯。"
        
        return answer
    
    def _calculate_confidence(self, prompt: str, answer: str) -> float:
        """计算置信度"""
        confidence = 0.8  # 基础置信度
        
        # 基于prompt质量调整
        if len(prompt) > 1000:
            confidence += 0.1
        
        # 基于回答完整性调整
        if len(answer) > 500:
            confidence += 0.05
        
        if "注意事项" in answer:
            confidence += 0.05
        
        return min(confidence, 1.0)
    
    def _load_response_templates(self) -> Dict[str, str]:
        """加载回答模板"""
        return {
            "greeting": "您好！我是您的营养咨询助手。",
            "closing": "希望这些建议对您有帮助！",
            "disclaimer": "以上建议仅供参考，具体情况请咨询专业医生。"
        }


class QualityAssessment:
    """质量评估器"""
    
    def __init__(self):
        pass
    
    def assess_response(
        self, 
        response: RAGResponse, 
        context: RAGContext
    ) -> Dict[str, Any]:
        """
        评估回答质量
        
        Args:
            response: RAG响应
            context: 上下文
            
        Returns:
            质量评估结果
        """
        assessment = {
            "overall_score": 0.0,
            "dimensions": {},
            "issues": [],
            "suggestions": []
        }
        
        # 1. 相关性评估
        relevance_score = self._assess_relevance(response, context)
        assessment["dimensions"]["relevance"] = relevance_score
        
        # 2. 完整性评估
        completeness_score = self._assess_completeness(response)
        assessment["dimensions"]["completeness"] = completeness_score
        
        # 3. 准确性评估
        accuracy_score = self._assess_accuracy(response)
        assessment["dimensions"]["accuracy"] = accuracy_score
        
        # 4. 可读性评估
        readability_score = self._assess_readability(response)
        assessment["dimensions"]["readability"] = readability_score
        
        # 5. 安全性评估
        safety_score = self._assess_safety(response)
        assessment["dimensions"]["safety"] = safety_score
        
        # 计算总分
        weights = {
            "relevance": 0.3,
            "completeness": 0.25,
            "accuracy": 0.25,
            "readability": 0.1,
            "safety": 0.1
        }
        
        assessment["overall_score"] = sum(
            assessment["dimensions"][dim] * weight 
            for dim, weight in weights.items()
        )
        
        # 生成问题和建议
        assessment["issues"], assessment["suggestions"] = self._generate_feedback(
            assessment["dimensions"]
        )
        
        return assessment
    
    def _assess_relevance(self, response: RAGResponse, context: RAGContext) -> float:
        """评估相关性"""
        score = 80.0  # 基础分数
        
        # 检查关键词匹配
        query_words = set(context.user_query.lower().split())
        answer_words = set(response.answer.lower().split())
        
        overlap = len(query_words.intersection(answer_words))
        if overlap > 0:
            score += min(overlap * 5, 20)
        
        return min(score, 100.0)
    
    def _assess_completeness(self, response: RAGResponse) -> float:
        """评估完整性"""
        score = 70.0
        
        # 检查回答长度
        if len(response.answer) > 300:
            score += 10
        if len(response.answer) > 600:
            score += 10
        
        # 检查结构化程度
        if "**" in response.answer:
            score += 5
        if "建议" in response.answer:
            score += 5
        if "注意" in response.answer:
            score += 5
        
        return min(score, 100.0)
    
    def _assess_accuracy(self, response: RAGResponse) -> float:
        """评估准确性"""
        score = 85.0  # 基于模板的回答通常准确性较高
        
        # 检查是否有来源支持
        if len(response.sources) > 0:
            score += 10
        
        # 检查置信度
        score += response.confidence_score * 5
        
        return min(score, 100.0)
    
    def _assess_readability(self, response: RAGResponse) -> float:
        """评估可读性"""
        score = 80.0
        
        answer = response.answer
        
        # 检查句子长度
        sentences = answer.split('。')
        avg_length = sum(len(s) for s in sentences) / len(sentences) if sentences else 0
        
        if 10 <= avg_length <= 30:  # 适中的句子长度
            score += 10
        
        # 检查格式化
        if '\n' in answer:
            score += 5
        
        return min(score, 100.0)
    
    def _assess_safety(self, response: RAGResponse) -> float:
        """评估安全性"""
        score = 90.0
        
        # 检查是否有免责声明或医嘱建议
        if "咨询医生" in response.answer or "医生" in response.answer:
            score += 10
        
        # 检查是否有危险建议（这里简化处理）
        dangerous_words = ["大量", "随意", "不需要"]
        for word in dangerous_words:
            if word in response.answer:
                score -= 10
        
        return max(score, 0.0)
    
    def _generate_feedback(self, dimensions: Dict[str, float]) -> Tuple[List[str], List[str]]:
        """生成问题和建议"""
        issues = []
        suggestions = []
        
        for dim, score in dimensions.items():
            if score < 70:
                if dim == "relevance":
                    issues.append("回答与问题相关性不够")
                    suggestions.append("建议增加更多与用户问题直接相关的内容")
                elif dim == "completeness":
                    issues.append("回答不够完整")
                    suggestions.append("建议补充更多细节和具体建议")
                elif dim == "accuracy":
                    issues.append("回答准确性有待提高")
                    suggestions.append("建议基于更多可靠来源生成回答")
                elif dim == "readability":
                    issues.append("回答可读性需要改善")
                    suggestions.append("建议优化段落结构和表达方式")
                elif dim == "safety":
                    issues.append("回答安全性需要注意")
                    suggestions.append("建议添加适当的免责声明和医嘱提醒")
        
        return issues, suggestions


class RAGChain:
    """RAG Chain 主类"""
    
    def __init__(
        self, 
        vector_store: VectorStore,
        config: RAGConfig = None
    ):
        """
        初始化RAG Chain
        
        Args:
            vector_store: 向量存储
            config: RAG配置
        """
        self.config = config or RAGConfig()
        
        # 初始化组件
        self.retriever = ElderNutritionRetriever(vector_store)
        self.prompt_manager = PromptManager()
        self.response_generator = ResponseGenerator(config=self.config)
        self.quality_assessor = QualityAssessment()
        
        # 统计信息
        self.stats = {
            "total_queries": 0,
            "successful_responses": 0,
            "average_processing_time": 0.0,
            "average_quality_score": 0.0
        }
    
    def process_query(
        self, 
        user_query: str,
        context: RAGContext = None
    ) -> RAGResponse:
        """
        处理用户查询的主方法
        
        Args:
            user_query: 用户查询
            context: 上下文信息
            
        Returns:
            RAG响应结果
        """
        start_time = time.time()
        
        # 创建默认上下文
        if context is None:
            context = RAGContext(
                user_query=user_query,
                session_id=f"session_{int(time.time())}"
            )
        
        try:
            # 1. 知识检索
            search_results = self._retrieve_knowledge(user_query)
            
            # 2. Prompt生成
            prompt, intent = self._generate_prompt(user_query, search_results, context)
            
            # 3. 回答生成
            answer, confidence = self._generate_answer(prompt, context)
            
            # 4. 质量评估
            processing_time = time.time() - start_time
            
            response = RAGResponse(
                query=user_query,
                answer=answer,
                sources=search_results,
                confidence_score=confidence,
                quality_score=0.0,  # 待评估
                processing_time=processing_time,
                intent=intent,
                prompt_used=prompt
            )
            
            # 质量评估
            if self.config.enable_quality_check:
                quality_assessment = self.quality_assessor.assess_response(response, context)
                response.quality_score = quality_assessment["overall_score"]
                response.metadata["quality_assessment"] = quality_assessment
            
            # 更新统计
            self._update_stats(response)
            
            return response
            
        except Exception as e:
            # 错误处理
            error_response = RAGResponse(
                query=user_query,
                answer=f"抱歉，处理您的问题时遇到了错误：{str(e)}。请稍后重试或重新表述问题。",
                sources=[],
                confidence_score=0.0,
                quality_score=0.0,
                processing_time=time.time() - start_time,
                intent=QueryIntent.GENERAL_NUTRITION,
                prompt_used="",
                metadata={"error": str(e)}
            )
            
            return error_response
    
    def _retrieve_knowledge(self, user_query: str) -> List[SearchResult]:
        """检索相关知识"""
        search_config = SearchConfig(
            strategy=self.config.search_strategy,
            top_k=self.config.top_k,
            similarity_threshold=self.config.similarity_threshold,
            enable_reranking=self.config.enable_reranking
        )
        
        return self.retriever.search(user_query, search_config)
    
    def _generate_prompt(
        self, 
        user_query: str, 
        search_results: List[SearchResult],
        context: RAGContext
    ) -> Tuple[str, QueryIntent]:
        """生成Prompt"""
        prompt = self.prompt_manager.generate_prompt(
            user_query=user_query,
            search_results=search_results,
            use_few_shot=self.config.use_few_shot,
            user_profile=context.user_profile
        )
        
        # 获取识别的意图
        analysis = self.prompt_manager.analyze_query_complexity(user_query)
        intent = analysis["primary_intent"][0]
        
        return prompt, intent
    
    def _generate_answer(self, prompt: str, context: RAGContext) -> Tuple[str, float]:
        """生成回答"""
        answer, confidence = self.response_generator.generate_response(
            prompt=prompt,
            config=self.config,
            context=context
        )
        
        # 长度控制
        if len(answer) > self.config.max_response_length:
            answer = answer[:self.config.max_response_length] + "..."
        
        return answer, confidence
    
    def _update_stats(self, response: RAGResponse):
        """更新统计信息"""
        self.stats["total_queries"] += 1
        
        if response.confidence_score > 0.5:
            self.stats["successful_responses"] += 1
        
        # 更新平均处理时间
        total_time = self.stats["average_processing_time"] * (self.stats["total_queries"] - 1)
        self.stats["average_processing_time"] = (total_time + response.processing_time) / self.stats["total_queries"]
        
        # 更新平均质量分数
        if response.quality_score > 0:
            total_quality = self.stats["average_quality_score"] * (self.stats["total_queries"] - 1)
            self.stats["average_quality_score"] = (total_quality + response.quality_score) / self.stats["total_queries"]
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        return self.stats.copy()
    
    def update_config(self, new_config: RAGConfig):
        """更新配置"""
        self.config = new_config
        # 如果ResponseGenerator需要更新LLM配置，重新初始化
        if (new_config.use_real_llm != self.response_generator.config.use_real_llm or
            new_config.llm_provider != self.response_generator.config.llm_provider):
            self.response_generator = ResponseGenerator(config=new_config)
        else:
            self.response_generator.config = new_config 