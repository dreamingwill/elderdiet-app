# ElderDiet RAG 系统

> 基于检索增强生成(RAG)的老年人营养膳食助手知识库

## ⚠️ **重要说明：模拟 vs 真实 LLM**

**当前系统使用模拟回答生成器，不调用真实大模型 API**

### 🎭 模拟模式特点（当前默认）

- **✅ 零成本运行** - 无需 API 费用，可随意测试
- **⚡ 极速响应** - 毫秒级回答生成
- **📚 专业内容** - 基于营养学专业知识的预设回答
- **🔧 完整架构** - 展示完整 RAG 流程设计

### 🤖 真实 LLM 模式（可选启用）

- **🌟 动态回答** - 基于 prompt 实时生成个性化回答
- **💰 有成本** - 需要 API 费用（GPT-4 约$0.05-0.15/次查询）
- **⏱️ 较慢** - 2-5 秒响应时间
- **🎯 高质量** - 更贴合具体问题的回答

### 🚀 如何启用真实 LLM

```python
# 1. 安装依赖
pip install openai anthropic

# 2. 设置API Key
export OPENAI_API_KEY='your-api-key'

# 3. 修改配置
config = RAGConfig(
    use_real_llm=True,
    llm_provider="openai",
    llm_model="gpt-4"
)

# 4. 运行真实LLM演示
python demo_real_llm_integration.py
```

## 📁 项目结构

```
elderdiet-rag/
├── src/                              # 源代码
│   ├── data/                         # 数据文件
│   │   └── nutrition_knowledge.json  # 营养知识库
│   ├── services/                     # 核心服务
│   │   ├── vector_store.py          # FAISS向量存储
│   │   ├── retriever.py             # 智能检索器 ✨
│   │   ├── prompt_template.py       # Prompt模板系统 🎯
│   │   ├── few_shot_examples.py     # Few-shot示例管理 📚
│   │   ├── prompt_manager.py        # Prompt管理器 🎨
│   │   ├── rag_chain.py             # RAG Chain核心引擎 🔗
│   │   └── conversation_manager.py  # 对话管理系统 💬
│   └── utils/                        # 工具模块
│       ├── text_processor.py        # 中文文本预处理
│       └── document_processor.py    # 文档处理器
├── data/                            # 数据存储
│   └── vector_db/                   # 向量数据库持久化
├── docs/                            # 文档
│   └── workflow_explanation.md      # 工作流程详解
├── tests/                           # 单元测试
├── test_knowledge_base.py           # 知识库完整测试
├── test_document_processor.py       # 文档处理测试
├── test_retriever.py               # 检索器完整测试 ✨
├── test_prompt_system.py           # Prompt系统测试 🎯
├── test_rag_chain.py               # RAG Chain完整测试 🔗
├── demo_retriever.py               # 检索器演示脚本 ✨
├── demo_prompt_system.py           # Prompt系统演示脚本 🎯
├── demo_rag_system.py              # RAG系统完整演示 🔗
└── demo_real_llm_integration.py    # 真实LLM集成演示 🤖
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 激活conda环境
conda activate elderdiet-rag

# 验证依赖
python -c "import faiss; import jieba; import sentence_transformers; print('✅ 所有依赖已安装')"

# 可选：安装LLM依赖（用于真实模型）
pip install openai anthropic
```

### 2. 运行测试

```bash
# 测试知识库构建和检索
python test_knowledge_base.py

# 测试文档处理功能
python test_document_processor.py

# 测试智能检索器
python test_retriever.py

# 测试Prompt系统 (新增)
python test_prompt_system.py

# 测试RAG Chain完整性
python test_rag_chain.py
```

### 3. 系统演示

```bash
# 运行检索器演示脚本
python demo_retriever.py

# 运行Prompt系统演示脚本 (新增)
python demo_prompt_system.py

# 运行RAG系统完整演示 (新增)
python demo_rag_system.py

# 运行真实LLM集成演示 (新增)
python demo_real_llm_integration.py
```

### 4. 基本使用示例

#### 4.1 基础检索和 Prompt 生成

```python
from src.services.vector_store import VectorStore
from src.services.retriever import ElderNutritionRetriever, SearchConfig, SearchStrategy
from src.services.prompt_manager import PromptManager

# 初始化系统
vector_store = VectorStore()
vector_store.load("data/vector_db")
retriever = ElderNutritionRetriever(vector_store)
prompt_manager = PromptManager()

# 基础检索
results = retriever.search("老年人缺钙怎么办？")

# 生成专业营养师Prompt
prompt = prompt_manager.generate_prompt(
    user_query="糖尿病老人饮食建议",
    search_results=results,
    use_few_shot=True
)
```

