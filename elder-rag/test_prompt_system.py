#!/usr/bin/env python3
"""
Prompt系统测试脚本
测试意图识别、模板选择、Few-shot示例、Prompt生成等功能
"""

import sys
import os
import json

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from services.vector_store import VectorStore
from services.retriever import ElderNutritionRetriever, SearchConfig, SearchStrategy
from services.prompt_manager import PromptManager, IntentClassifier
from services.prompt_template import QueryIntent
from services.few_shot_examples import FewShotExampleManager


def setup_test_environment():
    """设置测试环境"""
    print("🚀 初始化Prompt系统测试环境")
    print("="*60)
    
    # 初始化向量存储和检索器
    print("正在加载向量数据库...")
    vector_store = VectorStore(model_name="shibing624/text2vec-base-chinese")
    
    db_path = "data/vector_db"
    if os.path.exists(db_path):
        vector_store.load(db_path)
        print(f"✅ 已加载向量数据库: {vector_store.get_stats()['total_documents']} 个文档")
    else:
        print("❌ 未找到向量数据库，请先运行 test_knowledge_base.py")
        return None, None
    
    # 初始化组件
    retriever = ElderNutritionRetriever(vector_store)
    prompt_manager = PromptManager()
    
    print("✅ Prompt系统初始化完成")
    return retriever, prompt_manager


def test_intent_classification():
    """测试意图分类功能"""
    print("\n" + "="*60)
    print("🧠 测试意图分类功能")
    print("="*60)
    
    classifier = IntentClassifier()
    
    # 测试查询列表
    test_queries = [
        # 疾病营养咨询
        ("糖尿病老人应该怎么控制饮食？", QueryIntent.DISEASE_NUTRITION),
        ("高血压患者有什么饮食禁忌？", QueryIntent.DISEASE_NUTRITION),
        ("心血管疾病老人营养管理", QueryIntent.DISEASE_NUTRITION),
        
        # 营养素缺乏
        ("老年人缺钙怎么补充？", QueryIntent.NUTRIENT_DEFICIENCY),
        ("维生素D不足如何改善？", QueryIntent.NUTRIENT_DEFICIENCY),
        ("缺铁性贫血吃什么好？", QueryIntent.NUTRIENT_DEFICIENCY),
        
        # 饮食规划
        ("帮我制定一个老年人的一日食谱", QueryIntent.DIET_PLANNING),
        ("如何安排三餐营养搭配？", QueryIntent.DIET_PLANNING),
        ("老人膳食计划怎么做？", QueryIntent.DIET_PLANNING),
        
        # 食物选择
        ("糖尿病老人能吃西瓜吗？", QueryIntent.FOOD_SELECTION),
        ("高血压患者可以吃鸡蛋吗？", QueryIntent.FOOD_SELECTION),
        ("什么食物适合老年人？", QueryIntent.FOOD_SELECTION),
        
        # 混合查询
        ("糖尿病老人能吃什么水果，请推荐一些", QueryIntent.DISEASE_NUTRITION)
    ]
    
    correct_predictions = 0
    
    for query, expected_intent in test_queries:
        predicted_intent, confidence = classifier.classify_intent(query)
        is_correct = predicted_intent == expected_intent
        
        print(f"\n🔍 查询: {query}")
        print(f"   预期意图: {expected_intent.value}")
        print(f"   预测意图: {predicted_intent.value}")
        print(f"   置信度: {confidence:.3f}")
        print(f"   结果: {'✅ 正确' if is_correct else '❌ 错误'}")
        
        if is_correct:
            correct_predictions += 1
        
        # 显示多意图分析
        multiple_intents = classifier.get_multiple_intents(query)
        if len(multiple_intents) > 1:
            print(f"   多意图: {[(intent.value, score) for intent, score in multiple_intents]}")
    
    accuracy = correct_predictions / len(test_queries)
    print(f"\n📊 意图分类准确率: {accuracy:.2%} ({correct_predictions}/{len(test_queries)})")


