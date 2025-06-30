# 云服务器部署指南

**服务器 IP**: `30.71.181.219`

## 🎯 部署目标

将 ElderDiet 后端 API 和 MongoDB 数据库部署到云服务器，支持手机 App 和前端访问。

## 📋 完整部署 TASK LIST

### ✅ **第一阶段：本地准备工作（已完成）**

- [x] 修改 Docker 配置 - 关闭 MongoDB 外部端口
- [x] 更新 prod.env - 设置强密码
- [x] 修改前端 API 地址指向云服务器
- [ ] 提交代码到 Git 仓库

### 🖥️ **第二阶段：云服务器操作**

#### 1. 连接服务器

```bash
ssh root@30.71.181.219
# 或者使用你的用户名
ssh username@30.71.181.219
```

#### 2. 安装 Docker 环境

```bash
# Ubuntu/Debian系统
sudo apt update
sudo apt install docker.io docker-compose -y

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 检查安装
docker --version
docker compose --version
```

#### 3. 配置防火墙（重要！）

```bash
# 使用ufw防火墙
sudo ufw enable

# 开放SSH端口（如果还没开放）
sudo ufw allow 22

# 开放API端口（供外部访问）
sudo ufw allow 3001

# 确认MongoDB端口未开放（安全）
sudo ufw status
```

#### 4. 克隆代码

```bash
# 克隆你的代码仓库
git clone <your-repo-url>
cd elderdiet-app

# 确认关键文件存在
ls -la | grep -E "(docker-compose|prod.env|deploy.sh)"
```

#### 5. 运行部署

```bash
# 方法1：使用部署脚本
chmod +x deploy.sh
./deploy.sh

# 方法2：手动部署
docker compose -f docker-compose.prod.yml up -d --build
```

#### 6. 验证部署

```bash
# 检查容器状态
docker compose -f docker-compose.prod.yml ps

# 检查日志
docker compose -f docker-compose.prod.yml logs -f

# 测试API健康检查
curl http://localhost:3001/actuator/health
```

### 📱 **第三阶段：连接测试**

#### 从外部测试 API

```bash
# 在你的本地电脑上测试
curl http://30.71.181.219:3001/actuator/health

# 测试用户注册API
curl -X POST http://30.71.181.219:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"test123","role":"elder"}'
```

## 🔒 安全配置详解

### 端口配置

- ✅ **3001** - API 端口，开放给外部访问
- ❌ **27017** - MongoDB 端口，仅容器内部访问
- ✅ **22** - SSH 端口，管理用 access

### 网络架构

```
Internet → 防火墙 → 服务器:3001 → Docker网络 → Backend容器
                                                ↓
                                            MongoDB容器
```

### 数据持久化

- MongoDB 数据存储在 Docker volume 中
- 日志文件映射到 `./logs` 目录

## 🚨 故障排除

### 常见问题

#### 1. 容器无法启动

```bash
# 查看详细日志
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs mongodb

# 检查端口占用
sudo netstat -tulpn | grep :3001
```

#### 2. 外部无法访问 API

```bash
# 检查防火墙状态
sudo ufw status

# 检查服务监听
sudo netstat -tulpn | grep :3001

# 测试本地访问
curl http://localhost:3001/actuator/health
```

#### 3. 内存不足

```bash
# 检查内存使用
free -h
docker stats

# 如需调整，修改docker-compose.prod.yml中的内存限制
```

## 📊 监控和维护

### 日常命令

```bash
# 查看服务状态
docker compose -f docker-compose.prod.yml ps

# 查看日志
docker compose -f docker-compose.prod.yml logs -f backend

# 重启服务
docker compose -f docker-compose.prod.yml restart backend

# 停止所有服务
docker compose -f docker-compose.prod.yml down

# 更新代码后重新部署
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

### 备份数据

```bash
# 备份MongoDB数据
docker exec elderdiet-mongodb mongodump --out /backup
docker cp elderdiet-mongodb:/backup ./mongodb-backup-$(date +%Y%m%d)
```

## 🎉 部署完成检查清单

- [ ] 容器正常运行
- [ ] API 健康检查通过
- [ ] 防火墙正确配置
- [ ] 外部可以访问 API
- [ ] MongoDB 数据正常
- [ ] 日志正常输出
- [ ] 前端可以连接
- [ ] 手机 App 可以连接

## 📞 技术支持

如遇到问题，请检查：

1. 服务器防火墙配置
2. Docker 容器日志
3. 网络连接状态
4. 端口占用情况

---

**部署成功后，你的 API 将在以下地址可用：**

- 🌐 **API 地址**: `http://30.71.181.219:3001`
- 🏥 **健康检查**: `http://30.71.181.219:3001/actuator/health`
- 📱 **前端连接**: 已自动配置
