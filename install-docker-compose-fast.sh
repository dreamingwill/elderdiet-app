#!/bin/bash

# 快速安装Docker Compose脚本
# 使用国内镜像源，解决GitHub下载慢的问题

echo "⚡ 快速安装Docker Compose"
echo "========================"

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

# 方法1：使用DaoCloud国内镜像（最快）
install_via_daocloud() {
    log_info "方法1: 使用DaoCloud国内镜像下载..."
    
    COMPOSE_VERSION="2.20.0"
    DOWNLOAD_URL="https://get.daocloud.io/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)"
    
    log_info "下载地址: $DOWNLOAD_URL"
    
    # 下载到临时文件
    if curl -L --connect-timeout 10 --max-time 300 "$DOWNLOAD_URL" -o /tmp/docker-compose; then
        # 验证下载的文件
        if [ -s /tmp/docker-compose ] && file /tmp/docker-compose | grep -q "executable"; then
            sudo mv /tmp/docker-compose /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
            log_success "DaoCloud镜像下载安装成功"
            return 0
        else
            log_error "下载的文件无效"
            rm -f /tmp/docker-compose
        fi
    fi
    
    return 1
}

# 方法2：使用华为云镜像
install_via_huawei() {
    log_info "方法2: 使用华为云镜像下载..."
    
    COMPOSE_VERSION="2.20.0"
    # 华为云GitHub镜像
    DOWNLOAD_URL="https://repo.huaweicloud.com/docker-compose/v${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)"
    
    log_info "下载地址: $DOWNLOAD_URL"
    
    if curl -L --connect-timeout 10 --max-time 300 "$DOWNLOAD_URL" -o /tmp/docker-compose; then
        if [ -s /tmp/docker-compose ] && file /tmp/docker-compose | grep -q "executable"; then
            sudo mv /tmp/docker-compose /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
            log_success "华为云镜像下载安装成功"
            return 0
        else
            rm -f /tmp/docker-compose
        fi
    fi
    
    return 1
}

# 方法3：使用清华大学镜像
install_via_tsinghua() {
    log_info "方法3: 使用清华大学镜像..."
    
    # 清华大学GitHub镜像
    COMPOSE_VERSION="2.20.0"
    DOWNLOAD_URL="https://mirror.ghproxy.com/https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)"
    
    log_info "下载地址: $DOWNLOAD_URL"
    
    if curl -L --connect-timeout 10 --max-time 300 "$DOWNLOAD_URL" -o /tmp/docker-compose; then
        if [ -s /tmp/docker-compose ] && file /tmp/docker-compose | grep -q "executable"; then
            sudo mv /tmp/docker-compose /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
            log_success "清华镜像下载安装成功"
            return 0
        else
            rm -f /tmp/docker-compose
        fi
    fi
    
    return 1
}

# 方法4：使用pip安装（使用国内PyPI镜像）
install_via_pip() {
    log_info "方法4: 使用pip和国内PyPI镜像安装..."
    
    # 安装pip3（如果没有）
    if ! command -v pip3 &> /dev/null; then
        log_info "安装pip3..."
        sudo yum install -y python3-pip
    fi
    
    # 配置pip使用国内镜像
    log_info "配置pip使用阿里云镜像..."
    mkdir -p ~/.pip
    cat > ~/.pip/pip.conf << EOF
[global]
index-url = https://mirrors.aliyun.com/pypi/simple/
trusted-host = mirrors.aliyun.com
timeout = 120
EOF
    
    # 升级pip
    python3 -m pip install --upgrade pip
    
    # 安装docker-compose
    log_info "安装docker-compose..."
    if python3 -m pip install docker-compose==1.29.2; then
        log_success "pip安装docker-compose成功"
        return 0
    fi
    
    return 1
}

# 方法5：使用系统包管理器
install_via_yum() {
    log_info "方法5: 使用系统包管理器安装..."
    
    # 先尝试EPEL仓库
    sudo yum install -y epel-release
    
    # 安装docker-compose
    if sudo yum install -y docker-compose; then
        log_success "系统包管理器安装成功"
        return 0
    fi
    
    return 1
}

