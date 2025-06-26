#!/bin/bash

# 阿里云ECS Docker镜像加速器配置脚本
# 专门针对阿里云服务器的网络环境优化

set -e

echo "🔧 阿里云Docker镜像加速器配置"
echo "============================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# 1. 配置阿里云专用DNS
configure_aliyun_dns() {
    log_info "配置阿里云内网DNS..."
    
    # 备份原配置
    cp /etc/resolv.conf /etc/resolv.conf.backup 2>/dev/null || true
    
    # 阿里云内网DNS + 公共DNS
    cat > /etc/resolv.conf << 'EOF'
nameserver 100.100.2.136
nameserver 100.100.2.138
nameserver 223.5.5.5
nameserver 8.8.8.8
EOF
    
    log_success "DNS配置完成"
}

# 2. 获取阿里云地域信息
get_aliyun_region() {
    log_info "检测阿里云地域..."
    
    # 通过元数据服务获取地域信息
    local region_id
    if region_id=$(curl -s --connect-timeout 5 http://100.100.100.200/latest/meta-data/region-id 2>/dev/null); then
        echo "$region_id"
        log_success "检测到地域: $region_id"
    else
        echo "cn-hangzhou"  # 默认杭州
        log_info "使用默认地域: cn-hangzhou"
    fi
}

# 3. 配置阿里云容器镜像服务
configure_aliyun_acr() {
    log_info "配置阿里云容器镜像服务..."
    
    local region=$(get_aliyun_region)
    
    mkdir -p /etc/docker
    
    # 根据地域配置相应的镜像加速器
    cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": [
    "https://${region}.mirror.aliyuncs.com",
    "https://registry.cn-hangzhou.aliyuncs.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ],
  "dns": ["100.100.2.136", "223.5.5.5"],
  "insecure-registries": ["registry.cn-hangzhou.aliyuncs.com"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "exec-opts": ["native.cgroupdriver=systemd"],
  "live-restore": true,
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5
}
EOF
    
    log_success "Docker配置完成"
}

# 4. 重启Docker服务
restart_docker_service() {
    log_info "重启Docker服务..."
    
    systemctl daemon-reload
    systemctl restart docker
    
    # 等待Docker启动
    sleep 10
    
    # 检查Docker状态
    if systemctl is-active --quiet docker; then
        log_success "Docker服务重启成功"
    else
        log_error "Docker服务重启失败"
        systemctl status docker
        exit 1
    fi
}

# 5. 测试镜像拉取
test_image_pull() {
    log_info "测试镜像拉取..."
    
    # 清理可能的缓存
    docker system prune -f > /dev/null 2>&1 || true
    
    # 测试拉取alpine镜像
    if docker pull alpine:3.18 --quiet; then
        log_success "测试镜像拉取成功"
        docker rmi alpine:3.18 > /dev/null 2>&1 || true
        return 0
    else
        log_error "测试镜像拉取失败"
        return 1
    fi
}

# 6. 预拉取必要镜像
pull_required_images() {
    log_info "预拉取项目所需镜像..."
    
    images=(
        "mongo:5.0"
        "openjdk:17-jre-slim"
        "maven:3.8.6-openjdk-17-slim"
    )
    
    for image in "${images[@]}"; do
        log_info "拉取 $image..."
        if timeout 300 docker pull "$image"; then
            log_success "$image 拉取成功"
        else
            log_error "$image 拉取失败，将在部署时重试"
        fi
    done
}

# 7. 显示配置信息
show_config_info() {
    echo ""
    log_info "=== 配置信息 ==="
    
    echo "🌐 DNS配置:"
    cat /etc/resolv.conf
    
    echo ""
    echo "🐳 Docker镜像源:"
    docker info | grep -A 10 "Registry Mirrors" 2>/dev/null || echo "镜像源信息不可用"
    
    echo ""
    echo "📦 已拉取的镜像:"
    docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}"
}

# 主执行流程
main() {
    log_info "开始配置阿里云Docker环境..."
    
    configure_aliyun_dns
    configure_aliyun_acr
    restart_docker_service
    
    if test_image_pull; then
        pull_required_images
        show_config_info
        
        echo ""
        log_success "🎉 阿里云Docker配置完成！"
        echo ""
        echo "💡 现在可以尝试部署："
        echo "   ./deploy-production-v3.sh"
    else
        log_error "镜像拉取测试失败，可能需要尝试其他方案"
        echo ""
        echo "🔧 建议尝试离线部署："
        echo "   ./deploy-offline.sh"
    fi
}

# 错误处理
trap 'log_error "配置过程中发生错误"; exit 1' ERR

# 执行主流程
main "$@" 