import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import connectDB from './config/database';
import errorHandler from './middleware/error.middleware';
import authRouter from './routes/auth.route';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 连接数据库
connectDB();

// 基础中间件
app.use(helmet()); // 安全相关的HTTP头
app.use(cors()); // 跨域支持
app.use(compression()); // 压缩响应
app.use(express.json({ limit: '10mb' })); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// 健康检查路由 - 移到API版本路径下
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// 为了兼容性，保留根路径的健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// API路由
app.use('/api/v1/auth', authRouter);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `路由 ${req.originalUrl} 不存在`,
  });
});

// 全局错误处理中间件（必须放在最后）
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📍 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔐 认证接口: http://localhost:${PORT}/api/v1/auth`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
});

export default app; 