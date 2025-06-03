#!/usr/bin/env python3
"""
检索器演示脚本
快速展示ElderDiet RAG检索器的核心功能
"""

import sys
import os

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from services.vector_store import VectorStore
from services.retriever import ElderNutritionRetriever, SearchConfig, SearchStrategy


def load_retriever():
    """加载检索器"""
    print("🚀 初始化ElderDiet RAG检索器...")
    
    # 加载向量存储
    vector_store = VectorStore(model_name="shibing624/text2vec-base-chinese")
    vector_store.load("data/vector_db")
    
    # 创建检索器
    retriever = ElderNutritionRetriever(vector_store)
    
    print(f"✅ 检索器已就绪，知识库包含 {vector_store.get_stats()['total_documents']} 个文档")
    return retriever


def demo_basic_search(retriever):
    """演示基础搜索功能"""
    print("\n" + "="*60)
    print("🔍 基础检索演示")
    print("="*60)
    
    queries = [
        "糖尿病老人应该怎么吃？",
        "高血压患者营养建议",
        "老年人缺钙补充"
    ]
    
    # 创建基础检索配置
    config = SearchConfig(top_k=2)
    
    for query in queries:
        print(f"\n💬 用户问题: {query}")
        print("-" * 40)
        
        results = retriever.search(query, config)
        
        for i, result in enumerate(results, 1):
            print(f"{i}. 📄 {result.title}")
            print(f"   🎯 相关性: {result.relevance_score:.3f}")
            print(f"   📝 {result.snippet}")
            print()


def demo_advanced_search(retriever):
    """演示高级检索功能"""
    print("\n" + "="*60)
    print("🧠 高级检索演示")
    print("="*60)
    
    # 混合检索策略
    config = SearchConfig(
        strategy=SearchStrategy.HYBRID,
        top_k=3,
        similarity_threshold=0.25,
        enable_reranking=True
    )
    
    query = "老年人心血管疾病预防营养"
    print(f"💬 复合查询: {query}")
    print("🎛️  使用策略: 混合检索 + 智能重排序")
    print("-" * 50)
    
    results = retriever.search(query, config)
    
    for i, result in enumerate(results, 1):
        print(f"{i}. 【{result.category}】{result.title}")
        print(f"   🎯 综合相关性: {result.relevance_score:.3f}")
        print(f"   📊 语义相似度: {result.similarity_score:.3f}")
        print(f"   🏷️  关键词: {', '.join(result.keywords[:4])}")
        print(f"   📝 {result.snippet}")
        print()


def demo_different_strategies(retriever):
    """演示不同检索策略"""
    print("\n" + "="*60)
    print("⚡ 检索策略对比")
    print("="*60)
    
    query = "便秘老人饮食调理"
    strategies = [
        (SearchStrategy.SEMANTIC_ONLY, "纯语义检索"),
        (SearchStrategy.HYBRID, "混合检索")
    ]
    
    print(f"💬 测试查询: {query}")
    print()
    
    for strategy, name in strategies:
        print(f"📊 {name}:")
        print("-" * 30)
        
        config = SearchConfig(strategy=strategy, top_k=2)
        results = retriever.search(query, config)
        
        for i, result in enumerate(results, 1):
            print(f"  {i}. {result.title}")
            print(f"     相关性: {result.relevance_score:.3f}")
        print()


def interactive_demo(retriever):
    """交互式演示"""
    print("\n" + "="*60)
    print("💬 交互式问答演示")
    print("="*60)
    print("请输入您的营养咨询问题，输入 'quit' 退出")
    
    while True:
        query = input("\n🤔 您的问题: ").strip()
        
        if query.lower() in ['quit', 'exit', '退出', 'q']:
            print("👋 感谢使用ElderDiet RAG系统！")
            break
        
        if not query:
            continue
        
        print("🔍 正在搜索相关信息...")
        
        # 使用混合检索获得最佳效果
        config = SearchConfig(
            strategy=SearchStrategy.HYBRID,
            top_k=3,
            similarity_threshold=0.2,
            enable_reranking=True
        )
        
        results = retriever.search(query, config)
        
        if results:
            print(f"\n📚 找到 {len(results)} 个相关资料:")
            print("=" * 40)
            
            for i, result in enumerate(results, 1):
                print(f"\n{i}. 📄 {result.title}")
                print(f"   📊 相关性: {result.relevance_score:.3f}")
                print(f"   📝 {result.snippet}")
                
                if i < len(results):
                    print("   " + "-" * 50)
        else:
            print("❌ 抱歉，未找到相关信息。请尝试其他关键词。")


def main():
    """主演示函数"""
    print("🌟 ElderDiet RAG检索器演示")
    print("="*60)
    print("基于AI的老年营养膳食智能问答系统")
    print()
    
    try:
        # 加载检索器
        retriever = load_retriever()
        
        # 演示各种功能
        demo_basic_search(retriever)
        demo_advanced_search(retriever)
        demo_different_strategies(retriever)
        
        # 交互式演示
        interactive_demo(retriever)
        
    except Exception as e:
        print(f"❌ 演示过程中出现错误: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main() 