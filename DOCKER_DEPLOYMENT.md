# ElderDiet Docker 容器化部署指南

## 🚀 部署方案概述

采用 Docker 容器化部署，支持一键部署到本地或远程服务器。

## 📋 部署前准备

### 1. 服务器要求

- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **内存**: 至少 2GB RAM
- **存储**: 至少 20GB 可用空间
- **网络**: 支持访问 Docker Hub 和 Maven 仓库

### 2. 安装 Docker 和 Docker Compose

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose -y

# CentOS/RHEL
sudo yum install docker docker-compose -y

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 将用户添加到docker组（可选）
sudo usermod -aG docker $USER
```

## 📁 项目结构

```
elderdiet-app/
├── elderdiet-backend-java/
│   ├── Dockerfile              # Java后端镜像配置
│   └── .dockerignore          # Docker构建忽略文件
├── docker-compose.prod.yml    # 生产环境容器编排
├── prod.env                   # 生产环境变量
├── mongo-init.js             # MongoDB初始化脚本
└── deploy.sh                 # 一键部署脚本
```

## 🛠️ 部署步骤

### 方法 1: 使用一键部署脚本（推荐）

```bash
# 1. 克隆代码到服务器
git clone <your-repo-url>
cd elderdiet-app

# 2. 运行部署脚本
./deploy.sh
```

### 方法 2: 手动部署

```bash
# 1. 克隆代码
git clone <your-repo-url>
cd elderdiet-app

# 2. 加载环境变量
source prod.env

# 3. 构建并启动服务
docker-compose -f docker-compose.prod.yml up -d --build

# 4. 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```

## 🔧 服务配置

### 1. 环境变量配置（prod.env）

```env
# MongoDB配置
MONGO_PASSWORD=your-secure-password
MONGODB_URI=mongodb://admin:your-secure-password@mongodb:27017/elderdiet?authSource=admin

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=604800

# 应用配置
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=3001
LOG_LEVEL=INFO

# 资源限制
MONGO_MEMORY_LIMIT=512m
BACKEND_MEMORY_LIMIT=768m
```

### 2. 端口配置

- **后端 API**: 3001
- **MongoDB**: 27017

## 📊 监控和管理

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f mongodb
```

### 服务管理

```bash
# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart backend

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```

### 健康检查

```bash
# 检查后端API健康状态
curl http://localhost:3001/actuator/health

# 检查MongoDB连接
docker exec elderdiet-mongodb mongo --eval "db.stats()"
```

## 🔒 安全配置

### 1. 修改默认密码

```bash
# 修改prod.env文件中的密码
MONGO_PASSWORD=your-new-secure-password
JWT_SECRET=your-new-jwt-secret
```

### 2. 防火墙配置

```bash
# 只开放必要端口
sudo ufw allow 3001/tcp  # API端口
# 注意：不要开放27017端口给外部访问
```

## 🚨 故障排除

### 1. 容器无法启动

```bash
# 查看容器日志
docker logs elderdiet-backend
docker logs elderdiet-mongodb

# 检查端口占用
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :27017
```

### 2. 内存不足

```bash
# 检查内存使用
docker stats

# 调整内存限制（修改docker-compose.prod.yml）
```

### 3. 网络问题

```bash
# 检查Docker网络
docker network ls
docker network inspect elderdiet-app_elderdiet-network
```

## 🔄 更新部署

### 更新代码

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建并部署
docker-compose -f docker-compose.prod.yml up -d --build

# 3. 清理旧镜像
docker system prune -f
```

## 📈 性能优化

### 1. JVM 调优

在 `docker-compose.prod.yml` 中调整 `JAVA_OPTS`：

```yaml
environment:
  JAVA_OPTS: -Xms512m -Xmx1024m -XX:+UseG1GC
```

### 2. MongoDB 调优

```yaml
command: mongod --wiredTigerCacheSizeGB 0.5
```

## 🛡️ 备份和恢复

### 数据备份

```bash
# 创建MongoDB备份
docker exec elderdiet-mongodb mongodump --out /backup
docker cp elderdiet-mongodb:/backup ./mongodb-backup-$(date +%Y%m%d)
```

### 数据恢复

```bash
# 恢复MongoDB数据
docker cp ./mongodb-backup elderdiet-mongodb:/backup
docker exec elderdiet-mongodb mongorestore /backup
```

## 📞 支持和联系

如有问题，请查看：

1. 容器日志: `docker-compose logs`
2. 系统资源: `docker stats`
3. 网络连接: `docker network inspect`

---

**注意**: 请确保在生产环境中修改所有默认密码和密钥！
