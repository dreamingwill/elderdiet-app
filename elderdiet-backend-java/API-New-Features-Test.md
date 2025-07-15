# 新功能 API 测试文档

## 功能概述

本次升级实现了三个核心功能：

1. **家庭成员列表 API** - 聚合获取家庭成员信息
2. **头像上传功能** - 用户头像上传与展示
3. **自动创建档案** - 新用户注册时自动创建空档案

## 1. 家庭成员列表 API

### 端点

```
GET /api/v1/family/members
```

### 认证

需要 JWT Token（Bearer Token）

### 功能描述

- 获取当前用户的所有家庭成员信息
- 老人用户：获取所有关联的子女信息
- 子女用户：获取所有关联的父母信息
- 聚合用户基本信息和档案信息
- 绕过权限检查，服务器内部安全调用

### 响应格式

```json
{
  "success": true,
  "message": "获取家庭成员成功",
  "data": [
    {
      "userId": "user_id_123",
      "phone": "13800138000",
      "role": "CHILD",
      "name": "张三",
      "age": 45,
      "gender": "male",
      "region": "北京市",
      "avatarUrl": "https://example.com/avatar.jpg",
      "relationshipType": "child",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 测试用例

```bash
# 测试获取家庭成员列表
curl -X GET "http://localhost:3001/api/v1/family/members" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json"
```

## 2. 头像上传 API

### 端点

```
POST /api/v1/profiles/avatar
```

### 认证

需要 JWT Token（Bearer Token）

### 请求格式

- Content-Type: multipart/form-data
- 文件字段名: `file`
- 支持格式: JPG, PNG, GIF, WEBP

### 功能描述

- 上传用户头像到阿里云 OSS
- 自动更新用户档案中的头像 URL
- 返回更新后的完整档案信息

### 响应格式

```json
{
  "success": true,
  "message": "头像上传成功",
  "data": {
    "id": "profile_id",
    "userId": "user_id_123",
    "name": "张三",
    "age": 65,
    "gender": "male",
    "region": "北京市",
    "avatarUrl": "https://elder-diet.oss-cn-shanghai.aliyuncs.com/diet-images/20240101120000_uuid.jpg",
    "height": 170.0,
    "weight": 65.0,
    "chronicConditions": [],
    "dietaryPreferences": [],
    "notes": "",
    "treeStage": 0,
    "wateringProgress": 0,
    "completedTrees": 0,
    "bmi": 22.5,
    "bmiStatus": "normal",
    "bmiStatusLabel": "正常",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 测试用例

```bash
# 测试头像上传
curl -X POST "http://localhost:3001/api/v1/profiles/avatar" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "file=@/path/to/avatar.jpg"
```

## 3. 自动创建档案功能

### 端点

```
POST /api/v1/auth/register
```

### 功能描述

- 用户注册时自动创建空的健康档案
- 确保每个用户都有对应的档案记录
- 避免前端处理"档案不存在"的边界情况

### 实现细节

- 在用户注册成功后，自动调用 `profileService.createEmptyProfile()`
- 创建的档案包含默认值：
  - `name`: 空字符串
  - `age`: null
  - `gender`: null
  - `region`: 空字符串
  - `height`: null
  - `weight`: null
  - `chronicConditions`: 空数组
  - `dietaryPreferences`: 空数组
  - `notes`: 空字符串
  - `avatarUrl`: null
  - `treeStage`: 0
  - `wateringProgress`: 0
  - `completedTrees`: 0

### 测试用例

```bash
# 测试用户注册（会自动创建空档案）
curl -X POST "http://localhost:3001/api/v1/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "phone": "13900139000",
       "password": "password123",
       "role": "ELDER"
     }'

# 注册后立即查询档案（应该存在）
curl -X GET "http://localhost:3001/api/v1/profiles/USER_ID" \
     -H "Authorization: Bearer GENERATED_JWT_TOKEN"
```

## 数据库变更

### Profile 表新增字段

```sql
-- 新增头像URL字段
ALTER TABLE profiles ADD COLUMN avatar_url VARCHAR(500);
```

### 字段说明

- `avatar_url`: 存储用户头像的公开访问 URL
- 字段类型: String
- 可为空: 是
- 默认值: null

## 错误处理

### 家庭成员列表 API

- 401: 用户未认证
- 500: 服务器内部错误

### 头像上传 API

- 400: 文件为空或格式不支持
- 401: 用户未认证
- 404: 用户档案不存在
- 500: 上传失败或服务器错误

### 自动创建档案

- 如果档案创建失败，不影响用户注册流程
- 错误仅记录到日志，不返回给前端

## 安全考虑

1. **权限控制**: 家庭成员 API 只返回与当前用户有关联的成员信息
2. **文件验证**: 头像上传严格验证文件类型和大小
3. **内部调用**: ProfileService 内部方法仅供服务器内部调用
4. **错误处理**: 优雅处理异常情况，不暴露敏感信息

## 性能优化

1. **批量查询**: 家庭成员 API 通过批量查询减少数据库访问
2. **缓存支持**: 头像 URL 使用 CDN 加速访问
3. **异步处理**: 档案创建失败不阻塞注册流程
4. **资源管理**: 及时释放文件上传资源

## 前端集成建议

1. **错误处理**: 前端应妥善处理各种错误情况
2. **文件预览**: 头像上传前提供预览功能
3. **进度显示**: 文件上传时显示进度条
4. **缓存策略**: 合理缓存家庭成员列表数据
5. **用户体验**: 提供友好的加载状态和错误提示
