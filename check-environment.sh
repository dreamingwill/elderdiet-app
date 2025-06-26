#!/bin/bash

# ECS环境配置检查脚本
# 全面检查系统状态、软件安装、服务运行等情况

echo "🔍 ECS环境配置检查报告"
echo "======================"
echo "检查时间: $(date)"
echo ""

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

# 1. 系统基本信息
check_system_info() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "【1. 系统基本信息】"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo "🖥️ 系统信息:"
    cat /etc/os-release 2>/dev/null || echo "无法获取系统信息"
    
    echo ""
    echo "💾 内存信息:"
    free -h
    
    echo ""
    echo "💽 磁盘使用:"
    df -h
    
    echo ""
    echo "🔄 系统负载:"
    uptime
    
    echo ""
    echo "🌐 网络接口:"
    ip addr show | grep -E "inet |UP"
    
    echo ""
}

# 2. 阿里云ECS特定信息
check_aliyun_info() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "【2. 阿里云ECS信息】"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo "🏷️ 实例信息:"
    echo "实例ID: $(curl -s --connect-timeout 3 http://100.100.100.200/latest/meta-data/instance-id 2>/dev/null || echo '无法获取')"
    echo "地域: $(curl -s --connect-timeout 3 http://100.100.100.200/latest/meta-data/region-id 2>/dev/null || echo '无法获取')"
    echo "可用区: $(curl -s --connect-timeout 3 http://100.100.100.200/latest/meta-data/zone-id 2>/dev/null || echo '无法获取')"
    echo "内网IP: $(curl -s --connect-timeout 3 http://100.100.100.200/latest/meta-data/private-ipv4 2>/dev/null || echo '无法获取')"
    echo "公网IP: $(curl -s --connect-timeout 3 http://100.100.100.200/latest/meta-data/eipv4 2>/dev/null || echo '无法获取')"
    
    echo ""
}

# 3. 网络连接检查
check_network() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "【3. 网络连接检查】"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo "🌐 DNS配置:"
    cat /etc/resolv.conf
    
    echo ""
    echo "🔗 网络连通性测试:"
    
    # 测试基本连通性
    if ping -c 2 8.8.8.8 >/dev/null 2>&1; then
        log_success "外网连接正常 (8.8.8.8)"
    else
        log_error "外网连接失败 (8.8.8.8)"
    fi
    
    if ping -c 2 baidu.com >/dev/null 2>&1; then
        log_success "DNS解析正常 (baidu.com)"
    else
        log_error "DNS解析失败 (baidu.com)"
    fi
    
    # 测试常用镜像源
    echo ""
    echo "📦 镜像源连接测试:"
    test_urls=(
        "https://mirrors.aliyun.com"
        "https://maven.aliyun.com"
        "https://registry.cn-hangzhou.aliyuncs.com"
        "https://repo.mongodb.org"
    )
    
    for url in "${test_urls[@]}"; do
        if curl -s --connect-timeout 5 "$url" >/dev/null 2>&1; then
            log_success "$url - 可访问"
        else
            log_warning "$url - 无法访问"
        fi
    done
    
    echo ""
}

