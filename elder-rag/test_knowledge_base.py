#!/usr/bin/env python3
"""
知识库构建和检索测试脚本
用于验证整个知识库构建流程
"""

import sys
import os
import json

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from utils.text_processor import TextProcessor
from services.vector_store import VectorStore

def load_nutrition_data():
    """加载营养知识数据"""
    data_path = "src/data/nutrition_knowledge.json"
    
    if not os.path.exists(data_path):
        print(f"❌ 数据文件不存在: {data_path}")
        return []
    
    with open(data_path, 'r', encoding='utf-8') as f:
        documents = json.load(f)
    
    print(f"✅ 成功加载 {len(documents)} 条营养知识")
    return documents

def test_text_processing(documents):
    """测试文本处理"""
    print("\n" + "="*50)
    print("🔧 测试文本处理模块")
    print("="*50)
    
    processor = TextProcessor()
    
    # 处理文档
    processed_docs = processor.process_documents(documents)
    
    # 显示处理结果示例
    if processed_docs:
        sample_doc = processed_docs[0]
        print(f"\n📄 示例文档处理结果:")
        print(f"标题: {sample_doc['title']}")
        print(f"原始内容: {sample_doc['content'][:100]}...")
        print(f"分词结果: {sample_doc['tokens'][:10]}...")
        print(f"提取关键词: {sample_doc['extracted_keywords']}")
        print(f"处理后文本: {sample_doc['processed_text'][:100]}...")
    
    return processed_docs

def test_vector_store(processed_docs):
    """测试向量存储"""
    print("\n" + "="*50)
    print("🗄️  测试向量存储模块")
    print("="*50)
    
    # 初始化向量存储器（使用较小的模型用于快速测试）
    print("正在初始化向量存储器...")
    vector_store = VectorStore(model_name="shibing624/text2vec-base-chinese")
    
    # 添加文档
    vector_store.add_documents(processed_docs)
    
    # 显示统计信息
    stats = vector_store.get_stats()
    print(f"\n📊 向量数据库统计:")
    for key, value in stats.items():
        print(f"  {key}: {value}")
    
    return vector_store

def test_search(vector_store):
    """测试搜索功能"""
    print("\n" + "="*50)
    print("🔍 测试检索功能")
    print("="*50)
    
    # 测试查询列表
    test_queries = [
        "糖尿病老年人应该怎么控制饮食？",
        "高血压患者需要注意什么营养？",
        "老年人缺钙怎么办？",
        "如何提升免疫力？",
        "便秘的老人吃什么好？"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n🔍 查询 {i}: {query}")
        results = vector_store.search(query, top_k=3)
        
        for j, result in enumerate(results, 1):
            print(f"  结果 {j}: {result['title']} (相似度: {result['similarity_score']:.4f})")
            print(f"    类别: {result.get('category', 'N/A')}")
            print(f"    内容摘要: {result['content'][:80]}...")
        
        if not results:
            print("  ❌ 未找到相关结果")

def test_save_and_load(vector_store):
    """测试保存和加载功能"""
    print("\n" + "="*50)
    print("💾 测试保存和加载功能")
    print("="*50)
    
    save_dir = "data/vector_db"
    
    # 保存
    print("正在保存向量数据库...")
    vector_store.save(save_dir)
    
    # 创建新的向量存储器并加载
    print("正在测试加载功能...")
    new_vector_store = VectorStore(model_name="shibing624/text2vec-base-chinese")
    new_vector_store.load(save_dir)
    
    # 验证加载是否成功
    original_stats = vector_store.get_stats()
    loaded_stats = new_vector_store.get_stats()
    
    print("📊 对比统计信息:")
    print(f"  原始文档数: {original_stats['total_documents']}")
    print(f"  加载文档数: {loaded_stats['total_documents']}")
    
    if original_stats['total_documents'] == loaded_stats['total_documents']:
        print("✅ 保存和加载功能正常")
        
        # 测试搜索是否仍然有效
        test_query = "糖尿病饮食建议"
        results = new_vector_store.search(test_query, top_k=2)
        print(f"\n🔍 加载后搜索测试: {test_query}")
        for result in results:
            print(f"  {result['title']} (相似度: {result['similarity_score']:.4f})")
    else:
        print("❌ 保存和加载功能异常")

def main():
    """主测试函数"""
    print("🚀 ElderDiet RAG 知识库构建测试")
    print("="*50)
    
    try:
        # 1. 加载数据
        documents = load_nutrition_data()
        if not documents:
            return
        
        # 2. 测试文本处理
        processed_docs = test_text_processing(documents)
        
        # 3. 测试向量存储
        vector_store = test_vector_store(processed_docs)
        
        # 4. 测试搜索
        test_search(vector_store)
        
        # 5. 测试保存和加载
        test_save_and_load(vector_store)
        
        print("\n" + "="*50)
        print("🎉 所有测试完成！知识库构建成功")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ 测试过程中出现错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 