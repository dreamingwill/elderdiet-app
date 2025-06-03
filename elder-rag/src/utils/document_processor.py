"""
文档处理模块
用于处理各种格式的营养学资料，转换为结构化的知识库数据
"""

import os
import json
import re
from typing import List, Dict, Any, Optional
import hashlib

class DocumentProcessor:
    """文档处理器 - 支持多种格式的营养学文档"""
    
    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        """
        初始化文档处理器
        
        Args:
            chunk_size: 文本块大小（字符数）
            overlap: 重叠字符数
        """
        self.chunk_size = chunk_size
        self.overlap = overlap
        
    def extract_from_text(self, text_content: str, source: str = "unknown") -> List[Dict[str, Any]]:
        """
        从纯文本提取知识条目
        
        Args:
            text_content: 文本内容
            source: 数据源标识
            
        Returns:
            结构化的知识条目列表
        """
        # 按章节分割（基于标题模式）
        sections = self._split_by_sections(text_content)
        
        documents = []
        for i, section in enumerate(sections):
            if len(section.strip()) < 100:  # 跳过太短的内容
                continue
                
            # 提取标题
            title = self._extract_title(section)
            
            # 分块处理长文本
            chunks = self._split_into_chunks(section)
            
            for j, chunk in enumerate(chunks):
                doc = {
                    "id": self._generate_id(source, i, j),
                    "title": title if j == 0 else f"{title} (续{j})",
                    "content": chunk.strip(),
                    "source": source,
                    "section_id": i,
                    "chunk_id": j,
                    "category": self._infer_category(title, chunk)
                }
                documents.append(doc)
        
        return documents
    
    def process_pdf_content(self, pdf_text: str, source: str) -> List[Dict[str, Any]]:
        """
        处理PDF提取的文本内容
        
        注意：需要先用其他库（如PyPDF2、pdfplumber）提取PDF文本
        """
        # 清理PDF特有的格式问题
        cleaned_text = self._clean_pdf_text(pdf_text)
        return self.extract_from_text(cleaned_text, source)
    
    def process_structured_data(self, data: List[Dict[str, Any]], source: str) -> List[Dict[str, Any]]:
        """
        处理已经结构化的数据（如Excel表格转换的数据）
        
        Args:
            data: 结构化数据列表，每个字典应包含相关字段
            source: 数据源
        """
        documents = []
        
        for i, item in enumerate(data):
            doc = {
                "id": self._generate_id(source, i),
                "title": item.get("title", item.get("name", f"条目{i+1}")),
                "content": item.get("content", item.get("description", "")),
                "source": source,
                "category": item.get("category", "未分类")
            }
            
            # 添加其他可用字段
            for key in ["keywords", "tags", "symptoms", "recommendations"]:
                if key in item:
                    doc[key] = item[key]
            
            documents.append(doc)
        
        return documents
    
    def _split_by_sections(self, text: str) -> List[str]:
        """根据标题模式分割章节"""
        # 常见的标题模式
        title_patterns = [
            r'^第[一二三四五六七八九十\d]+章\s*.+',  # 第X章
            r'^第[一二三四五六七八九十\d]+节\s*.+',  # 第X节
            r'^\d+\.\s*.+',  # 1. 标题
            r'^\d+\.\d+\s*.+',  # 1.1 标题
            r'^[一二三四五六七八九十]+[、．]\s*.+',  # 一、标题
            r'^【.+】',  # 【标题】
        ]
        
        # 合并所有模式
        combined_pattern = '|'.join(f'({pattern})' for pattern in title_patterns)
        
        # 分割文本
        sections = re.split(combined_pattern, text, flags=re.MULTILINE)
        
        # 清理和合并
        result = []
        current_section = ""
        
        for section in sections:
            if section and section.strip():
                if re.match(combined_pattern, section.strip(), re.MULTILINE):
                    if current_section:
                        result.append(current_section)
                    current_section = section
                else:
                    current_section += section
        
        if current_section:
            result.append(current_section)
        
        return result if result else [text]  # 如果没有找到标题，返回整个文本
    
    def _extract_title(self, section: str) -> str:
        """从章节中提取标题"""
        lines = section.strip().split('\n')
        
        # 尝试从第一行提取标题
        first_line = lines[0].strip()
        
        # 移除标题前的编号
        title = re.sub(r'^(第[一二三四五六七八九十\d]+[章节]\s*|^\d+[\.\s]+|^[一二三四五六七八九十]+[、．]\s*|^【|】$)', '', first_line)
        
        # 如果标题太短或包含太多数字，尝试下一行
        if len(title) < 3 or len(re.findall(r'\d', title)) > len(title) * 0.5:
            if len(lines) > 1:
                title = lines[1].strip()
        
        return title[:50] if title else "未知标题"  # 限制标题长度
    
    def _split_into_chunks(self, text: str) -> List[str]:
        """将长文本分割成适当大小的块"""
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            # 如果不是最后一块，尝试在句号处分割
            if end < len(text):
                # 寻找最近的句号
                for i in range(end, max(start + self.chunk_size - 100, start), -1):
                    if text[i] in '。！？\n':
                        end = i + 1
                        break
            
            chunks.append(text[start:end])
            start = end - self.overlap if end < len(text) else end
        
        return chunks
    
    def _clean_pdf_text(self, text: str) -> str:
        """清理PDF文本的常见问题"""
        # 移除多余的空白字符
        text = re.sub(r'\s+', ' ', text)
        
        # 修复中文字符间的异常空格
        text = re.sub(r'(?<=[\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])', '', text)
        
        # 移除页眉页脚模式
        text = re.sub(r'第\s*\d+\s*页.*?\n', '', text)
        
        # 修复断行问题
        text = re.sub(r'(?<=[\u4e00-\u9fa5])\n(?=[\u4e00-\u9fa5])', '', text)
        
        return text
    
    def _generate_id(self, source: str, *args) -> str:
        """生成唯一ID"""
        id_string = f"{source}_{'_'.join(map(str, args))}"
        return hashlib.md5(id_string.encode()).hexdigest()[:12]
    
    def _infer_category(self, title: str, content: str) -> str:
        """根据标题和内容推断类别"""
        text = f"{title} {content}".lower()
        
        category_keywords = {
            "慢性疾病营养": ["糖尿病", "高血压", "心血管", "冠心病", "脑卒中"],
            "营养素补充": ["维生素", "矿物质", "钙", "铁", "锌", "叶酸", "补充"],
            "基础营养需求": ["蛋白质", "碳水化合物", "脂肪", "能量", "热量", "需求量"],
            "疾病食谱": ["食谱", "菜谱", "餐单", "早餐", "午餐", "晚餐", "饮食搭配"],
            "消化系统营养": ["便秘", "腹泻", "消化", "肠道", "胃", "益生菌"],
            "免疫营养": ["免疫", "抵抗力", "感染", "炎症", "抗氧化"],
            "心血管疾病营养": ["心脏", "血管", "血压", "血脂", "胆固醇"],
            "骨骼健康": ["骨质疏松", "骨密度", "关节", "骨骼", "钙质"],
        }
        
        for category, keywords in category_keywords.items():
            if any(keyword in text for keyword in keywords):
                return category
        
        return "一般营养知识"

# 示例使用方法
def example_usage():
    """示例：如何使用文档处理器"""
    processor = DocumentProcessor(chunk_size=400, overlap=50)
    
    # 示例1：处理纯文本内容
    sample_text = """
    第一章 老年人营养基础
    
    老年人的营养需求与年轻人相比有显著差异。随着年龄增长，基础代谢率下降，
    消化功能减弱，对营养素的吸收能力也会下降。
    
    1.1 蛋白质需求
    
    老年人蛋白质需求量建议为每公斤体重1.0-1.2克，应优先选择优质蛋白质。
    鱼、禽、蛋、奶、豆类都是良好的蛋白质来源。
    
    1.2 维生素需求
    
    老年人对B族维生素、维生素D、维生素C的需求相对增加。
    """
    
    documents = processor.extract_from_text(sample_text, "营养学教材")
    
    for doc in documents:
        print(f"ID: {doc['id']}")
        print(f"标题: {doc['title']}")
        print(f"类别: {doc['category']}")
        print(f"内容: {doc['content'][:100]}...")
        print("-" * 50)

if __name__ == "__main__":
    example_usage() 