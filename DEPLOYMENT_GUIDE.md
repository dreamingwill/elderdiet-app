# ElderDiet 生产环境部署指南

## 📋 部署概览
- **部署方案**: Spring Boot API + MongoDB (方案A)
- **服务器**: 阿里云 ECS (2核1.8GB内存)
- **容器化**: Docker + Docker Compose
- **访问方式**: HTTP (IP地址访问)

## 🚀 一键部署步骤

### 第一步：准备服务器环境

在你的服务器workbench中执行：

```bash
# 1. 更新系统
sudo yum update -y

# 2. 安装Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 3. 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 4. 将当前用户加入docker组（避免每次都用sudo）
sudo usermod -aG docker $USER

# 5. 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 6. 验证安装
docker --version
docker-compose --version
```

**注意：** 执行`usermod`命令后，需要退出并重新登录workbench才能生效。

### 第二步：拉取项目代码

```bash
# 1. 安装Git（如果没有）
sudo yum install -y git curl

# 2. 拉取项目代码
# 请替换为你的GitHub仓库地址
git clone https://github.com/your-username/elderdiet-app.git
cd elderdiet-app

# 3. 确认项目结构
ls -la
```

### 第三步：推送配置文件到GitHub

在**本地电脑**上，先将我们创建的配置文件推送到GitHub：

```bash
# 在本地项目目录执行
git add .
git commit -m "feat: 添加Docker生产环境配置"
git push origin main
```

然后在**服务器**上更新代码：

```bash
# 在服务器上执行
git pull origin main
```

### 第四步：配置环境变量（重要）

```bash
# 1. 检查配置文件
cat prod.env

# 2. 如果需要修改密码或密钥，编辑配置文件
vi prod.env
# 建议修改：
# - MONGO_PASSWORD（数据库密码）
# - JWT_SECRET（JWT密钥，至少32位字符）
```

### 第五步：一键部署

```bash
# 1. 给部署脚本执行权限
chmod +x deploy-production.sh

# 2. 运行部署脚本
./deploy-production.sh
```

**部署过程说明**：
- 脚本会自动检查系统资源
- 构建Docker镜像（第一次会比较慢，大约5-10分钟）
- 启动MongoDB和Spring Boot服务
- 运行健康检查
- 显示访问地址和管理命令

### 第六步：验证部署

部署完成后，在浏览器中访问：

- **健康检查**: http://8.153.204.247:3001/actuator/health
- **应用信息**: http://8.153.204.247:3001/actuator/info

应该看到类似这样的响应：
```json
{
  "status": "UP"
}
```

## 📱 前端配置

### 修改前端API地址

在你的前端项目中，修改API配置：

**elderdiet-frontend/services/api.ts**:
```typescript
// 修改API基础地址为服务器IP
const API_BASE_URL = 'http://8.153.204.247:3001/api';
```

### 测试前端连接

```bash
# 在前端目录执行
cd elderdiet-frontend
npm start
# 或
yarn start
```

## 🔧 常用管理命令

### 服务管理
```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 只查看后端日志
docker-compose -f docker-compose.prod.yml logs -f backend

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 完全清理（包括数据，谨慎使用）
docker-compose -f docker-compose.prod.yml down -v
```

### 数据库管理
```bash
# 连接MongoDB
docker exec -it elderdiet-mongodb mongosh

# 在MongoDB shell中：
use elderdiet
show collections
db.users.count()
```

### 系统监控
```bash
# 查看Docker容器资源使用情况
docker stats

# 查看系统内存使用
free -h

# 查看磁盘使用
df -h
```

## 🔍 故障排查

### 常见问题

1. **内存不足**
   ```bash
   # 检查内存使用
   free -h
   # 如果内存不足，可以重启服务器或增加swap
   ```

2. **端口被占用**
   ```bash
   # 检查端口占用
   sudo netstat -tlnp | grep :3001
   # 或
   sudo ss -tlnp | grep :3001
   ```

3. **Docker镜像构建失败**
   ```bash
   # 清理Docker缓存
   docker system prune -a
   # 重新构建
   docker-compose -f docker-compose.prod.yml build --no-cache
   ```

4. **服务启动失败**
   ```bash
   # 查看详细日志
   docker-compose -f docker-compose.prod.yml logs backend
   
   # 检查配置
   docker-compose -f docker-compose.prod.yml config
   ```

### 性能优化

由于服务器内存有限(1.8GB)，可以考虑：

1. **增加Swap空间**
   ```bash
   # 创建2GB swap文件
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   
   # 永久启用
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

2. **Docker清理**
   ```bash
   # 定期清理未使用的镜像和容器
   docker system prune -f
   ```

## 📈 后续扩展

部署成功后，可以考虑：

1. **添加HTTPS** (Let's Encrypt)
2. **配置域名**
3. **添加Nginx反向代理**
4. **部署RAG AI服务**
5. **设置监控和告警**
6. **自动化CI/CD**

## 🆘 获取帮助

如果遇到问题：
1. 查看服务日志：`docker-compose -f docker-compose.prod.yml logs -f`
2. 检查系统资源：`free -h` 和 `df -h`
3. 提交GitHub Issue
4. 联系技术支持 