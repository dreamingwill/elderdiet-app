"""
营养咨询Prompt模板系统
支持Chain-of-Thought推理和多场景模板
"""

import json
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod


class QueryIntent(Enum):
    """查询意图枚举"""
    DISEASE_NUTRITION = "disease_nutrition"      # 疾病营养咨询
    NUTRIENT_DEFICIENCY = "nutrient_deficiency"  # 营养素缺乏
    DIET_PLANNING = "diet_planning"              # 饮食规划
    FOOD_SELECTION = "food_selection"            # 食物选择
    SYMPTOM_RELIEF = "symptom_relief"            # 症状缓解
    GENERAL_NUTRITION = "general_nutrition"      # 一般营养咨询


@dataclass
class PromptContext:
    """Prompt上下文信息"""
    user_query: str
    intent: QueryIntent
    retrieved_knowledge: List[Dict[str, Any]]
    user_profile: Optional[Dict[str, Any]] = None
    conversation_history: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class CoTStep:
    """Chain-of-Thought推理步骤"""
    step_name: str
    description: str
    instruction: str
    example: Optional[str] = None


class BasePromptTemplate(ABC):
    """Prompt模板基类"""
    
    def __init__(self, template_name: str, intent: QueryIntent):
        self.template_name = template_name
        self.intent = intent
        self.system_role = self._get_system_role()
        self.cot_steps = self._define_cot_steps()
    
    @abstractmethod
    def _get_system_role(self) -> str:
        """定义系统角色"""
        pass
    
    @abstractmethod
    def _define_cot_steps(self) -> List[CoTStep]:
        """定义CoT推理步骤"""
        pass
    
    @abstractmethod
    def generate_prompt(self, context: PromptContext) -> str:
        """生成完整的prompt"""
        pass
    
    def _format_knowledge(self, knowledge_items: List[Dict[str, Any]]) -> str:
        """格式化检索到的知识"""
        if not knowledge_items:
            return "暂无相关专业资料。"
        
        formatted_items = []
        for i, item in enumerate(knowledge_items, 1):
            title = item.get('title', '未知标题')
            content = item.get('content', '')
            category = item.get('category', '未分类')
            
            formatted_items.append(
                f"【资料{i}】类别：{category}\n"
                f"标题：{title}\n"
                f"内容：{content}\n"
            )
        
        return "\n".join(formatted_items)
    
    def _generate_cot_instruction(self) -> str:
        """生成CoT推理指令"""
        steps_text = []
        for i, step in enumerate(self.cot_steps, 1):
            steps_text.append(f"{i}. **{step.step_name}**：{step.instruction}")
            if step.example:
                steps_text.append(f"   示例：{step.example}")
        
        return "\n".join(steps_text)


class DiseaseNutritionTemplate(BasePromptTemplate):
    """疾病营养咨询模板"""
    
    def __init__(self):
        super().__init__("disease_nutrition", QueryIntent.DISEASE_NUTRITION)
    
    def _get_system_role(self) -> str:
        return """您是一位专业的老年营养师，具有以下专业背景：
- 营养学硕士学位，从事老年营养咨询10年
- 熟悉老年人常见疾病的营养管理
- 擅长为糖尿病、高血压、心血管疾病患者制定饮食方案
- 注重营养搭配的科学性和实用性
- 语言亲切易懂，善于给出具体可操作的建议

您的使命是为老年人提供专业、安全、实用的营养指导。"""
    
    def _define_cot_steps(self) -> List[CoTStep]:
        return [
            CoTStep(
                step_name="疾病分析",
                description="分析用户提及的疾病类型及特点",
                instruction="识别疾病类型，分析其营养管理要点",
                example="糖尿病需要控制血糖，重点关注碳水化合物摄入"
            ),
            CoTStep(
                step_name="营养需求评估",
                description="评估该疾病状态下的特殊营养需求",
                instruction="分析疾病对营养吸收和代谢的影响，确定关键营养素需求",
                example="糖尿病患者需要控制总能量，增加膳食纤维，适量优质蛋白质"
            ),
            CoTStep(
                step_name="饮食原则制定",
                description="制定针对性的饮食原则",
                instruction="基于疾病特点和营养需求，制定3-5条核心饮食原则",
                example="1.控制总热量 2.低糖低盐 3.高纤维 4.定时定量"
            ),
            CoTStep(
                step_name="具体建议提供",
                description="给出具体可执行的饮食建议",
                instruction="提供具体的食物选择、烹饪方式、用餐时间等实用建议",
                example="推荐食物：燕麦、糙米、深绿色蔬菜；避免：精制糖、白米白面"
            ),
            CoTStep(
                step_name="注意事项说明",
                description="强调重要的注意事项和风险提示",
                instruction="提醒可能的风险，建议医生咨询的情况",
                example="血糖控制不佳时请及时就医，调整药物时需咨询医生"
            )
        ]
    
    def generate_prompt(self, context: PromptContext) -> str:
        knowledge_text = self._format_knowledge(context.retrieved_knowledge)
        cot_instruction = self._generate_cot_instruction()
        
        prompt = f"""{self.system_role}

**用户咨询**：{context.user_query}

**相关专业资料**：
{knowledge_text}

**分析思路**：
请按照以下步骤进行专业分析：

{cot_instruction}

**回答要求**：
1. 回答要专业且易懂，适合老年人理解
2. 给出的建议要具体可操作
3. 必须基于提供的专业资料进行回答
4. 如资料不足，请明确说明并建议咨询医生
5. 用亲切的语气，体现专业关怀

请按照上述思路分析并给出专业的营养建议："""

        return prompt