# 4. 软件安装状态
check_software() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "【4. 软件安装状态】"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Java检查
    echo "☕ Java状态:"
    if command -v java &> /dev/null; then
        java -version 2>&1 | head -3
        echo "JAVA_HOME: ${JAVA_HOME:-'未设置'}"
        log_success "Java已安装"
    else
        log_error "Java未安装"
    fi
    
    echo ""
    
    # Maven检查
    echo "🔧 Maven状态:"
    if command -v mvn &> /dev/null; then
        mvn -version | head -3
        log_success "Maven已安装"
        
        # 检查Maven配置
        if [ -f ~/.m2/settings.xml ]; then
            echo "Maven配置文件存在: ~/.m2/settings.xml"
            grep -E "aliyun|mirror" ~/.m2/settings.xml | head -3 || echo "无镜像配置"
        else
            log_warning "Maven配置文件不存在"
        fi
    else
        log_error "Maven未安装"
    fi
    
    echo ""
    
    # Docker检查
    echo "🐳 Docker状态:"
    if command -v docker &> /dev/null; then
        docker --version
        echo "Docker服务状态: $(systemctl is-active docker 2>/dev/null || echo '未运行')"
        log_success "Docker已安装"
        
        # Docker镜像加速器检查
        if [ -f /etc/docker/daemon.json ]; then
            echo "Docker配置存在:"
            cat /etc/docker/daemon.json | head -10
        else
            log_warning "Docker配置文件不存在"
        fi
    else
        log_warning "Docker未安装"
    fi
    
    echo ""
    
    # MongoDB检查
    echo "🍃 MongoDB状态:"
    mongodb_found=false
    
    if command -v mongod &> /dev/null; then
        echo "mongod: $(which mongod)"
        mongodb_found=true
    fi
    
    if command -v mongosh &> /dev/null; then
        echo "mongosh: $(which mongosh)"
        mongodb_found=true
    fi
    
    if command -v mongo &> /dev/null; then
        echo "mongo: $(which mongo)"
        mongodb_found=true
    fi
    
    if $mongodb_found; then
        log_success "MongoDB工具已安装"
    else
        log_error "MongoDB工具未安装"
    fi
    
    echo ""
}

# 5. 服务运行状态
check_services() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "【5. 服务运行状态】"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    services=("mongod" "mongodb" "elderdiet" "docker")
    
    for service in "${services[@]}"; do
        if systemctl list-unit-files | grep -q "^$service.service"; then
            status=$(systemctl is-active $service 2>/dev/null)
            enabled=$(systemctl is-enabled $service 2>/dev/null)
            
            echo "🔧 $service 服务:"
            echo "  状态: $status"
            echo "  开机启动: $enabled"
            
            if [ "$status" = "active" ]; then
                log_success "$service 正在运行"
            else
                log_warning "$service 未运行"
            fi
        else
            log_info "$service 服务未安装"
        fi
        echo ""
    done
}

