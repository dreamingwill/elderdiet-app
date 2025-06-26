#!/bin/bash

# 网络连接诊断脚本
# 检查Docker镜像源和网络连接状态

echo "🔍 ElderDiet 网络连接诊断"
echo "========================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }

# 1. 基础网络连接测试
test_basic_network() {
    echo ""
    log_info "=== 基础网络连接测试 ==="
    
    # 测试DNS解析
    if nslookup google.com > /dev/null 2>&1; then
        log_success "DNS解析正常"
    else
        log_error "DNS解析失败"
    fi
    
    # 测试外网连接
    if ping -c 3 8.8.8.8 > /dev/null 2>&1; then
        log_success "外网连接正常"
    else
        log_error "外网连接失败"
    fi
    
    # 测试HTTPS连接
    if curl -s --connect-timeout 10 https://www.baidu.com > /dev/null; then
        log_success "HTTPS连接正常"
    else
        log_error "HTTPS连接失败"
    fi
}

# 2. Docker镜像源连接测试
test_docker_registries() {
    echo ""
    log_info "=== Docker镜像源连接测试 ==="
    
    registries=(
        "https://docker.io"
        "https://registry.docker-cn.com"
        "https://docker.mirrors.ustc.edu.cn"
        "https://hub-mirror.c.163.com"
        "https://mirror.baidubce.com"
        "https://registry.cn-hangzhou.aliyuncs.com"
    )
    
    for registry in "${registries[@]}"; do
        if curl -s --connect-timeout 10 "$registry" > /dev/null 2>&1; then
            log_success "$registry - 可访问"
        else
            log_error "$registry - 无法访问"
        fi
    done
}

# 3. 尝试拉取小镜像测试
test_image_pull() {
    echo ""
    log_info "=== 镜像拉取测试 ==="
    
    # 测试最小的alpine镜像
    log_info "尝试拉取 alpine:latest..."
    if timeout 60 docker pull alpine:latest > /dev/null 2>&1; then
        log_success "alpine镜像拉取成功"
        docker rmi alpine:latest > /dev/null 2>&1
    else
        log_error "alpine镜像拉取失败"
    fi
    
    # 测试从阿里云拉取
    log_info "尝试从阿里云拉取镜像..."
    if timeout 60 docker pull registry.cn-hangzhou.aliyuncs.com/library/alpine:latest > /dev/null 2>&1; then
        log_success "阿里云镜像拉取成功"
        docker rmi registry.cn-hangzhou.aliyuncs.com/library/alpine:latest > /dev/null 2>&1
    else
        log_error "阿里云镜像拉取失败"
    fi
}

# 4. 检查系统配置
check_system_config() {
    echo ""
    log_info "=== 系统配置检查 ==="
    
    echo "🌐 当前DNS配置:"
    cat /etc/resolv.conf
    
    echo ""
    echo "🐳 Docker配置:"
    if [ -f /etc/docker/daemon.json ]; then
        cat /etc/docker/daemon.json
    else
        log_warning "Docker daemon.json 不存在"
    fi
    
    echo ""
    echo "📊 Docker信息:"
    docker info | head -20
}

# 5. 提供解决建议
provide_solutions() {
    echo ""
    log_info "=== 解决方案建议 ==="
    
    echo "基于诊断结果，建议尝试以下方案："
    echo ""
    echo "🔧 方案1: 配置正确的阿里云镜像加速器"
    echo "   sudo ./fix-aliyun-registry.sh"
    echo ""
    echo "🔧 方案2: 使用完全离线部署"
    echo "   sudo ./deploy-offline.sh"
    echo ""
    echo "🔧 方案3: 直接安装（不使用Docker）"
    echo "   sudo ./install-direct.sh"
}

# 主函数
main() {
    test_basic_network
    test_docker_registries
    test_image_pull
    check_system_config
    provide_solutions
    
    echo ""
    log_info "诊断完成！请根据上述结果选择合适的解决方案。"
}

# 执行
main "$@" 