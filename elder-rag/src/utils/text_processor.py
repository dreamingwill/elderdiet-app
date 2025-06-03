"""
文本预处理模块
用于处理中文营养知识文本，包括分词、清洗、向量化预处理
"""

import re
import jieba
import jieba.posseg as pseg
from typing import List, Dict, Any
import json

class TextProcessor:
    """文本预处理器"""
    
    def __init__(self):
        # 初始化jieba分词
        jieba.initialize()
        
        # 添加营养学专业词汇
        self._add_nutrition_keywords()
        
        # 停用词列表
        self.stopwords = self._load_stopwords()
    
    def _add_nutrition_keywords(self):
        """添加营养学专业词汇到jieba词典"""
        nutrition_keywords = [
            "糖尿病", "高血压", "心血管", "骨质疏松", "肌肉衰减",
            "膳食纤维", "蛋白质", "维生素", "矿物质", "微量元素",
            "血糖控制", "降压", "免疫力", "消化吸收", "水分平衡",
            "钙质", "维生素D", "维生素B族", "叶酸", "益生菌",
            "抗氧化", "不饱和脂肪酸", "饱和脂肪酸", "胆固醇",
            "燕麦", "糙米", "全谷类", "豆制品", "深绿色蔬菜"
        ]
        
        for keyword in nutrition_keywords:
            jieba.add_word(keyword, freq=1000, tag="nutrition")
    
    def _load_stopwords(self) -> set:
        """加载停用词"""
        # 基础停用词列表
        basic_stopwords = {
            "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", 
            "都", "一", "一个", "上", "也", "很", "到", "说", "要", "去",
            "你", "会", "着", "没有", "看", "好", "自己", "这", "那", "些",
            "以", "及", "等", "或", "但", "而", "如", "对", "为", "与"
        }
        return basic_stopwords
    
    def clean_text(self, text: str) -> str:
        """清洗文本"""
        if not text:
            return ""
        
        # 移除特殊字符，保留中文、英文、数字、常用标点
        text = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9，。；：！？、\-\+\(\)\[\]％%]', ' ', text)
        
        # 移除多余空格
        text = re.sub(r'\s+', ' ', text)
        
        # 去掉首尾空格
        text = text.strip()
        
        return text
    
    def tokenize(self, text: str, use_pos_tag: bool = False) -> List[str]:
        """
        中文分词
        
        Args:
            text: 输入文本
            use_pos_tag: 是否使用词性标注
            
        Returns:
            分词结果列表
        """
        # 清洗文本
        clean_text = self.clean_text(text)
        
        if not clean_text:
            return []
        
        if use_pos_tag:
            # 使用词性标注分词
            words_with_pos = pseg.cut(clean_text)
            # 只保留有意义的词性：名词、动词、形容词、专有名词等
            meaningful_pos = {'n', 'v', 'a', 'nr', 'ns', 'nt', 'nz', 'vn', 'an'}
            tokens = [word for word, pos in words_with_pos 
                     if pos in meaningful_pos and word not in self.stopwords and len(word) > 1]
        else:
            # 普通分词
            tokens = [word for word in jieba.cut(clean_text) 
                     if word not in self.stopwords and len(word) > 1]
        
        return tokens
    
    def extract_keywords(self, text: str, top_k: int = 10) -> List[str]:
        """
        提取关键词
        
        Args:
            text: 输入文本
            top_k: 返回前k个关键词
            
        Returns:
            关键词列表
        """
        import jieba.analyse
        
        # TF-IDF关键词提取
        keywords = jieba.analyse.extract_tags(text, topK=top_k, withWeight=False)
        
        return keywords
    
    def process_documents(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        批量处理文档
        
        Args:
            documents: 文档列表，每个文档包含title和content字段
            
        Returns:
            处理后的文档列表，添加tokens和keywords字段
        """
        processed_docs = []
        
        for doc in documents:
            processed_doc = doc.copy()
            
            # 合并标题和内容
            full_text = f"{doc.get('title', '')} {doc.get('content', '')}"
            
            # 分词
            tokens = self.tokenize(full_text, use_pos_tag=True)
            processed_doc['tokens'] = tokens
            
            # 提取关键词
            keywords = self.extract_keywords(full_text)
            processed_doc['extracted_keywords'] = keywords
            
            # 创建用于向量化的文本
            processed_doc['processed_text'] = ' '.join(tokens)
            
            processed_docs.append(processed_doc)
        
        return processed_docs

def test_text_processor():
    """测试文本处理器"""
    processor = TextProcessor()
    
    # 测试文本
    test_text = "糖尿病老年人应遵循以下饮食原则：控制总能量摄入，维持理想体重。"
    
    print("原文本:", test_text)
    print("清洗后:", processor.clean_text(test_text))
    print("分词结果:", processor.tokenize(test_text))
    print("关键词:", processor.extract_keywords(test_text))

if __name__ == "__main__":
    test_text_processor() 