def test_template_selection():
    """测试模板选择功能"""
    print("\n" + "="*60)
    print("🎭 测试模板选择功能")
    print("="*60)
    
    prompt_manager = PromptManager()
    
    # 测试不同意图的模板信息
    intents_to_test = [
        QueryIntent.DISEASE_NUTRITION,
        QueryIntent.NUTRIENT_DEFICIENCY,
        QueryIntent.DIET_PLANNING,
        QueryIntent.FOOD_SELECTION
    ]
    
    for intent in intents_to_test:
        print(f"\n📋 {intent.value} 模板信息:")
        template_info = prompt_manager.get_template_info(intent)
        
        print(f"   模板名称: {template_info['template_name']}")
        print(f"   CoT步骤数: {len(template_info['cot_steps'])}")
        
        print("   推理步骤:")
        for i, step in enumerate(template_info['cot_steps'], 1):
            print(f"     {i}. {step['step_name']}: {step['description']}")


def test_few_shot_examples():
    """测试Few-shot示例功能"""
    print("\n" + "="*60)
    print("📚 测试Few-shot示例功能")
    print("="*60)
    
    few_shot_manager = FewShotExampleManager()
    
    # 测试每种意图的示例
    intents_to_test = [
        QueryIntent.DISEASE_NUTRITION,
        QueryIntent.NUTRIENT_DEFICIENCY,
        QueryIntent.FOOD_SELECTION,
        QueryIntent.DIET_PLANNING
    ]
    
    for intent in intents_to_test:
        print(f"\n🎯 {intent.value} 示例:")
        examples = few_shot_manager.get_examples_by_intent(intent)
        
        print(f"   可用示例数: {len(examples)}")
        
        if examples:
            example = examples[0]
            print(f"   示例查询: {example.user_query}")
            print(f"   推理步骤数: {len(example.reasoning_steps)}")
            print(f"   回答长度: {len(example.expert_response)} 字符")