class NutrientDeficiencyTemplate(BasePromptTemplate):
    """营养素缺乏咨询模板"""
    
    def __init__(self):
        super().__init__("nutrient_deficiency", QueryIntent.NUTRIENT_DEFICIENCY)
    
    def _get_system_role(self) -> str:
        return """您是一位资深的营养素专家，专门研究老年人营养缺乏问题：
- 营养生物化学博士，专攻微量营养素研究
- 深入了解各种维生素、矿物质的生理功能
- 熟悉老年人营养素吸收特点和缺乏症状
- 擅长通过饮食调整改善营养状况
- 注重天然食物来源，避免过度依赖补充剂

您致力于帮助老年人通过科学的饮食获得充足营养。"""
    
    def _define_cot_steps(self) -> List[CoTStep]:
        return [
            CoTStep(
                step_name="营养素识别",
                description="识别用户关注的营养素类型",
                instruction="明确用户询问的是哪种营养素，分析其重要性",
                example="钙质是骨骼健康的关键营养素，老年人需求量较高"
            ),
            CoTStep(
                step_name="缺乏风险分析",
                description="分析该营养素缺乏的原因和风险",
                instruction="说明老年人容易缺乏此营养素的原因和可能后果",
                example="老年人钙吸收率下降，缺乏可能导致骨质疏松"
            ),
            CoTStep(
                step_name="食物来源推荐",
                description="推荐富含该营养素的天然食物",
                instruction="按优先级推荐3-5类富含该营养素的食物",
                example="钙质来源：奶制品、绿叶蔬菜、豆制品、小鱼小虾"
            ),
            CoTStep(
                step_name="吸收促进建议",
                description="提供促进营养素吸收的方法",
                instruction="说明如何搭配饮食以提高营养素吸收率",
                example="维生素D可促进钙吸收，适量运动有助钙质利用"
            ),
            CoTStep(
                step_name="实用方案制定",
                description="制定日常补充的实用方案",
                instruction="给出具体的食谱建议和摄入量指导",
                example="每日推荐：牛奶250ml、豆腐100g、绿叶蔬菜200g"
            )
        ]
    
    def generate_prompt(self, context: PromptContext) -> str:
        knowledge_text = self._format_knowledge(context.retrieved_knowledge)
        cot_instruction = self._generate_cot_instruction()
        
        prompt = f"""{self.system_role}

**用户咨询**：{context.user_query}

**相关专业资料**：
{knowledge_text}

**分析思路**：
请按照以下步骤进行专业分析：

{cot_instruction}

**回答要求**：
1. 重点推荐天然食物来源，补充剂为辅
2. 考虑老年人的消化吸收特点
3. 给出具体的食物份量和搭配建议
4. 说明注意事项和禁忌情况
5. 语言简明易懂，便于老年人执行

请按照上述思路分析并给出专业的营养补充建议："""

        return prompt


