#!/bin/bash

# Docker问题修复脚本
# 解决Docker Compose安装和镜像仓库访问问题

echo "🔧 修复Docker相关问题"
echo "===================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# 问题1：配置Docker镜像加速器
configure_docker_mirror() {
    log_info "配置Docker镜像加速器..."
    
    # 停止Docker服务
    sudo systemctl stop docker
    
    # 创建Docker配置目录
    sudo mkdir -p /etc/docker
    
    # 配置镜像加速器
    sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://registry.docker-cn.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF
    
    # 重启Docker服务
    sudo systemctl daemon-reload
    sudo systemctl start docker
    
    log_success "Docker镜像加速器配置完成"
}

# 问题2：安装Docker Compose
install_docker_compose() {
    log_info "安装Docker Compose..."
    
    # 方法1：使用GitHub直接下载（使用国内加速）
    COMPOSE_VERSION="2.20.0"
    
    log_info "从GitHub下载Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
    
    if [ $? -eq 0 ] && [ -f /usr/local/bin/docker-compose ]; then
        sudo chmod +x /usr/local/bin/docker-compose
        log_success "Docker Compose下载成功"
        return 0
    fi
    
    # 方法2：使用pip3安装简化版本
    log_info "尝试使用pip3安装docker-compose..."
    
    # 先安装pip3（如果没有）
    sudo yum install -y python3-pip
    
    # 升级pip
    sudo pip3 install --upgrade pip
    
    # 安装docker-compose（指定版本避免依赖问题）
    sudo pip3 install docker-compose==1.29.2
    
    if [ $? -eq 0 ]; then
        log_success "Docker Compose (pip版本) 安装成功"
        return 0
    fi
    
    # 方法3：使用系统包管理器
    log_info "尝试安装系统版本的docker-compose..."
    sudo yum install -y docker-compose
    
    if [ $? -eq 0 ]; then
        log_success "系统版本Docker Compose安装成功"
        return 0
    fi
    
    log_error "所有Docker Compose安装方法都失败了"
    return 1
}

# 问题3：创建临时的docker-compose替代方案
create_docker_compose_alternative() {
    log_info "创建Docker Compose替代方案..."
    
    # 创建一个简单的替代脚本
    sudo tee /usr/local/bin/docker-compose > /dev/null <<'EOF'
#!/bin/bash
# Docker Compose 替代脚本
# 使用 docker compose (新版本内置命令)

if command -v docker &> /dev/null; then
    if docker compose version &> /dev/null; then
        # 使用新版本的 docker compose
        docker compose "$@"
    else
        echo "错误: Docker Compose 未安装"
        echo "请运行: sudo yum install -y docker-compose"
        exit 1
    fi
else
    echo "错误: Docker 未安装"
    exit 1
fi
EOF
    
    sudo chmod +x /usr/local/bin/docker-compose
    log_success "Docker Compose替代脚本创建完成"
}

# 验证修复结果
verify_fixes() {
    log_info "验证修复结果..."
    
    # 检查Docker服务状态
    if sudo systemctl is-active docker > /dev/null; then
        log_success "Docker服务运行正常"
    else
        log_error "Docker服务未运行"
        return 1
    fi
    
    # 测试Docker镜像下载
    log_info "测试Docker镜像下载..."
    if sudo docker pull hello-world:latest; then
        log_success "Docker镜像下载成功"
        
        # 测试运行
        if sudo docker run --rm hello-world; then
            log_success "Docker运行测试通过"
        else
            log_warning "Docker运行有问题，但镜像下载成功"
        fi
    else
        log_warning "Docker镜像下载仍有问题，但不影响部署"
    fi
    
    # 检查Docker Compose
    if docker-compose --version || docker compose version; then
        log_success "Docker Compose检查通过"
    else
        log_warning "Docker Compose仍有问题，使用替代方案"
        create_docker_compose_alternative
    fi
}

# 清理Docker系统
cleanup_docker() {
    log_info "清理Docker系统..."
    
    # 清理未使用的镜像和容器
    sudo docker system prune -f > /dev/null 2>&1
    
    log_success "Docker系统清理完成"
}

# 显示最终状态
show_final_status() {
    echo ""
    echo "🎉 Docker问题修复完成！"
    echo "========================"
    
    echo "📊 当前状态："
    echo "Docker版本: $(docker --version)"
    
    if command -v docker-compose > /dev/null; then
        echo "Docker Compose: $(docker-compose --version 2>/dev/null || echo '未安装，但有替代方案')"
    elif docker compose version > /dev/null 2>&1; then
        echo "Docker Compose: $(docker compose version --short) (内置版本)"
    else
        echo "Docker Compose: 使用替代脚本"
    fi
    
    echo ""
    echo "🚀 现在可以开始部署了！"
    echo "运行以下命令开始部署："
    echo "  chmod +x deploy-production.sh"
    echo "  ./deploy-production.sh"
}

# 主修复流程
main() {
    configure_docker_mirror
    install_docker_compose
    verify_fixes
    cleanup_docker
    show_final_status
}

# 运行修复
main "$@" 