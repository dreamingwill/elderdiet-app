#!/usr/bin/env python3
"""
Prompt系统演示脚本
展示ElderDiet RAG系统的Prompt生成功能
"""

import sys
import os

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from services.vector_store import VectorStore
from services.retriever import ElderNutritionRetriever, SearchConfig, SearchStrategy
from services.prompt_manager import PromptManager


def load_systems():
    """加载所有系统组件"""
    print("🚀 初始化ElderDiet RAG Prompt系统...")
    
    # 加载向量存储
    vector_store = VectorStore(model_name="shibing624/text2vec-base-chinese")
    vector_store.load("data/vector_db")
    
    # 初始化检索器和Prompt管理器
    retriever = ElderNutritionRetriever(vector_store)
    prompt_manager = PromptManager()
    
    print(f"✅ 系统已就绪，知识库包含 {vector_store.get_stats()['total_documents']} 个文档")
    return retriever, prompt_manager


def demo_intent_classification(prompt_manager):
    """演示意图分类功能"""
    print("\n" + "="*60)
    print("🧠 意图分类演示")
    print("="*60)
    
    test_queries = [
        "糖尿病老人应该怎么控制饮食？",
        "老年人缺钙应该怎么补充？",
        "高血压患者能吃鸡蛋吗？",
        "帮我制定一个老年人的健康食谱"
    ]
    
    for query in test_queries:
        # 分析查询复杂度和意图
        analysis = prompt_manager.analyze_query_complexity(query)
        
        print(f"\n🔍 查询: {query}")
        print(f"   意图: {analysis['primary_intent'][0].value}")
        print(f"   置信度: {analysis['primary_intent'][1]:.3f}")
        print(f"   复杂度: {analysis['complexity']}")


def demo_prompt_generation(retriever, prompt_manager):
    """演示Prompt生成功能"""
    print("\n" + "="*60)
    print("🎨 Prompt生成演示")
    print("="*60)
    
    query = "糖尿病老人应该怎么控制饮食？"
    print(f"💬 用户查询: {query}")
    
    # 1. 检索相关知识
    print("\n🔍 步骤1: 检索相关知识")
    search_config = SearchConfig(
        strategy=SearchStrategy.HYBRID,
        top_k=2,
        similarity_threshold=0.2
    )
    search_results = retriever.search(query, search_config)
    print(f"✅ 检索到 {len(search_results)} 个相关文档")
    
    for i, result in enumerate(search_results, 1):
        print(f"   {i}. {result.title} (相关性: {result.relevance_score:.3f})")
    
    # 2. 生成基础Prompt
    print("\n🎭 步骤2: 生成基础Prompt")
    basic_prompt = prompt_manager.generate_prompt(
        user_query=query,
        search_results=search_results,
        use_few_shot=False
    )
    
    print(f"📊 基础Prompt信息:")
    print(f"   长度: {len(basic_prompt)} 字符")
    
    # 3. 生成增强Prompt (带Few-shot)
    print("\n🎓 步骤3: 生成Few-shot增强Prompt")
    enhanced_prompt = prompt_manager.generate_prompt(
        user_query=query,
        search_results=search_results,
        use_few_shot=True
    )
    
    print(f"📊 增强Prompt信息:")
    print(f"   长度: {len(enhanced_prompt)} 字符")
    print(f"   增强内容: {len(enhanced_prompt) - len(basic_prompt)} 字符")
    
    # 4. 质量分析
    print("\n📊 步骤4: Prompt质量分析")
    quality = prompt_manager.validate_prompt_quality(enhanced_prompt)
    print(f"   质量等级: {quality['quality_level']}")
    print(f"   质量分数: {quality['score']}/100")
    
    if quality['issues']:
        print(f"   发现问题: {', '.join(quality['issues'])}")
    else:
        print("   ✅ 质量良好，无问题发现")
    
    # 5. 显示Prompt示例
    print("\n📝 步骤5: Prompt预览")
    print("="*50)
    preview_length = min(400, len(enhanced_prompt))
    print(enhanced_prompt[:preview_length])
    if len(enhanced_prompt) > preview_length:
        print("...")
        print(f"(显示前{preview_length}字符，总长度{len(enhanced_prompt)}字符)")