#### 4.2 高级 Prompt 生成配置

```python
# 检索配置
config = SearchConfig(
    strategy=SearchStrategy.HYBRID,  # 混合检索策略
    top_k=3,
    similarity_threshold=0.3,
    enable_reranking=True
)

# 检索相关知识
results = retriever.search("糖尿病老人饮食建议", config)

# 生成高质量Prompt
prompt = prompt_manager.generate_prompt(
    user_query="糖尿病老人饮食建议",
    search_results=results,
    use_few_shot=True  # 使用Few-shot示例增强
)

# 查看Prompt质量
quality = prompt_manager.validate_prompt_quality(prompt)
print(f"质量等级: {quality['quality_level']}")
print(f"质量分数: {quality['score']}/100")
```

## 🧠 技术架构

### 核心组件

- **文本处理**: jieba 分词 + 营养学专业词汇
- **向量模型**: `shibing624/text2vec-base-chinese` (768 维)
- **向量存储**: FAISS `IndexFlatIP` (内积相似度)
- **智能检索**: 多策略检索 + 查询分析 + 结果重排序 ✨
- **Prompt 系统**: Chain-of-Thought + Few-shot + 意图识别 🎯
- **RAG Chain**: 端到端问答 + 质量评估 + 对话管理 🔗

### 检索器特性 ✨

- 🎯 **多种检索策略**

  - 纯语义检索
  - 关键词增强检索
  - 混合检索
  - 多查询检索

- 🧠 **智能查询处理**

  - 查询意图识别 (营养/疾病/症状/食物)
  - 查询复杂度评估
  - 自动查询扩展

- 📊 **结果优化**
  - 智能重排序算法
  - 相似度阈值过滤
  - 内容摘要生成
  - 多维度相关性计算

### Prompt 系统特性 🎯

- 🎭 **专业角色设定**

  - 老年营养师身份
  - 10 年临床经验背景
  - 亲切易懂的表达风格

- 🧠 **Chain-of-Thought 推理**

  - 疾病分析 → 营养需求评估
  - 饮食原则制定 → 具体建议
  - 注意事项说明 → 风险提示

- 📚 **Few-shot 示例增强**

  - 4 种查询类型的专业示例
  - 完整的推理过程展示
  - 标准化的回答格式

- 🎯 **智能意图识别**
  - 疾病营养咨询
  - 营养素缺乏补充
  - 饮食规划制定
  - 食物选择指导

### RAG Chain 特性 🔗

- 🔧 **端到端处理**

  - 查询分析 → 知识检索 → Prompt 生成 → 回答生成 → 质量评估
  - 4 种 RAG 模式 (Basic/Enhanced/Expert/Interactive)
  - 自动错误处理和恢复机制

- 💬 **多轮对话管理**

  - 会话状态跟踪和上下文维护
  - 个性化用户档案支持
  - 对话历史智能分析

- 📊 **实时质量监控**

  - 5 维度质量评估 (相关性/完整性/准确性/可读性/安全性)
  - 自动问题检测和改进建议
  - 置信度评分和质量趋势分析

- ⚙️ **灵活配置系统**
  - 3 种回答风格 (专业/友好/详细)
  - 多种检索策略组合
  - 动态配置调整支持

## 📊 当前规模

- 📝 知识条目: 10 条（示例）
- 🎯 覆盖类别: 6 个营养类别
- ⚡ 检索延迟: <100ms
- 📈 准确率: 70%+ (精确匹配)
- 🧠 检索策略: 4 种检索模式 ✨
- 🎭 Prompt 模板: 4 种专业模板 🎯
- 📚 Few-shot 示例: 4 个典型案例 📚
- 🔗 RAG 模式: 4 种处理模式 🔗
- 💬 对话管理: 多轮上下文维护 💬

## 🔄 扩展知识库

### 方法 1: 手动添加 JSON

编辑 `src/data/nutrition_knowledge.json`

### 方法 2: 批量处理文档

```python
from src.utils.document_processor import DocumentProcessor

processor = DocumentProcessor()
docs = processor.extract_from_text(book_content, "营养学教材")
```

## 🎛️ 检索器配置

### 检索策略选择

```python
# 纯语义检索 - 最快速度
config = SearchConfig(strategy=SearchStrategy.SEMANTIC_ONLY)

# 关键词增强 - 精确匹配
config = SearchConfig(strategy=SearchStrategy.KEYWORD_ENHANCED)

# 混合检索 - 最佳效果 (推荐)
config = SearchConfig(strategy=SearchStrategy.HYBRID)

# 多查询检索 - 最全面覆盖
config = SearchConfig(strategy=SearchStrategy.MULTI_QUERY)
```

