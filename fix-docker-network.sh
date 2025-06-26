#!/bin/bash

# Docker网络问题修复脚本
# 配置阿里云镜像加速器和DNS

set -e

echo "🔧 修复Docker网络问题"
echo "======================"

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

# 1. 配置DNS
fix_dns() {
    log_info "配置DNS服务器..."
    
    # 备份原DNS配置
    if [ -f /etc/resolv.conf ]; then
        cp /etc/resolv.conf /etc/resolv.conf.backup
    fi
    
    # 配置DNS
    cat > /etc/resolv.conf << EOF
nameserver 8.8.8.8
nameserver 114.114.114.114
nameserver 223.5.5.5
EOF
    
    log_success "DNS配置完成"
}

# 2. 配置Docker镜像加速器
configure_docker_registry() {
    log_info "配置Docker镜像加速器..."
    
    # 创建daemon.json配置
    mkdir -p /etc/docker
    
    cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://registry.docker-cn.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "dns": ["8.8.8.8", "114.114.114.114"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "exec-opts": ["native.cgroupdriver=systemd"]
}
EOF
    
    log_success "Docker镜像加速器配置完成"
}

# 3. 重启Docker服务
restart_docker() {
    log_info "重启Docker服务..."
    
    systemctl daemon-reload
    systemctl restart docker
    
    # 等待Docker启动
    sleep 5
    
    if systemctl is-active --quiet docker; then
        log_success "Docker服务重启成功"
    else
        log_error "Docker服务重启失败"
        exit 1
    fi
}

# 4. 测试Docker连接
test_docker_connection() {
    log_info "测试Docker镜像拉取..."
    
    # 测试拉取小镜像
    if docker pull hello-world > /dev/null 2>&1; then
        log_success "Docker镜像拉取测试成功"
        docker rmi hello-world > /dev/null 2>&1
    else
        log_error "Docker镜像拉取测试失败"
        
        # 尝试直接从Docker Hub拉取
        log_info "尝试从Docker Hub直接拉取..."
        if docker pull --platform linux/amd64 hello-world > /dev/null 2>&1; then
            log_success "Docker Hub连接正常"
            docker rmi hello-world > /dev/null 2>&1
        else
            log_error "Docker Hub连接失败，请检查网络"
        fi
    fi
}

# 5. 清理Docker缓存
clean_docker_cache() {
    log_info "清理Docker缓存..."
    
    docker system prune -f > /dev/null 2>&1 || true
    docker builder prune -f > /dev/null 2>&1 || true
    
    log_success "Docker缓存清理完成"
}

# 6. 显示配置信息
show_config() {
    echo ""
    echo "📋 当前配置信息："
    echo "=================="
    echo "🌐 DNS配置："
    cat /etc/resolv.conf
    echo ""
    echo "🐳 Docker配置："
    cat /etc/docker/daemon.json
    echo ""
    echo "📊 Docker信息："
    docker info | grep -A 10 "Registry Mirrors" || echo "镜像源信息不可用"
}

# 主执行流程
main() {
    log_info "开始修复Docker网络问题..."
    
    fix_dns
    configure_docker_registry
    restart_docker
    clean_docker_cache
    test_docker_connection
    show_config
    
    log_success "🎉 Docker网络问题修复完成！"
    echo ""
    echo "💡 现在可以重新运行部署脚本："
    echo "   ./deploy-production-v3.sh"
}

# 错误处理
trap 'log_error "修复过程中发生错误"; exit 1' ERR

# 执行主流程
main "$@" 