def demo_different_intents(retriever, prompt_manager):
    """演示不同意图的Prompt生成"""
    print("\n" + "="*60)
    print("🎯 不同意图Prompt演示")
    print("="*60)
    
    intent_examples = [
        {
            "query": "老年人缺钙应该怎么补充？",
            "intent_name": "营养素缺乏咨询"
        },
        {
            "query": "高血压患者能吃鸡蛋吗？",
            "intent_name": "食物选择指导"
        },
        {
            "query": "帮我制定一个老年人的健康食谱",
            "intent_name": "饮食规划制定"
        }
    ]
    
    for example in intent_examples:
        query = example["query"]
        intent_name = example["intent_name"]
        
        print(f"\n🔍 {intent_name}")
        print(f"查询: {query}")
        print("-" * 40)
        
        # 检索和生成prompt
        search_results = retriever.search(query, SearchConfig(top_k=2))
        prompt = prompt_manager.generate_prompt(
            user_query=query,
            search_results=search_results,
            use_few_shot=False
        )
        
        # 分析
        analysis = prompt_manager.analyze_query_complexity(query)
        quality = prompt_manager.validate_prompt_quality(prompt)
        
        print(f"✅ 识别意图: {analysis['primary_intent'][0].value}")
        print(f"📊 检索文档: {len(search_results)} 个")
        print(f"📝 Prompt长度: {len(prompt)} 字符")
        print(f"🎯 质量等级: {quality['quality_level']}")


def interactive_demo(retriever, prompt_manager):
    """交互式演示"""
    print("\n" + "="*60)
    print("💬 交互式Prompt生成演示")
    print("="*60)
    print("请输入您的营养咨询问题，系统将生成专业的prompt")
    print("输入 'quit' 退出演示")
    
    while True:
        query = input("\n🤔 您的问题: ").strip()
        
        if query.lower() in ['quit', 'exit', '退出', 'q']:
            print("👋 演示结束，感谢使用！")
            break
        
        if not query:
            continue
        
        print("🔄 生成专业Prompt中...")
        
        try:
            # 1. 检索相关知识
            search_results = retriever.search(
                query, 
                SearchConfig(strategy=SearchStrategy.HYBRID, top_k=2)
            )
            
            # 2. 生成prompt
            prompt = prompt_manager.generate_prompt(
                user_query=query,
                search_results=search_results,
                use_few_shot=True
            )
            
            # 3. 分析结果
            analysis = prompt_manager.analyze_query_complexity(query)
            quality = prompt_manager.validate_prompt_quality(prompt)
            
            print(f"\n📊 生成结果:")
            print(f"   🎯 识别意图: {analysis['primary_intent'][0].value}")
            print(f"   📊 查询复杂度: {analysis['complexity']}")
            print(f"   📚 检索文档: {len(search_results)} 个")
            print(f"   📝 Prompt长度: {len(prompt)} 字符")
            print(f"   🌟 质量等级: {quality['quality_level']}")
            print(f"   💯 质量分数: {quality['score']}/100")
            
            # 4. 显示prompt预览
            print(f"\n📋 生成的专业Prompt (前300字符):")
            print("="*50)
            preview = prompt[:300] + "..." if len(prompt) > 300 else prompt
            print(preview)
            
            # 5. 询问是否查看完整prompt
            show_full = input("\n是否查看完整Prompt? (y/n): ").strip().lower()
            if show_full in ['y', 'yes', '是']:
                print("\n📄 完整Prompt:")
                print("="*60)
                print(prompt)
                print("="*60)
        
        except Exception as e:
            print(f"❌ 生成过程中出现错误: {str(e)}")


def main():
    """主演示函数"""
    print("🌟 ElderDiet RAG Prompt系统演示")
    print("="*60)
    print("基于AI的老年营养咨询专业Prompt生成系统")
    print()
    
    try:
        # 加载系统
        retriever, prompt_manager = load_systems()
        
        # 各种演示
        demo_intent_classification(prompt_manager)
        demo_prompt_generation(retriever, prompt_manager)
        demo_different_intents(retriever, prompt_manager)
        
        # 交互式演示
        interactive_demo(retriever, prompt_manager)
        
    except Exception as e:
        print(f"❌ 演示过程中出现错误: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main() 