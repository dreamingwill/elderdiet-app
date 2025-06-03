"""
基于RAG的智能检索器
提供语义检索、查询扩展、结果过滤等功能
"""

import re
import json
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import numpy as np

from .vector_store import VectorStore
from utils.text_processor import TextProcessor


class SearchStrategy(Enum):
    """检索策略枚举"""
    SEMANTIC_ONLY = "semantic_only"      # 纯语义检索
    KEYWORD_ENHANCED = "keyword_enhanced"  # 关键词增强检索
    HYBRID = "hybrid"                    # 混合检索
    MULTI_QUERY = "multi_query"          # 多查询检索


@dataclass
class SearchConfig:
    """检索配置"""
    strategy: SearchStrategy = SearchStrategy.SEMANTIC_ONLY
    top_k: int = 5
    similarity_threshold: float = 0.3
    max_content_length: int = 500
    enable_query_expansion: bool = True
    enable_reranking: bool = True


@dataclass 
class SearchResult:
    """检索结果"""
    document_id: str
    title: str
    content: str
    category: str
    keywords: List[str]
    similarity_score: float
    relevance_score: float  # 综合相关性分数
    snippet: str  # 高亮摘要


class QueryProcessor:
    """查询处理器"""
    
    def __init__(self, text_processor: TextProcessor):
        self.text_processor = text_processor
        
        # 查询意图分类
        self.intent_patterns = {
            "nutrition_query": [
                r"营养|维生素|矿物质|蛋白质|膳食",
                r"吃什么|怎么吃|如何补充"
            ],
            "disease_query": [
                r"糖尿病|高血压|心血管|骨质疏松",
                r"患者|病人|疾病"
            ],
            "symptom_query": [
                r"便秘|失眠|消化不良|食欲不振",
                r"症状|不适|问题"
            ],
            "food_query": [
                r"食物|食品|蔬菜|水果|肉类",
                r"能不能吃|可以吃|适合吃"
            ]
        }
    
    def analyze_query(self, query: str) -> Dict[str, Any]:
        """
        分析查询意图和特征
        
        Args:
            query: 用户查询
            
        Returns:
            查询分析结果
        """
        # 基础处理
        clean_query = self.text_processor.clean_text(query)
        tokens = self.text_processor.tokenize(clean_query)
        keywords = self.text_processor.extract_keywords(clean_query)
        
        # 意图识别
        intent = self._detect_intent(query)
        
        # 查询复杂度评估
        complexity = self._assess_complexity(query, tokens)
        
        return {
            "original_query": query,
            "clean_query": clean_query,
            "tokens": tokens,
            "keywords": keywords,
            "intent": intent,
            "complexity": complexity,
            "length": len(query),
            "token_count": len(tokens)
        }
    
    def _detect_intent(self, query: str) -> List[str]:
        """检测查询意图"""
        intents = []
        
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, query):
                    intents.append(intent)
                    break
        
        return intents if intents else ["general_query"]
    
    def _assess_complexity(self, query: str, tokens: List[str]) -> str:
        """评估查询复杂度"""
        # 简单规则判断
        if len(tokens) <= 3:
            return "simple"
        elif len(tokens) <= 8:
            return "medium"
        else:
            return "complex"
    
    def expand_query(self, query_analysis: Dict[str, Any]) -> List[str]:
        """
        查询扩展
        
        Args:
            query_analysis: 查询分析结果
            
        Returns:
            扩展后的查询列表
        """
        expanded_queries = [query_analysis["original_query"]]
        
        # 基于关键词扩展
        keywords = query_analysis["keywords"]
        if len(keywords) >= 2:
            # 组合不同关键词
            expanded_queries.append(" ".join(keywords[:3]))
        
        # 基于意图扩展
        intents = query_analysis["intent"]
        if "disease_query" in intents:
            # 添加饮食相关词汇
            expanded_queries.append(f"{query_analysis['clean_query']} 饮食 营养")
        
        if "nutrition_query" in intents:
            # 添加老年人相关词汇
            expanded_queries.append(f"老年人 {query_analysis['clean_query']}")
        
        return expanded_queries