def test_prompt_generation(retriever, prompt_manager):
    """测试完整的Prompt生成功能"""
    print("\n" + "="*60)
    print("🎨 测试完整Prompt生成功能")
    print("="*60)
    
    # 测试查询列表
    test_cases = [
        {
            "query": "糖尿病老人应该怎么控制饮食？",
            "description": "疾病营养咨询 - 典型糖尿病查询"
        },
        {
            "query": "老年人缺钙应该怎么补充？",
            "description": "营养素缺乏 - 钙质补充查询"
        },
        {
            "query": "高血压患者能吃鸡蛋吗？",
            "description": "食物选择 - 特定食物询问"
        },
        {
            "query": "帮我制定一个老年人的健康食谱",
            "description": "饮食规划 - 食谱制定请求"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        query = test_case["query"]
        description = test_case["description"]
        
        print(f"\n🧪 测试案例 {i}: {description}")
        print(f"查询: {query}")
        print("-" * 50)
        
        # 1. 检索相关知识
        search_config = SearchConfig(
            strategy=SearchStrategy.HYBRID,
            top_k=3,
            similarity_threshold=0.2
        )
        search_results = retriever.search(query, search_config)
        
        print(f"✅ 检索到 {len(search_results)} 个相关文档")
        
        # 2. 生成Prompt (不使用few-shot以节省空间)
        prompt = prompt_manager.generate_prompt(
            user_query=query,
            search_results=search_results,
            use_few_shot=False
        )
        
        # 3. 分析Prompt质量
        quality_info = prompt_manager.validate_prompt_quality(prompt)
        
        print(f"📊 Prompt质量分析:")
        print(f"   长度: {quality_info['prompt_length']} 字符")
        print(f"   质量等级: {quality_info['quality_level']}")
        print(f"   质量分数: {quality_info['score']}/100")
        
        if quality_info['issues']:
            print(f"   问题: {', '.join(quality_info['issues'])}")
        
        # 4. 显示Prompt片段
        prompt_preview = prompt[:300] + "..." if len(prompt) > 300 else prompt
        print(f"\n📝 Prompt预览:\n{prompt_preview}")


def test_query_complexity_analysis(prompt_manager):
    """测试查询复杂度分析"""
    print("\n" + "="*60)
    print("📊 测试查询复杂度分析")
    print("="*60)
    
    # 不同复杂度的查询
    complexity_test_cases = [
        {
            "query": "老人吃什么好？",
            "expected_complexity": "simple"
        },
        {
            "query": "糖尿病老人应该如何控制血糖饮食？",
            "expected_complexity": "medium"
        },
        {
            "query": "患有糖尿病和高血压并发症的老年人，在服用降压药物期间，应该如何安排一日三餐的营养搭配以及注意哪些食物相互作用？",
            "expected_complexity": "complex"
        }
    ]
    
    for test_case in complexity_test_cases:
        query = test_case["query"]
        expected = test_case["expected_complexity"]
        
        analysis = prompt_manager.analyze_query_complexity(query)
        
        print(f"\n🔍 查询: {query}")
        print(f"   预期复杂度: {expected}")
        print(f"   分析复杂度: {analysis['complexity']}")
        print(f"   复杂度分数: {analysis['complexity_score']}")
        print(f"   查询长度: {analysis['query_length']} 字符")
        print(f"   词汇数: {analysis['word_count']} 个")
        
        if analysis['multiple_intents']:
            print(f"   多意图: {[(intent.value, score) for intent, score in analysis['multiple_intents']]}")
        
        result = "✅ 匹配" if analysis['complexity'] == expected else "❌ 不匹配"
        print(f"   结果: {result}")


def test_prompt_with_few_shot_examples(retriever, prompt_manager):
    """测试带Few-shot示例的Prompt生成"""
    print("\n" + "="*60)
    print("🎓 测试Few-shot增强Prompt")
    print("="*60)
    
    query = "糖尿病老人饮食控制的具体方法"
    
    print(f"🔍 测试查询: {query}")
    
    # 检索知识
    search_results = retriever.search(query, SearchConfig(top_k=2))
    
    # 生成两种Prompt进行对比
    print("\n📋 对比测试:")
    
    # 无Few-shot示例
    prompt_without_examples = prompt_manager.generate_prompt(
        user_query=query,
        search_results=search_results,
        use_few_shot=False
    )
    
    # 有Few-shot示例
    prompt_with_examples = prompt_manager.generate_prompt(
        user_query=query,
        search_results=search_results,
        use_few_shot=True
    )
    
    print(f"1. 无Few-shot示例:")
    print(f"   长度: {len(prompt_without_examples)} 字符")
    
    print(f"\n2. 有Few-shot示例:")
    print(f"   长度: {len(prompt_with_examples)} 字符")
    print(f"   增加长度: {len(prompt_with_examples) - len(prompt_without_examples)} 字符")
    
    # 质量对比
    quality_without = prompt_manager.validate_prompt_quality(prompt_without_examples)
    quality_with = prompt_manager.validate_prompt_quality(prompt_with_examples)
    
    print(f"\n📊 质量对比:")
    print(f"   无Few-shot: {quality_without['score']}/100 ({quality_without['quality_level']})")
    print(f"   有Few-shot: {quality_with['score']}/100 ({quality_with['quality_level']})")


def generate_prompt_system_report(prompt_manager):
    """生成Prompt系统报告"""
    print("\n" + "="*60)
    print("📋 Prompt系统功能报告")
    print("="*60)
    
    print("🏗️  系统组件:")
    print("  ✓ 意图分类器 (IntentClassifier)")
    print("  ✓ Prompt模板系统 (4种专业模板)")
    print("  ✓ Few-shot示例管理器")
    print("  ✓ Prompt管理器 (PromptManager)")
    
    print("\n🎯 支持的查询意图:")
    intents = [
        ("疾病营养咨询", "糖尿病、高血压等疾病的营养管理"),
        ("营养素缺乏", "钙、铁、维生素等营养素补充"),
        ("饮食规划", "一日食谱、膳食计划制定"),
        ("食物选择", "特定食物的适宜性判断"),
        ("症状缓解", "便秘、失眠等症状的饮食调理"),
        ("一般营养", "通用营养咨询")
    ]
    
    for intent_name, description in intents:
        print(f"  ✓ {intent_name}: {description}")
    
    print("\n🧠 Chain-of-Thought推理:")
    print("  ✓ 疾病分析 → 营养需求评估 → 饮食原则制定 → 具体建议 → 注意事项")
    print("  ✓ 结构化推理步骤，确保专业性和完整性")
    print("  ✓ 每个模板都有5个推理步骤")
    
    print("\n📚 Few-shot示例库:")
    few_shot_manager = FewShotExampleManager()
    total_examples = len(few_shot_manager.examples)
    print(f"  ✓ 总示例数: {total_examples} 个")
    print("  ✓ 覆盖4种主要查询类型")
    print("  ✓ 包含完整的推理过程和专业回答")
    
    print("\n⚙️ 智能功能:")
    print("  ✓ 自动意图识别和置信度评估")
    print("  ✓ 动态模板选择")
    print("  ✓ 查询复杂度分析")
    print("  ✓ Prompt质量验证")
    print("  ✓ 知识检索结果自动格式化")
    
    print("\n📊 性能特点:")
    print("  ✓ 支持实时prompt生成")
    print("  ✓ 模块化设计，易于扩展")
    print("  ✓ 专业的营养师角色设定")
    print("  ✓ 适合老年人的表达风格")


def main():
    """主测试函数"""
    print("🧪 ElderDiet RAG Prompt系统测试")
    print("="*60)
    
    try:
        # 1. 设置测试环境
        retriever, prompt_manager = setup_test_environment()
        if not retriever or not prompt_manager:
            return
        
        # 2. 执行各项测试
        test_intent_classification()
        test_template_selection()
        test_few_shot_examples()
        test_prompt_generation(retriever, prompt_manager)
        test_query_complexity_analysis(prompt_manager)
        test_prompt_with_few_shot_examples(retriever, prompt_manager)
        
        # 3. 生成系统报告
        generate_prompt_system_report(prompt_manager)
        
        print("\n" + "="*60)
        print("🎉 Prompt系统测试完成！")
        print("="*60)
        
        # 4. 简单交互测试
        print("\n💬 交互式Prompt生成测试 (输入 'quit' 退出):")
        while True:
            query = input("\n请输入测试查询: ").strip()
            if query.lower() in ['quit', 'exit', '退出', 'q']:
                print("👋 测试结束！")
                break
            
            if query:
                print("🔄 生成Prompt中...")
                
                # 检索
                search_results = retriever.search(query, SearchConfig(top_k=2))
                
                # 生成prompt
                prompt = prompt_manager.generate_prompt(
                    user_query=query,
                    search_results=search_results,
                    use_few_shot=False  # 为了显示简洁
                )
                
                # 分析
                complexity = prompt_manager.analyze_query_complexity(query)
                quality = prompt_manager.validate_prompt_quality(prompt)
                
                print(f"\n📊 分析结果:")
                print(f"   查询复杂度: {complexity['complexity']}")
                print(f"   主要意图: {complexity['primary_intent'][0].value}")
                print(f"   检索文档: {len(search_results)} 个")
                print(f"   Prompt长度: {len(prompt)} 字符")
                print(f"   质量等级: {quality['quality_level']}")
                
                # 显示prompt预览
                print(f"\n📝 Prompt预览 (前200字符):")
                print(prompt[:200] + "..." if len(prompt) > 200 else prompt)
        
    except Exception as e:
        print(f"\n❌ 测试过程中出现错误: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main() 