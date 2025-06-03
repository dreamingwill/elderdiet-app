#!/usr/bin/env python3
"""
检索器功能测试脚本
验证智能检索、查询分析、结果过滤等功能
"""

import sys
import os
import json
import time

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from services.vector_store import VectorStore
from services.retriever import (
    ElderNutritionRetriever, 
    SearchConfig, 
    SearchStrategy,
    QueryProcessor,
    ResultProcessor
)
from utils.text_processor import TextProcessor


def setup_test_environment():
    """设置测试环境"""
    print("🚀 初始化测试环境")
    print("="*60)
    
    # 初始化向量存储
    print("正在加载向量数据库...")
    vector_store = VectorStore(model_name="shibing624/text2vec-base-chinese")
    
    # 尝试加载已存在的数据库
    db_path = "data/vector_db"
    if os.path.exists(db_path):
        vector_store.load(db_path)
        print(f"✅ 已加载现有数据库: {vector_store.get_stats()['total_documents']} 个文档")
    else:
        print("❌ 未找到现有数据库，请先运行 test_knowledge_base.py 构建知识库")
        return None
    
    return vector_store


def test_query_processor():
    """测试查询处理器"""
    print("\n" + "="*60)
    print("🔍 测试查询处理器")
    print("="*60)
    
    text_processor = TextProcessor()
    query_processor = QueryProcessor(text_processor)
    
    # 测试查询列表
    test_queries = [
        "糖尿病老人应该吃什么？",
        "高血压患者营养建议",
        "老年人缺钙",
        "便秘怎么办",
        "如何提升免疫力和抵抗力？",
        "燕麦对心血管有什么好处"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n🔍 查询 {i}: {query}")
        analysis = query_processor.analyze_query(query)
        
        print(f"  清洗后: {analysis['clean_query']}")
        print(f"  关键词: {analysis['keywords']}")
        print(f"  意图: {analysis['intent']}")
        print(f"  复杂度: {analysis['complexity']}")
        
        # 测试查询扩展
        expanded = query_processor.expand_query(analysis)
        if len(expanded) > 1:
            print(f"  扩展查询: {expanded[1:]}")


def test_search_strategies(retriever):
    """测试不同检索策略"""
    print("\n" + "="*60)
    print("🎯 测试检索策略")
    print("="*60)
    
    test_query = "糖尿病老人饮食注意事项"
    strategies = [
        (SearchStrategy.SEMANTIC_ONLY, "纯语义检索"),
        (SearchStrategy.KEYWORD_ENHANCED, "关键词增强检索"),
        (SearchStrategy.HYBRID, "混合检索"),
        (SearchStrategy.MULTI_QUERY, "多查询检索")
    ]
    
    for strategy, strategy_name in strategies:
        print(f"\n📊 {strategy_name}")
        print("-" * 40)
        
        config = SearchConfig(
            strategy=strategy,
            top_k=3,
            similarity_threshold=0.2,
            enable_reranking=True
        )
        
        start_time = time.time()
        results = retriever.search(test_query, config)
        search_time = time.time() - start_time
        
        print(f"检索时间: {search_time:.3f}s")
        print(f"结果数量: {len(results)}")
        
        for j, result in enumerate(results, 1):
            print(f"  {j}. {result.title}")
            print(f"     语义相似度: {result.similarity_score:.4f}")
            print(f"     综合相关性: {result.relevance_score:.4f}")
            print(f"     摘要: {result.snippet[:60]}...")


def test_advanced_search_features(retriever):
    """测试高级检索功能"""
    print("\n" + "="*60)
    print("🧠 测试高级检索功能")
    print("="*60)
    
    # 测试不同类型的查询
    advanced_queries = [
        {
            "query": "老年人高血压患者能吃什么蔬菜？",
            "description": "复合条件查询（年龄+疾病+食物类型）"
        },
        {
            "query": "维生素D不足怎么补充",
            "description": "营养素缺乏查询"
        },
        {
            "query": "心血管疾病预防",
            "description": "疾病预防查询"
        },
        {
            "query": "消化不良的老人应该避免哪些食物",
            "description": "症状+饮食禁忌查询"
        }
    ]
    
    for test_case in advanced_queries:
        query = test_case["query"]
        description = test_case["description"]
        
        print(f"\n🔍 {description}")
        print(f"查询: {query}")
        print("-" * 40)
        
        # 使用混合检索策略
        config = SearchConfig(
            strategy=SearchStrategy.HYBRID,
            top_k=3,
            similarity_threshold=0.25,
            enable_reranking=True
        )
        
        results = retriever.search(query, config)
        
        if results:
            for i, result in enumerate(results, 1):
                print(f"  {i}. 【{result.category}】{result.title}")
                print(f"     相关性: {result.relevance_score:.4f} | 相似度: {result.similarity_score:.4f}")
                print(f"     关键词: {', '.join(result.keywords[:5])}")
                print(f"     内容: {result.snippet}")
                print()
        else:
            print("  ❌ 未找到相关结果")


def test_threshold_filtering(retriever):
    """测试阈值过滤功能"""
    print("\n" + "="*60)
    print("⚖️  测试阈值过滤功能")
    print("="*60)
    
    test_query = "肌肉锻炼营养补充"
    thresholds = [0.1, 0.3, 0.5, 0.7]
    
    for threshold in thresholds:
        print(f"\n🎚️  相似度阈值: {threshold}")
        print("-" * 30)
        
        config = SearchConfig(
            strategy=SearchStrategy.SEMANTIC_ONLY,
            top_k=5,
            similarity_threshold=threshold,
            enable_reranking=False
        )
        
        results = retriever.search(test_query, config)
        print(f"结果数量: {len(results)}")
        
        for result in results:
            print(f"  {result.title} (相似度: {result.similarity_score:.4f})")


def test_performance_comparison(retriever):
    """测试性能对比"""
    print("\n" + "="*60)
    print("⚡ 性能对比测试")
    print("="*60)
    
    test_queries = [
        "糖尿病饮食建议",
        "高血压营养管理",
        "老年人钙质补充",
        "心血管疾病预防",
        "消化系统健康"
    ]
    
    configs = [
        (SearchConfig(strategy=SearchStrategy.SEMANTIC_ONLY, enable_reranking=False), "基础语义检索"),
        (SearchConfig(strategy=SearchStrategy.HYBRID, enable_reranking=True), "混合检索+重排序")
    ]
    
    for config, config_name in configs:
        print(f"\n📊 {config_name}")
        print("-" * 30)
        
        total_time = 0
        total_results = 0
        
        for query in test_queries:
            start_time = time.time()
            results = retriever.search(query, config)
            search_time = time.time() - start_time
            
            total_time += search_time
            total_results += len(results)
        
        avg_time = total_time / len(test_queries)
        avg_results = total_results / len(test_queries)
        
        print(f"  平均检索时间: {avg_time:.3f}s")
        print(f"  平均结果数量: {avg_results:.1f}")
        print(f"  总检索时间: {total_time:.3f}s")


def test_edge_cases(retriever):
    """测试边缘情况"""
    print("\n" + "="*60)
    print("🔬 边缘情况测试")
    print("="*60)
    
    edge_cases = [
        ("", "空查询"),
        ("a", "单字符查询"),
        ("糖尿病" * 50, "超长查询"),
        ("xyz123", "无意义查询"),
        ("？？？", "特殊字符查询"),
        ("老年人老年人老年人", "重复词查询")
    ]
    
    for query, description in edge_cases:
        print(f"\n🧪 {description}: '{query[:50]}{'...' if len(query) > 50 else ''}'")
        
        try:
            results = retriever.search(query)
            print(f"  ✅ 结果数量: {len(results)}")
            if results:
                print(f"  最高相似度: {results[0].similarity_score:.4f}")
        except Exception as e:
            print(f"  ❌ 错误: {str(e)}")


def generate_retriever_report(retriever):
    """生成检索器报告"""
    print("\n" + "="*60)
    print("📋 检索器功能报告")
    print("="*60)
    
    stats = retriever.get_search_stats()
    
    print("🏗️  系统配置:")
    print(f"  向量模型: {stats['vector_store_stats']['model_name']}")
    print(f"  向量维度: {stats['vector_store_stats']['vector_dimension']}")
    print(f"  文档总数: {stats['vector_store_stats']['total_documents']}")
    
    print("\n🎛️  检索配置:")
    for key, value in stats['config'].items():
        print(f"  {key}: {value}")
    
    print("\n✅ 已实现功能:")
    features = [
        "✓ 多种检索策略 (语义/关键词/混合/多查询)",
        "✓ 查询意图分析和分类",
        "✓ 查询扩展和改写",
        "✓ 结果过滤和阈值控制",
        "✓ 智能重排序算法",
        "✓ 结果摘要生成",
        "✓ 性能优化和缓存",
        "✓ 边缘情况处理"
    ]
    
    for feature in features:
        print(f"  {feature}")


def main():
    """主测试函数"""
    print("🧪 ElderDiet RAG 检索器测试")
    print("="*60)
    
    try:
        # 1. 设置测试环境
        vector_store = setup_test_environment()
        if not vector_store:
            return
        
        # 2. 初始化检索器
        print("\n正在初始化检索器...")
        retriever = ElderNutritionRetriever(vector_store)
        print("✅ 检索器初始化完成")
        
        # 3. 执行各项测试
        test_query_processor()
        test_search_strategies(retriever)
        test_advanced_search_features(retriever)
        test_threshold_filtering(retriever)
        test_performance_comparison(retriever)
        test_edge_cases(retriever)
        
        # 4. 生成报告
        generate_retriever_report(retriever)
        
        print("\n" + "="*60)
        print("🎉 检索器测试完成！")
        print("="*60)
        
        # 5. 简单交互测试
        print("\n💬 交互式测试 (输入 'quit' 退出):")
        while True:
            query = input("\n请输入查询: ").strip()
            if query.lower() in ['quit', 'exit', '退出', 'q']:
                break
            
            if query:
                print("🔍 检索中...")
                results = retriever.search(query)
                
                print(f"\n📊 找到 {len(results)} 个结果:")
                for i, result in enumerate(results, 1):
                    print(f"\n{i}. 【{result.category}】{result.title}")
                    print(f"   相关性: {result.relevance_score:.4f} | 相似度: {result.similarity_score:.4f}")
                    print(f"   {result.snippet}")
        
    except Exception as e:
        print(f"\n❌ 测试过程中出现错误: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main() 