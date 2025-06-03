# ElderDiet RAG 系统

> 基于检索增强生成(RAG)的老年人营养膳食助手知识库

## 📁 项目结构

```
elderdiet-rag/
├── src/                              # 源代码
│   ├── data/                         # 数据文件
│   │   └── nutrition_knowledge.json  # 营养知识库
│   ├── services/                     # 核心服务
│   │   └── vector_store.py          # FAISS向量存储
│   └── utils/                        # 工具模块
│       ├── text_processor.py        # 中文文本预处理
│       └── document_processor.py    # 文档处理器
├── data/                            # 数据存储
│   └── vector_db/                   # 向量数据库持久化
├── docs/                            # 文档
│   └── workflow_explanation.md      # 工作流程详解
├── tests/                           # 单元测试
├── test_knowledge_base.py           # 知识库完整测试
└── test_document_processor.py       # 文档处理测试
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 激活conda环境
conda activate elderdiet-rag

# 验证依赖
python -c "import faiss; import jieba; import sentence_transformers; print('✅ 所有依赖已安装')"
```

### 2. 运行测试

```bash
# 测试知识库构建和检索
python test_knowledge_base.py

# 测试文档处理功能
python test_document_processor.py
```

### 3. 基本使用示例

```python
from src.services.vector_store import VectorStore
from src.utils.text_processor import TextProcessor

# 初始化
processor = TextProcessor()
vector_store = VectorStore()

# 加载现有知识库
vector_store.load("data/vector_db")

# 语义检索
results = vector_store.search("老年人缺钙怎么办？", top_k=3)
for result in results:
    print(f"{result['title']} (相似度: {result['similarity_score']:.4f})")
```

## 🧠 技术架构

- **文本处理**: jieba 分词 + 营养学专业词汇
- **向量模型**: `shibing624/text2vec-base-chinese` (768 维)
- **向量存储**: FAISS `IndexFlatIP` (内积相似度)
- **检索方式**: 语义相似度检索

## 📊 当前规模

- 📝 知识条目: 10 条（示例）
- 🎯 覆盖类别: 6 个营养类别
- ⚡ 检索延迟: <100ms
- 📈 准确率: 70%+ (精确匹配)

## 🔄 扩展知识库

### 方法 1: 手动添加 JSON

编辑 `src/data/nutrition_knowledge.json`

### 方法 2: 批量处理文档

```python
from src.utils.document_processor import DocumentProcessor

processor = DocumentProcessor()
docs = processor.extract_from_text(book_content, "营养学教材")
```

## 📚 参考文档

- [工作流程详解](docs/workflow_explanation.md)
- [API 使用指南](docs/api_guide.md) (待补充)
- [部署指南](docs/deployment.md) (待补充)

---

**项目状态**: 第 2 步已完成 ✅ (知识库构建)