# 6. 应用相关检查
check_application() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "【6. ElderDiet应用检查】"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 项目目录检查
    echo "📁 项目目录:"
    if [ -d "/root/elderdiet-app" ]; then
        echo "项目路径: /root/elderdiet-app"
        echo "项目文件:"
        ls -la /root/elderdiet-app/*.sh 2>/dev/null || echo "无脚本文件"
        log_success "项目目录存在"
    else
        log_error "项目目录不存在"
    fi
    
    echo ""
    
    # 应用文件检查
    echo "📦 应用文件:"
    if [ -f "/opt/elderdiet/app.jar" ]; then
        echo "应用JAR: /opt/elderdiet/app.jar"
        echo "文件大小: $(du -h /opt/elderdiet/app.jar | cut -f1)"
        log_success "应用文件存在"
    else
        log_warning "应用文件不存在"
    fi
    
    echo ""
    
    # 构建文件检查
    echo "🔨 构建文件:"
    if [ -d "/root/elderdiet-app/elderdiet-backend-java/target" ]; then
        echo "构建目录存在:"
        ls -la /root/elderdiet-app/elderdiet-backend-java/target/*.jar 2>/dev/null || echo "无JAR文件"
    else
        log_warning "构建目录不存在"
    fi
    
    echo ""
    
    # 环境变量文件检查
    echo "⚙️ 配置文件:"
    if [ -f "/root/elderdiet-app/prod.env" ]; then
        echo "环境变量文件存在:"
        grep -v "PASSWORD\|SECRET" /root/elderdiet-app/prod.env | head -5
        log_success "配置文件存在"
    else
        log_error "配置文件不存在"
    fi
    
    echo ""
}

# 7. 端口和API检查
check_ports_api() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "【7. 端口和API检查】"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 端口监听检查
    echo "🔌 端口监听状态:"
    important_ports=(3001 27017 22 80 443)
    
    for port in "${important_ports[@]}"; do
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            process=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | head -1)
            log_success "端口 $port 已监听 ($process)"
        else
            log_warning "端口 $port 未监听"
        fi
    done
    
    echo ""
    
    # API健康检查
    echo "🏥 API健康检查:"
    if curl -f http://localhost:3001/actuator/health >/dev/null 2>&1; then
        log_success "健康检查API正常"
        echo "健康状态:"
        curl -s http://localhost:3001/actuator/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3001/actuator/health
    else
        log_error "健康检查API无响应"
    fi
    
    echo ""
    
    # 外部访问测试
    echo "🌍 外部访问测试:"
    external_ip=$(curl -s --connect-timeout 3 http://100.100.100.200/latest/meta-data/eipv4 2>/dev/null)
    if [ -n "$external_ip" ]; then
        echo "外网访问地址: http://$external_ip:3001"
        echo "测试外网访问..."
        if curl -f http://$external_ip:3001/actuator/health --connect-timeout 10 >/dev/null 2>&1; then
            log_success "外网访问正常"
        else
            log_warning "外网访问失败 (可能是防火墙问题)"
        fi
    else
        log_warning "无法获取外网IP"
    fi
    
    echo ""
}

# 8. 资源使用情况
check_resources() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "【8. 资源使用情况】"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo "💾 内存使用详情:"
    free -h
    
    echo ""
    echo "🔄 CPU使用情况:"
    top -bn1 | grep "Cpu(s)" | head -1
    
    echo ""
    echo "📊 进程TOP5 (按内存):"
    ps aux --sort=-%mem | head -6
    
    echo ""
    echo "💽 磁盘IO状态:"
    iostat 2>/dev/null | tail -10 || echo "iostat命令不可用"
    
    echo ""
}

# 9. 日志检查
check_logs() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "【9. 关键日志检查】"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 应用日志
    echo "📝 ElderDiet应用日志 (最近10行):"
    if systemctl list-unit-files | grep -q "elderdiet.service"; then
        journalctl -u elderdiet --no-pager -n 10 2>/dev/null || echo "无法获取应用日志"
    else
        echo "ElderDiet服务未安装"
    fi
    
    echo ""
    
    # MongoDB日志
    echo "🍃 MongoDB日志 (最近5行):"
    if [ -f "/var/log/mongodb/mongod.log" ]; then
        tail -5 /var/log/mongodb/mongod.log 2>/dev/null || echo "无法读取MongoDB日志"
    else
        echo "MongoDB日志文件不存在"
    fi
    
    echo ""
    
    # 系统日志中的错误
    echo "🚨 最近系统错误 (最近5条):"
    journalctl --no-pager -p err -n 5 2>/dev/null || echo "无法获取系统错误日志"
    
    echo ""
}

# 10. 建议和总结
generate_summary() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "【10. 检查总结和建议】"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo "📋 检查完成时间: $(date)"
    echo ""
    
    echo "💡 常用管理命令:"
    echo "   查看应用状态: systemctl status elderdiet"
    echo "   查看应用日志: journalctl -u elderdiet -f"
    echo "   重启应用: systemctl restart elderdiet"
    echo "   查看MongoDB状态: systemctl status mongod"
    echo "   测试API: curl http://localhost:3001/actuator/health"
    echo ""
    
    echo "🔧 故障排除命令:"
    echo "   检查端口占用: netstat -tlnp | grep :3001"
    echo "   检查进程: ps aux | grep elderdiet"
    echo "   检查防火墙: firewall-cmd --list-all"
    echo "   测试网络: ping -c 3 8.8.8.8"
    echo ""
    
    echo "📊 性能监控命令:"
    echo "   实时资源使用: htop"
    echo "   磁盘使用: df -h"
    echo "   内存使用: free -h"
    echo "   网络连接: ss -tuln"
    echo ""
}

# 主执行函数
main() {
    check_system_info
    check_aliyun_info
    check_network
    check_software
    check_services
    check_application
    check_ports_api
    check_resources
    check_logs
    generate_summary
    
    echo "✅ 环境检查完成！"
}

# 执行检查
main "$@" 