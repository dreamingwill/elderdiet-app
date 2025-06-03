# 🚀 ElderDiet RAG - 真实大模型接入指南

## 📋 快速设置钱多多平台 API

### 1️⃣ 设置 API Key

**方法一：环境变量（推荐）**

```bash
# 在终端运行
export QIANDUODUO_API_KEY='sk-your-key-here'

# 验证设置
echo $QIANDUODUO_API_KEY
```

**方法二：临时设置**

```bash
# 在运行演示前设置
QIANDUODUO_API_KEY='sk-your-key-here' python demo_real_llm_integration.py
```

**方法三：永久设置（推荐）**

```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
echo 'export QIANDUODUO_API_KEY="sk-your-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### 2️⃣ 安装依赖

```bash
pip install openai
```

### 3️⃣ 运行演示

```bash
# 进入项目目录
cd /Users/zrh/Projects/RNapp/elder-rag

# 运行真实LLM集成演示
python demo_real_llm_integration.py
```

## 🎯 使用步骤

1. **启动演示程序**

   ```bash
   python demo_real_llm_integration.py
   ```

2. **选择功能 5 - 交互式 LLM 测试**

   ```
   请选择功能 (0-5): 5
   ```

3. **选择钱多多平台**（如果检测到 API Key 会自动选择）

4. **选择模型**：

   - `gpt-4o` - 最新模型，性能最强
   - `gpt-4` - 高质量，较慢
   - `gpt-3.5-turbo` - 经济实惠，快速

5. **开始提问**：
   ```
   您的问题: 糖尿病老人应该怎么控制饮食？
   ```

## 💡 测试问题推荐

```
• 糖尿病老人饮食控制
• 老年人补钙方法
• 高血压饮食注意事项
• 制定老人健康食谱
• 老年人营养不良怎么改善
• 心血管疾病饮食预防
```

## 🔧 配置说明

系统会自动使用以下配置：

```python
config = RAGConfig(
    use_real_llm=True,
    llm_provider="openai",  # 兼容OpenAI格式
    llm_model="gpt-4o",     # 您选择的模型
    llm_api_key=os.getenv("QIANDUODUO_API_KEY"),
    llm_base_url="https://api2.aigcbest.top/v1",  # 钱多多API地址
    response_style="professional"
)
```

## 💰 成本估算

| 模型          | 成本/1K tokens | 单次查询估算 | 特点          |
| ------------- | -------------- | ------------ | ------------- |
| gpt-4o        | ~$0.005        | $0.01-0.03   | 🌟 最新，推荐 |
| gpt-4         | ~$0.03         | $0.05-0.15   | 🎯 高质量     |
| gpt-3.5-turbo | ~$0.002        | $0.005-0.01  | 💰 经济实惠   |

## ⚠️ 注意事项

1. **API Key 安全**

   - 不要把 API Key 提交到代码库
   - 不要在公共场所分享

2. **费用控制**

   - 测试时建议使用`gpt-3.5-turbo`
   - 监控使用量避免意外费用

3. **网络要求**
   - 需要稳定的网络连接
   - 国内可能需要特殊网络环境

## 🛠️ 故障排除

### API 调用失败

```bash
❌ 钱多多平台LLM调用失败: Error message
```

**解决方案：**

- 检查 API Key 是否正确
- 检查网络连接
- 确认账户余额充足

### 响应过慢

**解决方案：**

- 尝试使用`gpt-3.5-turbo`模型
- 检查网络连接
- 换个时间段重试

### 质量不佳

**解决方案：**

- 升级到`gpt-4o`或`gpt-4`
- 详细描述问题背景
- 提供具体的症状信息

## 🔄 切换回模拟模式

如果不想使用真实 API：

```bash
# 取消环境变量设置
unset QIANDUODUO_API_KEY

# 或运行不带API Key
python demo_rag_system.py  # 自动使用模拟模式
```

## 📞 技术支持

如遇到问题：

1. 检查[故障排除](#🛠️-故障排除)部分
2. 确认 API Key 和网络设置
3. 尝试不同的模型选择
4. 查看系统错误信息
