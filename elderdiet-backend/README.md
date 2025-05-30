# 养老膳食助手后端服务

基于 Node.js + Express + TypeScript + MongoDB 的后端API服务。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- MongoDB 本地实例
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量模板文件：

```bash
cp env.example .env
```

2. 修改 `.env` 文件中的配置：

```
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/elderdiet
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

### 启动服务

#### 开发模式

```bash
npm run dev
```

#### 生产模式

```bash
npm run build
npm start
```

## 📚 API 文档

### 健康检查

- **GET** `/health` - 服务健康状态检查

### 认证相关

- **POST** `/api/v1/auth/sms` - 发送短信验证码
- **POST** `/api/v1/auth/login` - 用户登录

## 🧪 测试账号

### 发送验证码 (POST /api/v1/auth/sms)

```json
{
  "phone": "13800000001" // 或 "13800000002"
}
```

### 登录 (POST /api/v1/auth/login)

```json
{
  "phone": "13800000001", // 或 "13800000002"
  "code": "000000"
}
```

#### 账号说明

- `13800000001` + `000000` → 老人账号 (elder)
- `13800000002` + `000000` → 家属账号 (child)

## 🛠️ 开发工具

### 代码格式化

```bash
npm run format
```

### 代码检查

```bash
npm run lint
npm run lint:fix
```

### 编译

```bash
npm run build
```

## 📁 项目结构

```
src/
├── config/          # 配置文件
│   └── database.ts  # 数据库连接
├── middleware/      # 中间件
│   └── error.middleware.ts  # 错误处理
├── routes/          # 路由
│   └── auth.route.ts    # 认证路由
└── app.ts           # 应用入口
```

## 🌍 环境变量说明

| 变量名         | 说明              | 默认值                              |
| -------------- | ----------------- | ----------------------------------- |
| NODE_ENV       | 运行环境          | development                         |
| PORT           | 服务端口          | 3001                                |
| MONGODB_URI    | MongoDB连接字符串 | mongodb://localhost:27017/elderdiet |
| JWT_SECRET     | JWT密钥           | -                                   |
| JWT_EXPIRES_IN | JWT过期时间       | 7d                                  |

## 📋 开发计划

- [x] 基础项目结构搭建
- [x] Express + TypeScript 配置
- [x] MongoDB 连接配置
- [x] 认证接口 (SMS + Login)
- [x] 全局错误处理
- [ ] 用户模型设计
- [ ] 健康档案API
- [ ] 营养分析API
- [ ] JWT认证中间件
- [ ] 单元测试
- [ ] API文档生成
- [ ] Docker 部署