### 高级配置

```python
config = SearchConfig(
    strategy=SearchStrategy.HYBRID,
    top_k=5,                      # 返回结果数
    similarity_threshold=0.3,     # 相似度阈值
    max_content_length=500,       # 内容长度限制
    enable_query_expansion=True,  # 启用查询扩展
    enable_reranking=True         # 启用智能重排序
)
```

## 🎨 Prompt 系统配置

### 意图分类和模板选择

```python
from src.services.prompt_manager import PromptManager

prompt_manager = PromptManager()

# 自动意图识别
analysis = prompt_manager.analyze_query_complexity("糖尿病老人饮食控制")
print(f"意图: {analysis['primary_intent'][0].value}")
print(f"复杂度: {analysis['complexity']}")
```

### 不同场景的 Prompt 生成

```python
# 疾病营养咨询
prompt = prompt_manager.generate_prompt(
    user_query="糖尿病老人应该怎么控制饮食？",
    search_results=results,
    use_few_shot=True
)

# 营养素缺乏咨询
prompt = prompt_manager.generate_prompt(
    user_query="老年人缺钙应该怎么补充？",
    search_results=results,
    use_few_shot=True
)
```

### Prompt 质量验证

```python
quality = prompt_manager.validate_prompt_quality(prompt)

print(f"质量等级: {quality['quality_level']}")
print(f"质量分数: {quality['score']}/100")
print(f"发现问题: {quality['issues']}")
```

## 🔗 RAG Chain 使用

### 基础使用

```python
from src.services.vector_store import VectorStore
from src.services.rag_chain import RAGChain, RAGConfig, RAGMode

# 初始化系统
vector_store = VectorStore()
vector_store.load("data/vector_db")

rag_config = RAGConfig(
    mode=RAGMode.ENHANCED,
    use_few_shot=True,
    enable_quality_check=True
)

rag_chain = RAGChain(vector_store, rag_config)

# 处理查询
response = rag_chain.process_query("糖尿病老人饮食建议")

print(f"回答: {response.answer}")
print(f"质量分数: {response.quality_score}")
print(f"置信度: {response.confidence_score}")
```

### 多轮对话管理

```python
from src.services.conversation_manager import ConversationManager

# 初始化对话管理器
conversation_manager = ConversationManager(rag_chain)

# 创建会话
session_id = conversation_manager.create_session(
    user_id="user_123",
    user_profile={"age": 70, "conditions": ["diabetes"]}
)

# 处理多轮对话
response1, info1 = conversation_manager.process_user_input(
    session_id, "我有糖尿病，应该怎么控制饮食？"
)

response2, info2 = conversation_manager.process_user_input(
    session_id, "那我早餐应该吃什么？"
)

# 获取会话信息
session_info = conversation_manager.get_session_info(session_id)
print(f"对话轮次: {session_info['total_turns']}")
print(f"平均质量: {session_info['session_stats']['average_quality_score']}")
```

### 高级配置和监控

```python
# 不同RAG模式配置
configs = {
    "basic": RAGConfig(mode=RAGMode.BASIC),
    "enhanced": RAGConfig(mode=RAGMode.ENHANCED, use_few_shot=True),
    "expert": RAGConfig(mode=RAGMode.EXPERT, enable_quality_check=True)
}

# 质量监控
for mode_name, config in configs.items():
    rag_chain.update_config(config)
    response = rag_chain.process_query(query)
    print(f"{mode_name}模式质量: {response.quality_score:.1f}")

# 系统统计
stats = rag_chain.get_stats()
print(f"处理查询: {stats['total_queries']}")
print(f"成功率: {stats['successful_responses']/stats['total_queries']*100:.1f}%")
print(f"平均质量: {stats['average_quality_score']:.1f}")
```

## 📚 参考文档

- [工作流程详解](docs/workflow_explanation.md)
- [API 使用指南](docs/api_guide.md) (待补充)
- [部署指南](docs/deployment.md) (待补充)

---

**项目状态**: 第 5 步已完成 ✅ (RAG Chain 组装)

**下一步计划**:

- [ ] 6. 快速验证 Demo 🚀

**第 5 步完成功能**:

- ✅ RAG Chain 核心引擎
- ✅ 对话管理系统
- ✅ 质量评估体系
- ✅ 多模式配置支持
- ✅ 端到端测试系统
- ✅ 完整功能演示界面