class ResultProcessor:
    """结果处理器"""
    
    def __init__(self, config: SearchConfig):
        self.config = config
    
    def filter_results(self, results: List[Dict[str, Any]], query_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        过滤搜索结果
        
        Args:
            results: 原始搜索结果
            query_analysis: 查询分析结果
            
        Returns:
            过滤后的结果
        """
        filtered_results = []
        
        for result in results:
            # 相似度阈值过滤
            if result.get("similarity_score", 0) < self.config.similarity_threshold:
                continue
            
            # 内容长度过滤
            content = result.get("content", "")
            if len(content) > self.config.max_content_length:
                result["content"] = content[:self.config.max_content_length] + "..."
            
            filtered_results.append(result)
        
        return filtered_results
    
    def rerank_results(self, results: List[Dict[str, Any]], query_analysis: Dict[str, Any]) -> List[SearchResult]:
        """
        重新排序结果
        
        Args:
            results: 搜索结果
            query_analysis: 查询分析结果
            
        Returns:
            重排序后的结果
        """
        if not self.config.enable_reranking:
            return self._convert_to_search_results(results)
        
        # 计算综合相关性分数
        for result in results:
            relevance_score = self._calculate_relevance_score(result, query_analysis)
            result["relevance_score"] = relevance_score
        
        # 按综合分数排序
        results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        
        return self._convert_to_search_results(results)
    
    def _calculate_relevance_score(self, result: Dict[str, Any], query_analysis: Dict[str, Any]) -> float:
        """计算综合相关性分数"""
        # 基础语义相似度 (权重: 0.6)
        semantic_score = result.get("similarity_score", 0) * 0.6
        
        # 关键词匹配度 (权重: 0.3)
        keyword_score = self._calculate_keyword_score(result, query_analysis) * 0.3
        
        # 类别匹配度 (权重: 0.1)
        category_score = self._calculate_category_score(result, query_analysis) * 0.1
        
        return semantic_score + keyword_score + category_score
    
    def _calculate_keyword_score(self, result: Dict[str, Any], query_analysis: Dict[str, Any]) -> float:
        """计算关键词匹配分数"""
        query_keywords = set(query_analysis.get("keywords", []))
        result_keywords = set(result.get("extracted_keywords", []))
        
        if not query_keywords:
            return 0.0
        
        # 计算交集比例
        intersection = query_keywords.intersection(result_keywords)
        return len(intersection) / len(query_keywords)
    
    def _calculate_category_score(self, result: Dict[str, Any], query_analysis: Dict[str, Any]) -> float:
        """计算类别匹配分数"""
        # 简单的类别-意图映射
        intent_category_map = {
            "disease_query": ["疾病营养", "特殊人群"],
            "nutrition_query": ["营养素", "营养原则"],
            "food_query": ["食物选择"],
            "symptom_query": ["健康问题"]
        }
        
        result_category = result.get("category", "")
        query_intents = query_analysis.get("intent", [])
        
        for intent in query_intents:
            if intent in intent_category_map:
                if result_category in intent_category_map[intent]:
                    return 1.0
        
        return 0.0
    
    def _convert_to_search_results(self, results: List[Dict[str, Any]]) -> List[SearchResult]:
        """转换为SearchResult对象"""
        search_results = []
        
        for result in results:
            # 生成摘要片段
            snippet = self._generate_snippet(result.get("content", ""))
            
            search_result = SearchResult(
                document_id=result.get("id", ""),
                title=result.get("title", ""),
                content=result.get("content", ""),
                category=result.get("category", ""),
                keywords=result.get("extracted_keywords", []),
                similarity_score=result.get("similarity_score", 0.0),
                relevance_score=result.get("relevance_score", 0.0),
                snippet=snippet
            )
            
            search_results.append(search_result)
        
        return search_results
    
    def _generate_snippet(self, content: str, max_length: int = 150) -> str:
        """生成内容摘要"""
        if len(content) <= max_length:
            return content
        
        # 简单截取，确保不在句子中间断开
        snippet = content[:max_length]
        last_period = snippet.rfind("。")
        if last_period > max_length * 0.5:  # 如果句号位置合理
            snippet = snippet[:last_period + 1]
        else:
            snippet += "..."
        
        return snippet


class ElderNutritionRetriever:
    """老年营养RAG检索器"""
    
    def __init__(self, vector_store: VectorStore, config: SearchConfig = None):
        """
        初始化检索器
        
        Args:
            vector_store: 向量存储器
            config: 检索配置
        """
        self.vector_store = vector_store
        self.config = config or SearchConfig()
        self.text_processor = TextProcessor()
        self.query_processor = QueryProcessor(self.text_processor)
        self.result_processor = ResultProcessor(self.config)
    
    def search(self, query: str, config: SearchConfig = None) -> List[SearchResult]:
        """
        智能检索
        
        Args:
            query: 用户查询
            config: 检索配置（可选，覆盖默认配置）
            
        Returns:
            检索结果列表
        """
        # 使用传入的配置或默认配置
        search_config = config or self.config
        
        # 1. 查询分析
        query_analysis = self.query_processor.analyze_query(query)
        
        # 2. 根据策略执行检索
        if search_config.strategy == SearchStrategy.SEMANTIC_ONLY:
            results = self._semantic_search(query, search_config)
        elif search_config.strategy == SearchStrategy.KEYWORD_ENHANCED:
            results = self._keyword_enhanced_search(query_analysis, search_config)
        elif search_config.strategy == SearchStrategy.HYBRID:
            results = self._hybrid_search(query_analysis, search_config)
        elif search_config.strategy == SearchStrategy.MULTI_QUERY:
            results = self._multi_query_search(query_analysis, search_config)
        else:
            results = self._semantic_search(query, search_config)
        
        # 3. 结果过滤
        filtered_results = self.result_processor.filter_results(results, query_analysis)
        
        # 4. 结果重排序
        final_results = self.result_processor.rerank_results(filtered_results, query_analysis)
        
        return final_results[:search_config.top_k]
    
    def _semantic_search(self, query: str, config: SearchConfig) -> List[Dict[str, Any]]:
        """纯语义检索"""
        return self.vector_store.search(query, top_k=config.top_k * 2)  # 多取一些用于后续过滤
    
    def _keyword_enhanced_search(self, query_analysis: Dict[str, Any], config: SearchConfig) -> List[Dict[str, Any]]:
        """关键词增强检索"""
        # 使用关键词组合查询
        keywords = query_analysis["keywords"]
        if keywords:
            enhanced_query = " ".join(keywords[:3])  # 使用前3个关键词
            return self.vector_store.search(enhanced_query, top_k=config.top_k * 2)
        else:
            return self._semantic_search(query_analysis["original_query"], config)
    
    def _hybrid_search(self, query_analysis: Dict[str, Any], config: SearchConfig) -> List[Dict[str, Any]]:
        """混合检索"""
        # 语义检索结果
        semantic_results = self._semantic_search(query_analysis["original_query"], config)
        
        # 关键词检索结果
        keyword_results = self._keyword_enhanced_search(query_analysis, config)
        
        # 合并去重
        combined_results = semantic_results.copy()
        seen_ids = {result.get("id", str(i)) for i, result in enumerate(semantic_results)}
        
        for result in keyword_results:
            result_id = result.get("id", str(len(combined_results)))
            if result_id not in seen_ids:
                combined_results.append(result)
                seen_ids.add(result_id)
        
        return combined_results
    
    def _multi_query_search(self, query_analysis: Dict[str, Any], config: SearchConfig) -> List[Dict[str, Any]]:
        """多查询检索"""
        # 查询扩展
        expanded_queries = self.query_processor.expand_query(query_analysis)
        
        all_results = []
        seen_ids = set()
        
        for expanded_query in expanded_queries:
            results = self.vector_store.search(expanded_query, top_k=config.top_k)
            
            for result in results:
                result_id = result.get("id", str(len(all_results)))
                if result_id not in seen_ids:
                    all_results.append(result)
                    seen_ids.add(result_id)
        
        return all_results
    
    def get_search_stats(self) -> Dict[str, Any]:
        """获取检索统计信息"""
        return {
            "vector_store_stats": self.vector_store.get_stats(),
            "config": {
                "strategy": self.config.strategy.value,
                "top_k": self.config.top_k,
                "similarity_threshold": self.config.similarity_threshold,
                "enable_query_expansion": self.config.enable_query_expansion,
                "enable_reranking": self.config.enable_reranking
            }
        } 