"""
基于FAISS的向量存储模块
支持文档向量化、存储、检索功能
"""

import json
import numpy as np
import faiss
from typing import List, Dict, Any, Tuple
from sentence_transformers import SentenceTransformer
import pickle
import os

class VectorStore:
    """FAISS向量存储器"""
    
    def __init__(self, model_name: str = "shibing624/text2vec-base-chinese", dimension: int = 768):
        """
        初始化向量存储器
        
        Args:
            model_name: 句子向量模型名称
            dimension: 向量维度
        """
        self.model_name = model_name
        self.dimension = dimension
        
        # 初始化句子向量模型
        print(f"正在加载句子向量模型: {model_name}")
        self.encoder = SentenceTransformer(model_name)
        print("✅ 句子向量模型加载完成")
        
        # 初始化FAISS索引
        self.index = faiss.IndexFlatIP(dimension)  # 使用内积相似度
        
        # 存储文档元数据
        self.documents = []
        self.doc_ids = []
    
    def encode_texts(self, texts: List[str]) -> np.ndarray:
        """
        将文本编码为向量
        
        Args:
            texts: 文本列表
            
        Returns:
            向量矩阵
        """
        vectors = self.encoder.encode(texts, show_progress_bar=True)
        
        # 归一化向量（用于内积相似度）
        vectors = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
        
        return vectors.astype('float32')
    
    def add_documents(self, documents: List[Dict[str, Any]]):
        """
        添加文档到向量数据库
        
        Args:
            documents: 文档列表，每个文档需要包含processed_text字段
        """
        if not documents:
            return
        
        print(f"正在向量化 {len(documents)} 个文档...")
        
        # 提取文本内容
        texts = []
        for doc in documents:
            if 'processed_text' in doc:
                texts.append(doc['processed_text'])
            else:
                # 如果没有processed_text，使用title+content
                text = f"{doc.get('title', '')} {doc.get('content', '')}"
                texts.append(text)
        
        # 编码为向量
        vectors = self.encode_texts(texts)
        
        # 添加到FAISS索引
        self.index.add(vectors)
        
        # 存储文档元数据
        for i, doc in enumerate(documents):
            doc_with_id = doc.copy()
            doc_with_id['vector_id'] = len(self.documents) + i
            self.documents.append(doc_with_id)
            self.doc_ids.append(doc.get('id', f'doc_{len(self.documents)}'))
        
        print(f"✅ 成功添加 {len(documents)} 个文档到向量数据库")
        print(f"📊 当前数据库中共有 {len(self.documents)} 个文档")
    
    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        搜索相似文档
        
        Args:
            query: 查询文本
            top_k: 返回前k个结果
            
        Returns:
            相似文档列表，包含相似度分数
        """
        if self.index.ntotal == 0:
            return []
        
        # 编码查询文本
        query_vector = self.encode_texts([query])
        
        # 搜索相似向量
        scores, indices = self.index.search(query_vector, min(top_k, self.index.ntotal))
        
        # 组装结果
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.documents):
                result = self.documents[idx].copy()
                result['similarity_score'] = float(score)
                results.append(result)
        
        return results
    
    def get_stats(self) -> Dict[str, Any]:
        """获取向量数据库统计信息"""
        return {
            "total_documents": len(self.documents),
            "index_size": self.index.ntotal,
            "vector_dimension": self.dimension,
            "model_name": self.model_name
        }
    
    def save(self, save_dir: str):
        """
        保存向量数据库
        
        Args:
            save_dir: 保存目录
        """
        os.makedirs(save_dir, exist_ok=True)
        
        # 保存FAISS索引
        faiss.write_index(self.index, os.path.join(save_dir, "faiss_index.idx"))
        
        # 保存文档元数据
        with open(os.path.join(save_dir, "documents.json"), 'w', encoding='utf-8') as f:
            json.dump(self.documents, f, ensure_ascii=False, indent=2)
        
        # 保存配置信息
        config = {
            "model_name": self.model_name,
            "dimension": self.dimension,
            "doc_ids": self.doc_ids
        }
        with open(os.path.join(save_dir, "config.json"), 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 向量数据库已保存到: {save_dir}")
    
    def load(self, save_dir: str):
        """
        加载向量数据库
        
        Args:
            save_dir: 保存目录
        """
        # 加载配置
        config_path = os.path.join(save_dir, "config.json")
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"配置文件不存在: {config_path}")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # 验证模型配置
        if config["model_name"] != self.model_name:
            print(f"⚠️  模型名称不匹配: {config['model_name']} != {self.model_name}")
        
        # 加载FAISS索引
        index_path = os.path.join(save_dir, "faiss_index.idx")
        if os.path.exists(index_path):
            self.index = faiss.read_index(index_path)
        
        # 加载文档元数据
        docs_path = os.path.join(save_dir, "documents.json")
        if os.path.exists(docs_path):
            with open(docs_path, 'r', encoding='utf-8') as f:
                self.documents = json.load(f)
        
        self.doc_ids = config.get("doc_ids", [])
        
        print(f"✅ 向量数据库已从 {save_dir} 加载完成")
        print(f"📊 加载了 {len(self.documents)} 个文档")


def test_vector_store():
    """测试向量存储器"""
    # 创建测试数据
    test_docs = [
        {
            "id": "1",
            "title": "糖尿病营养",
            "content": "糖尿病患者需要控制血糖，合理饮食",
            "processed_text": "糖尿病 患者 控制 血糖 合理 饮食"
        },
        {
            "id": "2", 
            "title": "高血压饮食",
            "content": "高血压患者应该限制盐分摄入",
            "processed_text": "高血压 患者 限制 盐分 摄入"
        }
    ]
    
    # 初始化向量存储器
    print("初始化向量存储器...")
    vector_store = VectorStore()
    
    # 添加文档
    vector_store.add_documents(test_docs)
    
    # 测试搜索
    print("\n测试搜索:")
    query = "糖尿病怎么控制血糖"
    results = vector_store.search(query, top_k=2)
    
    print(f"查询: {query}")
    for i, result in enumerate(results):
        print(f"结果 {i+1}: {result['title']} (相似度: {result['similarity_score']:.4f})")
    
    # 显示统计信息
    print("\n数据库统计:")
    stats = vector_store.get_stats()
    for key, value in stats.items():
        print(f"{key}: {value}")

if __name__ == "__main__":
    test_vector_store() 