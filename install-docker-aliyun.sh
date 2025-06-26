#!/bin/bash

# 阿里云ECS Docker安装脚本
# 适用于Alibaba Cloud Linux 3 (OpenAnolis Edition)

echo "🐳 在阿里云ECS上安装Docker"
echo "=========================="

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

# 检查系统版本
check_system() {
    log_info "检查系统版本..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "系统: $NAME $VERSION"
        echo "ID: $ID"
    fi
    
    log_success "系统检查完成"
}

# 方案1：使用阿里云镜像源
install_docker_aliyun_mirror() {
    log_info "方案1: 使用阿里云Docker镜像源"
    
    # 删除旧的Docker相关包
    log_info "清理旧版本..."
    sudo yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine || true
    
    # 安装必要的包
    log_info "安装依赖包..."
    sudo yum install -y yum-utils device-mapper-persistent-data lvm2
    
    # 添加阿里云Docker仓库
    log_info "添加阿里云Docker仓库..."
    sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
    
    # 清理缓存
    sudo yum clean all
    sudo yum makecache
    
    # 安装Docker CE
    log_info "安装Docker CE..."
    sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    if [ $? -eq 0 ]; then
        log_success "Docker安装成功！"
        return 0
    else
        log_error "Docker安装失败"
        return 1
    fi
}

# 方案2：使用系统自带的Docker
install_docker_system() {
    log_info "方案2: 使用系统自带的Docker"
    
    # Alibaba Cloud Linux通常自带Docker
    log_info "尝试安装系统自带的Docker..."
    sudo yum install -y docker
    
    if [ $? -eq 0 ]; then
        log_success "系统Docker安装成功！"
        return 0
    else
        log_error "系统Docker安装失败"
        return 1
    fi
}

# 方案3：手动下载RPM包
install_docker_rpm() {
    log_info "方案3: 手动下载RPM包安装"
    
    # 创建临时目录
    mkdir -p /tmp/docker-install
    cd /tmp/docker-install
    
    # 下载Docker RPM包（使用阿里云镜像）
    log_info "下载Docker RPM包..."
    
    # 获取系统架构
    ARCH=$(uname -m)
    if [ "$ARCH" = "x86_64" ]; then
        DOCKER_VERSION="24.0.7"
        
        # 下载必要的RPM包
        curl -fsSL -o containerd.io.rpm https://mirrors.aliyun.com/docker-ce/linux/centos/8/x86_64/stable/Packages/containerd.io-1.6.24-3.1.el8.x86_64.rpm
        curl -fsSL -o docker-ce-cli.rpm https://mirrors.aliyun.com/docker-ce/linux/centos/8/x86_64/stable/Packages/docker-ce-cli-${DOCKER_VERSION}-1.el8.x86_64.rpm
        curl -fsSL -o docker-ce.rpm https://mirrors.aliyun.com/docker-ce/linux/centos/8/x86_64/stable/Packages/docker-ce-${DOCKER_VERSION}-1.el8.x86_64.rpm
        
        # 安装RPM包
        log_info "安装RPM包..."
        sudo yum localinstall -y containerd.io.rpm docker-ce-cli.rpm docker-ce.rpm
        
        if [ $? -eq 0 ]; then
            log_success "Docker RPM安装成功！"
            return 0
        else
            log_error "Docker RPM安装失败"
            return 1
        fi
    else
        log_error "不支持的架构: $ARCH"
        return 1
    fi
}

# 配置Docker服务
configure_docker() {
    log_info "配置Docker服务..."
    
    # 启动Docker服务
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # 将当前用户加入docker组
    sudo usermod -aG docker $USER
    
    # 配置Docker镜像加速器（阿里云）
    log_info "配置Docker镜像加速器..."
    sudo mkdir -p /etc/docker
    
    # 创建Docker配置文件
    sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn",
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
    sudo systemctl restart docker
    
    log_success "Docker服务配置完成"
}

# 安装Docker Compose
install_docker_compose() {
    log_info "安装Docker Compose..."
    
    # 方法1：使用pip安装（如果有Python）
    if command -v pip3 &> /dev/null; then
        log_info "使用pip安装Docker Compose..."
        sudo pip3 install docker-compose
        
        if [ $? -eq 0 ]; then
            log_success "Docker Compose安装成功（pip方式）"
            return 0
        fi
    fi
    
    # 方法2：直接下载二进制文件
    log_info "下载Docker Compose二进制文件..."
    
    # 使用国内镜像源
    COMPOSE_VERSION="2.20.0"
    sudo curl -L "https://get.daocloud.io/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    if [ $? -eq 0 ]; then
        sudo chmod +x /usr/local/bin/docker-compose
        log_success "Docker Compose安装成功（二进制方式）"
        return 0
    else
        log_error "Docker Compose安装失败"
        return 1
    fi
}

# 验证安装
verify_installation() {
    log_info "验证Docker安装..."
    
    # 检查Docker版本
    if docker --version; then
        log_success "Docker版本检查通过"
    else
        log_error "Docker版本检查失败"
        return 1
    fi
    
    # 检查Docker Compose版本
    if docker-compose --version || docker compose version; then
        log_success "Docker Compose版本检查通过"
    else
        log_warning "Docker Compose可能未正确安装"
    fi
    
    # 测试Docker运行
    log_info "测试Docker运行..."
    if sudo docker run hello-world; then
        log_success "Docker运行测试通过"
    else
        log_error "Docker运行测试失败"
        return 1
    fi
}

# 主安装流程
main() {
    check_system
    
    # 尝试不同的安装方案
    if install_docker_aliyun_mirror; then
        log_success "使用阿里云镜像源安装成功"
    elif install_docker_system; then
        log_success "使用系统包安装成功"
    elif install_docker_rpm; then
        log_success "使用RPM包安装成功"
    else
        log_error "所有安装方案都失败了"
        exit 1
    fi
    
    configure_docker
    install_docker_compose
    verify_installation
    
    echo ""
    log_success "🎉 Docker安装完成！"
    echo "================================"
    echo "📝 重要提示："
    echo "1. 请退出并重新登录以使用户组生效"
    echo "2. 或者使用 'newgrp docker' 命令"
    echo "3. 然后可以不用sudo运行docker命令"
    echo ""
    echo "🔧 有用的命令："
    echo "   docker --version"
    echo "   docker-compose --version"
    echo "   docker run hello-world"
}

# 运行主程序
main "$@" 