# 养老膳食助手 (ElderDiet)

一个为老年人和家属提供膳食管理和健康监护的 React Native 应用。

## 📱 项目简介

养老膳食助手旨在帮助老年人制定合理的膳食计划，监控健康状况，并让家属能够远程关注老人的饮食健康。

### 🎯 主要功能

- **用户认证**：手机号注册/登录，支持老人和家属角色
- **膳食规划**：个性化膳食推荐和计划制定
- **健康监护**：健康指标记录和监控
- **家属关怀**：家属可远程查看老人饮食和健康状况

## 🏗️ 项目架构

```
ElderDiet-Project/
├── ElderDiet/           # 前端 (React Native + Expo)
│   ├── app/            # 页面路由
│   ├── components/     # 通用组件
│   ├── contexts/       # 状态管理
│   └── services/       # API服务
│
├── elderdiet-backend/   # 后端 (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── models/     # 数据模型
│   │   ├── routes/     # API路由
│   │   ├── middleware/ # 中间件
│   │   └── utils/      # 工具函数
│   └── package.json
│
└── README.md           # 项目说明
```

## 🚀 快速开始

### 📋 环境要求

- Node.js 20+
- MongoDB 7.0+
- Expo CLI
- iOS/Android 开发环境

### 🔧 安装依赖

```bash
# 安装前端依赖
cd ElderDiet
npm install

# 安装后端依赖
cd ../elderdiet-backend
npm install
```

### 🗄️ 数据库配置

```bash
# 启动MongoDB服务
brew services start mongodb/brew/mongodb-community

# 或使用Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### ⚙️ 环境变量配置

在 `elderdiet-backend` 目录创建 `.env` 文件：

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/elderdiet
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
```

### 🏃‍♂️ 运行项目

#### 启动后端服务

```bash
cd elderdiet-backend
npm run dev
```

后端服务将在 `http://localhost:3001` 启动

#### 启动前端应用

```bash
cd ElderDiet
npm start
```

使用 Expo Go 扫描二维码在手机上运行，或使用模拟器。

## 🔐 API 文档

### 认证接口

- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/auth/me` - 获取当前用户信息
- `POST /api/v1/auth/logout` - 用户登出

### 健康检查

- `GET /api/v1/health` - 服务健康检查

## 🛠️ 技术栈

### 前端

- **React Native** - 跨平台移动应用框架
- **Expo** - React Native 开发平台
- **Expo Router** - 文件系统路由
- **Expo SecureStore** - 安全存储
- **TypeScript** - 类型安全

### 后端

- **Node.js** - JavaScript 运行环境
- **Express.js** - Web 应用框架
- **TypeScript** - 类型安全
- **MongoDB** - 文档数据库
- **Mongoose** - MongoDB 对象建模
- **JWT** - 身份验证
- **bcryptjs** - 密码加密

## 📝 开发规范

### Git 提交规范

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

### 代码规范

- 使用 ESLint + Prettier 进行代码格式化
- 遵循 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- API 接口遵循 RESTful 设计

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目链接：[https://github.com/yourusername/ElderDiet](https://github.com/yourusername/ElderDiet)
- 问题反馈：[Issues](https://github.com/yourusername/ElderDiet/issues)

---

Made with ❤️ for better elderly care