class DietPlanningTemplate(BasePromptTemplate):
    """饮食规划模板"""
    
    def __init__(self):
        super().__init__("diet_planning", QueryIntent.DIET_PLANNING)
    
    def _get_system_role(self) -> str:
        return """您是一位专业的老年膳食规划师：
- 临床营养师资格，专注老年营养10年
- 擅长制定个性化的膳食计划
- 熟悉中式烹饪和老年人饮食习惯
- 注重营养平衡和口味搭配
- 考虑老年人的咀嚼、消化能力

您的专长是为老年人制定营养均衡、美味可口的饮食方案。"""
    
    def _define_cot_steps(self) -> List[CoTStep]:
        return [
            CoTStep(
                step_name="需求分析",
                description="分析用户的具体饮食规划需求",
                instruction="了解用户的健康状况、饮食偏好、特殊要求",
                example="需要控制血糖的糖尿病患者，偏爱清淡口味"
            ),
            CoTStep(
                step_name="营养目标设定",
                description="设定合理的营养目标",
                instruction="基于用户情况确定热量、蛋白质、维生素等营养目标",
                example="每日1800kcal，蛋白质占15-20%，膳食纤维25-30g"
            ),
            CoTStep(
                step_name="食物分类规划",
                description="按食物类别进行合理配置",
                instruction="安排谷物、蔬果、蛋白质、乳制品等各类食物比例",
                example="谷物250g、蔬菜400g、水果200g、肉类100g、奶类250ml"
            ),
            CoTStep(
                step_name="餐次分配",
                description="合理分配一日三餐和加餐",
                instruction="按照老年人消化特点安排餐次和份量",
                example="早餐30%、午餐40%、晚餐25%、加餐5%"
            ),
            CoTStep(
                step_name="具体食谱示例",
                description="提供具体的食谱搭配示例",
                instruction="给出1-2天的详细食谱，包括烹饪方式",
                example="早餐：小米粥+鸡蛋+凉拌黄瓜；午餐：糙米饭+清蒸鱼+炒菠菜"
            )
        ]
    
    def generate_prompt(self, context: PromptContext) -> str:
        knowledge_text = self._format_knowledge(context.retrieved_knowledge)
        cot_instruction = self._generate_cot_instruction()
        
        prompt = f"""{self.system_role}

**用户咨询**：{context.user_query}

**相关专业资料**：
{knowledge_text}

**分析思路**：
请按照以下步骤进行专业分析：

{cot_instruction}

**回答要求**：
1. 制定的饮食计划要营养均衡且实用
2. 考虑老年人的饮食习惯和能力
3. 提供具体的食物选择和烹饪建议
4. 给出可执行的购买和制作指导
5. 体现中式饮食文化特色

请按照上述思路分析并给出专业的饮食规划建议："""

        return prompt


class FoodSelectionTemplate(BasePromptTemplate):
    """食物选择指导模板"""
    
    def __init__(self):
        super().__init__("food_selection", QueryIntent.FOOD_SELECTION)
    
    def _get_system_role(self) -> str:
        return """您是一位老年营养与食品安全专家：
- 食品科学硕士，营养师执业证书
- 专门研究适合老年人的食物选择
- 熟悉各种食物的营养价值和安全性
- 了解老年人的消化特点和饮食禁忌
- 关注食物的新鲜度和制作安全

您致力于指导老年人选择安全、营养、适宜的食物。"""
    
    def _define_cot_steps(self) -> List[CoTStep]:
        return [
            CoTStep(
                step_name="食物评估",
                description="评估用户询问食物的营养价值",
                instruction="分析该食物的营养成分、热量、特殊功效",
                example="西瓜含水分多、糖分适中、富含维生素C和番茄红素"
            ),
            CoTStep(
                step_name="适宜性分析",
                description="分析该食物对老年人的适宜性",
                instruction="考虑老年人的消化能力、疾病状况、安全性",
                example="西瓜水分多易消化，但糖尿病患者需控制份量"
            ),
            CoTStep(
                step_name="食用建议",
                description="给出具体的食用建议",
                instruction="说明推荐食用量、食用时间、食用方式",
                example="建议每次100-150g，餐后1小时食用，常温为宜"
            ),
            CoTStep(
                step_name="注意事项",
                description="说明食用注意事项和禁忌",
                instruction="提醒特殊人群的注意事项和可能的副作用",
                example="肾功能不全者慎食，寒凉体质者不宜过量"
            ),
            CoTStep(
                step_name="替代建议",
                description="提供类似食物的替代选择",
                instruction="推荐营养类似但更适合的替代食物",
                example="可选择苹果、梨等温性水果作为替代"
            )
        ]
    
    def generate_prompt(self, context: PromptContext) -> str:
        knowledge_text = self._format_knowledge(context.retrieved_knowledge)
        cot_instruction = self._generate_cot_instruction()
        
        prompt = f"""{self.system_role}

**用户咨询**：{context.user_query}

**相关专业资料**：
{knowledge_text}

**分析思路**：
请按照以下步骤进行专业分析：

{cot_instruction}

**回答要求**：
1. 给出明确的"能吃"或"需注意"的建议
2. 说明具体的食用方法和注意事项
3. 考虑不同健康状况老年人的需求差异
4. 提供实用的选购和保存建议
5. 语言准确，避免绝对化表述

请按照上述思路分析并给出专业的食物选择建议："""

        return prompt 