# 方法6：手动下载稳定版本
install_manual_stable() {
    log_info "方法6: 手动下载稳定版本..."
    
    # 创建临时目录
    mkdir -p /tmp/docker-compose-install
    cd /tmp/docker-compose-install
    
    # 下载预编译的稳定版本（使用多个镜像源）
    COMPOSE_VERSION="1.29.2"
    
    # 尝试多个下载源
    DOWNLOAD_URLS=(
        "https://github.91chi.fun/https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)"
        "https://download.fastgit.org/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)"
        "https://hub.fastgit.xyz/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)"
    )
    
    for url in "${DOWNLOAD_URLS[@]}"; do
        log_info "尝试下载: $url"
        if curl -L --connect-timeout 10 --max-time 180 "$url" -o docker-compose; then
            if [ -s docker-compose ] && file docker-compose | grep -q "executable"; then
                sudo mv docker-compose /usr/local/bin/docker-compose
                sudo chmod +x /usr/local/bin/docker-compose
                log_success "手动下载安装成功"
                return 0
            fi
        fi
    done
    
    return 1
}

# 验证安装
verify_installation() {
    log_info "验证Docker Compose安装..."
    
    if command -v docker-compose &> /dev/null; then
        VERSION=$(docker-compose --version)
        log_success "安装成功: $VERSION"
        
        # 测试docker-compose命令
        if docker-compose version > /dev/null 2>&1; then
            log_success "docker-compose命令可正常使用"
            return 0
        else
            log_error "docker-compose命令不能正常使用"
            return 1
        fi
    elif docker compose version > /dev/null 2>&1; then
        VERSION=$(docker compose version)
        log_success "使用内置命令: $VERSION"
        
        # 创建docker-compose别名
        log_info "创建docker-compose别名..."
        sudo tee /usr/local/bin/docker-compose > /dev/null <<'EOF'
#!/bin/bash
docker compose "$@"
EOF
        sudo chmod +x /usr/local/bin/docker-compose
        log_success "已创建docker-compose别名"
        return 0
    else
        log_error "Docker Compose安装失败"
        return 1
    fi
}

# 清理临时文件
cleanup() {
    rm -rf /tmp/docker-compose /tmp/docker-compose-install
}

# 主安装流程
main() {
    log_info "开始快速安装Docker Compose..."
    
    # 检查Docker是否安装
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查是否已安装
    if command -v docker-compose &> /dev/null; then
        CURRENT_VERSION=$(docker-compose --version)
        log_info "已安装版本: $CURRENT_VERSION"
        read -p "是否重新安装？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "保持当前安装"
            exit 0
        fi
    fi
    
    # 按优先级尝试不同的安装方法
    local methods=(
        "install_via_daocloud"
        "install_via_pip" 
        "install_via_huawei"
        "install_via_tsinghua"
        "install_via_yum"
        "install_manual_stable"
    )
    
    for method in "${methods[@]}"; do
        log_info "尝试安装方法: $method"
        if $method; then
            break
        else
            log_error "$method 安装失败，尝试下一种方法..."
            cleanup
        fi
    done
    
    # 验证安装
    if verify_installation; then
        echo ""
        log_success "🎉 Docker Compose安装完成！"
        echo "================================"
        echo "📝 验证命令:"
        echo "   docker-compose --version"
        echo "   docker-compose config"
        echo ""
        echo "🚀 现在可以运行部署脚本:"
        echo "   ./deploy-production.sh"
    else
        log_error "Docker Compose安装失败"
        echo ""
        echo "🔧 手动安装建议:"
        echo "1. 检查网络连接"
        echo "2. 尝试使用Docker内置compose: docker compose version"
        echo "3. 联系技术支持"
        exit 1
    fi
    
    cleanup
}

# 执行安装
main "$@" 