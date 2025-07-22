# AI 配置指南

## 概述

ElderDiet 后端现在支持多个 AI 提供商，并且可以根据不同的任务类型使用不同的模型。目前支持：

1. **钱多多 API** - 支持 GPT-4o、Claude 等多种模型
2. **智谱 AI** - 支持 GLM-4V-Flash（免费）、GLM-4V-Plus、GLM-4-Flash-250414 等模型

## 任务类型

系统支持三种任务类型，每种任务可以配置不同的模型：

1. **聊天任务 (chat)** - 支持多模态，推荐使用 `glm-4v-flash`
2. **膳食推荐 (meal-recommendation)** - 纯文本任务，推荐使用 `GLM-4-Flash-250414`
3. **营养评论 (nutrition-comment)** - 支持多模态，推荐使用 `glm-4v-flash`

## 配置方式

### 1. 环境变量配置

在环境变量中设置以下参数：

```bash
# 默认AI提供商 (qianduoduo 或 zhipu)
AI_PROVIDER=zhipu

# 按任务类型配置提供商（可选）
AI_CHAT_PROVIDER=zhipu
AI_MEAL_PROVIDER=zhipu
AI_NUTRITION_PROVIDER=zhipu

# 按任务类型配置模型（可选）
AI_CHAT_MODEL=glm-4v-flash
AI_MEAL_MODEL=GLM-4-Flash-250414
AI_NUTRITION_MODEL=glm-4v-flash

# API密钥配置
QIANDUODUO_API_KEY=your-qianduoduo-api-key
ZHIPU_API_KEY=your-zhipu-api-key
```

### 2. application.yml 配置

配置文件中的默认设置：

```yaml
ai:
  api:
    # 默认使用的API提供商
    provider: ${AI_PROVIDER:zhipu}

    # 按任务类型配置模型
    tasks:
      # 聊天任务 - 支持多模态
      chat:
        provider: ${AI_CHAT_PROVIDER:zhipu}
        model: ${AI_CHAT_MODEL:glm-4v-flash}
        temperature: 0.7

      # 膳食推荐任务 - 纯文本
      meal-recommendation:
        provider: ${AI_MEAL_PROVIDER:zhipu}
        model: ${AI_MEAL_MODEL:GLM-4-Flash-250414}
        temperature: 0.7

      # 营养评论任务 - 支持多模态
      nutrition-comment:
        provider: ${AI_NUTRITION_PROVIDER:zhipu}
        model: ${AI_NUTRITION_MODEL:glm-4v-flash}
        temperature: 0.7

    # 钱多多API配置
    qianduoduo:
      url: https://api2.aigcbest.top/v1/chat/completions
      key: ${QIANDUODUO_API_KEY:your-api-key-here}
      model: gpt-4o
      temperature: 0.7

    # 智谱AI配置
    zhipu:
      url: https://open.bigmodel.cn/api/paas/v4/chat/completions
      key: ${ZHIPU_API_KEY:your-zhipu-api-key-here}
      model: glm-4v-flash
      temperature: 0.7
```

## 支持的模型

### 钱多多 API

- `gpt-4o` - OpenAI GPT-4o 模型
- `gpt-4o-mini` - OpenAI GPT-4o Mini 模型
- `claude-3-5-haiku-latest` - Anthropic Claude 3.5 Haiku
- `gemini-1.5-flash` - Google Gemini 1.5 Flash

### 智谱 AI

- `glm-4v-flash` - 免费的视觉语言模型，适用于单图像理解（推荐用于聊天和营养评论）
- `GLM-4-Flash-250414` - 高效的纯文本模型（推荐用于膳食推荐）
- `glm-4v-plus-0111` - 高级视觉语言模型，支持多图像和视频理解

## 切换 AI 提供商

### 方法 1：环境变量

```bash
export AI_PROVIDER=zhipu
```

### 方法 2：启动参数

```bash
java -jar elderdiet-backend.jar --ai.api.provider=zhipu
```

### 方法 3：修改配置文件

在 application.yml 中修改：

```yaml
ai:
  api:
    provider: zhipu # 或 qianduoduo
```

## API 接口

### 查看当前配置

```http
GET /api/v1/ai-config/current
```

### 查看所有提供商配置

```http
GET /api/v1/ai-config/providers
```

### 测试配置连接

```http
POST /api/v1/ai-config/test
```

## 使用示例

### 1. 使用智谱 AI 的 GLM-4V-Flash（免费）

```bash
# 设置环境变量
export AI_PROVIDER=zhipu
export ZHIPU_API_KEY=your-zhipu-api-key

# 启动应用
java -jar elderdiet-backend.jar
```

### 2. 使用钱多多 API 的 GPT-4o

```bash
# 设置环境变量
export AI_PROVIDER=qianduoduo
export QIANDUODUO_API_KEY=your-qianduoduo-api-key

# 启动应用
java -jar elderdiet-backend.jar
```

## 注意事项

1. **API Key 安全性**：请妥善保管 API Key，不要在代码中硬编码
2. **模型兼容性**：两个提供商的 API 格式兼容 OpenAI 标准，支持多模态输入
3. **费用考虑**：智谱 AI 的 GLM-4V-Flash 模型是免费的，适合开发和测试
4. **图像支持**：两个提供商都支持图像输入，智谱 AI 还支持视频输入（GLM-4V-Plus）

## 故障排除

### 1. API Key 未配置

错误信息：`AI API Key未正确配置`
解决方案：检查环境变量或配置文件中的 API Key 设置

### 2. 网络连接问题

错误信息：`AI API调用失败`
解决方案：检查网络连接和 API 服务状态

### 3. 模型不支持

错误信息：`模型不存在或不可用`
解决方案：检查模型名称是否正确，参考支持的模型列表

## 开发建议

1. **开发环境**：建议使用智谱 AI 的免费模型进行开发和测试
2. **生产环境**：根据实际需求选择合适的模型和提供商
3. **监控**：定期检查 API 调用状态和费用使用情况
4. **备份方案**：配置多个提供商，确保服务的可用性
