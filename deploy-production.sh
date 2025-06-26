#!/bin/bash

# ElderDiet 生产环境部署脚本
# 使用方法: ./deploy-production.sh

set -e  # 遇到错误立即退出

echo "🚀 ElderDiet 生产环境部署脚本"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
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

# 检查Docker是否安装
check_docker() {
    log_info "检查Docker环境..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_success "Docker环境检查通过"
}

# 检查内存
check_memory() {
    log_info "检查系统资源..."
    
    # 获取可用内存（MB）
    available_mem=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    
    if [ "$available_mem" -lt 800 ]; then
        log_warning "可用内存较少 (${available_mem}MB)，部署可能会很慢"
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi
    
    log_success "系统资源检查通过"
}

# 停止旧版本
stop_old_version() {
    log_info "停止旧版本服务..."
    
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        docker-compose -f docker-compose.prod.yml down
        log_success "旧版本服务已停止"
    else
        log_info "没有运行中的旧版本服务"
    fi
}

# 构建和启动服务
build_and_start() {
    log_info "构建Docker镜像..."
    
    # 设置环境变量
    export $(cat prod.env | xargs)
    
    # 构建镜像（使用缓存以节省时间）
    docker-compose -f docker-compose.prod.yml build --parallel
    
    log_success "Docker镜像构建完成"
    
    log_info "启动服务..."
    
    # 启动服务
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    log_info "等待服务启动..."
    
    # 等待MongoDB启动
    log_info "等待MongoDB启动..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker exec elderdiet-mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
            log_success "MongoDB已启动"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "MongoDB启动超时"
        exit 1
    fi
    
    # 等待后端服务启动
    log_info "等待后端服务启动..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3001/actuator/health > /dev/null 2>&1; then
            log_success "后端服务已启动"
            break
        fi
        sleep 5
        timeout=$((timeout-5))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "后端服务启动超时"
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
}

# 运行健康检查
run_health_check() {
    log_info "运行健康检查..."
    
    # 检查后端API
    if curl -f http://localhost:3001/actuator/health > /dev/null 2>&1; then
        log_success "后端API健康检查通过"
    else
        log_error "后端API健康检查失败"
        exit 1
    fi
    
    # 检查数据库连接
    if docker exec elderdiet-mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
        log_success "数据库连接检查通过"
    else
        log_error "数据库连接检查失败"
        exit 1
    fi
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "🎉 部署完成！"
    echo "================================"
    echo "📱 应用访问地址:"
    echo "   http://8.153.204.247:3001"
    echo ""
    echo "🔍 API端点:"
    echo "   健康检查: http://8.153.204.247:3001/actuator/health"
    echo "   API文档:  http://8.153.204.247:3001/actuator/info"
    echo ""
    echo "📊 服务状态:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "📝 有用的命令:"
    echo "   查看日志: docker-compose -f docker-compose.prod.yml logs -f"
    echo "   停止服务: docker-compose -f docker-compose.prod.yml down"
    echo "   重启服务: docker-compose -f docker-compose.prod.yml restart"
    echo ""
}

# 主执行流程
main() {
    check_docker
    check_memory
    stop_old_version
    build_and_start
    wait_for_services
    run_health_check
    show_deployment_info
    
    log_success "🎉 ElderDiet 部署成功！"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主流程
main "$@" 