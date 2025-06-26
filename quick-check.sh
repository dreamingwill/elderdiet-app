#!/bin/bash

# 快速环境检查脚本
# 快速验证关键服务和配置状态

echo "🚀 ElderDiet快速环境检查"
echo "========================"

# 基本信息
echo "📅 检查时间: $(date)"
echo "🖥️ 主机名: $(hostname)"
echo "🌐 内网IP: $(hostname -I | awk '{print $1}')"

# 关键软件检查
echo ""
echo "📦 关键软件状态:"
echo "----------------------------------------"

# Java
if command -v java &> /dev/null; then
    echo "✅ Java: $(java -version 2>&1 | head -1)"
else
    echo "❌ Java: 未安装"
fi

# Maven
if command -v mvn &> /dev/null; then
    echo "✅ Maven: $(mvn -version | head -1 | cut -d' ' -f3)"
else
    echo "❌ Maven: 未安装"
fi

# Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
    echo "   Docker服务: $(systemctl is-active docker 2>/dev/null || echo '未运行')"
else
    echo "❌ Docker: 未安装"
fi

# MongoDB
if command -v mongod &> /dev/null || command -v mongo &> /dev/null; then
    echo "✅ MongoDB: 已安装"
    echo "   MongoDB服务: $(systemctl is-active mongod 2>/dev/null || systemctl is-active mongodb 2>/dev/null || echo '未运行')"
else
    echo "❌ MongoDB: 未安装"
fi

# 网络连接测试
echo ""
echo "🌐 网络连接状态:"
echo "----------------------------------------"

# 基本网络
if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    echo "✅ 外网连通: 正常"
else
    echo "❌ 外网连通: 失败"
fi

# 阿里云镜像源
if curl -s --connect-timeout 3 https://mirrors.aliyun.com >/dev/null 2>&1; then
    echo "✅ 阿里云镜像: 可访问"
else
    echo "❌ 阿里云镜像: 无法访问"
fi

# 端口监听状态
echo ""
echo "🔌 端口监听状态:"
echo "----------------------------------------"

check_port() {
    local port=$1
    local name=$2
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        local process=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | head -1)
        echo "✅ $name (端口$port): 已监听 [$process]"
    else
        echo "❌ $name (端口$port): 未监听"
    fi
}

check_port 3001 "ElderDiet API"
check_port 27017 "MongoDB"
check_port 22 "SSH"

# 应用状态检查
echo ""
echo "🚀 应用状态:"
echo "----------------------------------------"

# 项目目录
if [ -d "/root/elderdiet-app" ]; then
    echo "✅ 项目目录: 存在"
else
    echo "❌ 项目目录: 不存在"
fi

# 应用文件
if [ -f "/opt/elderdiet/app.jar" ]; then
    echo "✅ 应用文件: 存在 ($(du -h /opt/elderdiet/app.jar | cut -f1))"
else
    echo "❌ 应用文件: 不存在"
fi

# ElderDiet服务
if systemctl list-unit-files | grep -q "elderdiet.service"; then
    status=$(systemctl is-active elderdiet 2>/dev/null)
    echo "✅ ElderDiet服务: $status"
else
    echo "❌ ElderDiet服务: 未安装"
fi

# API健康检查
echo ""
echo "🏥 API健康检查:"
echo "----------------------------------------"

if curl -f http://localhost:3001/actuator/health >/dev/null 2>&1; then
    echo "✅ 健康检查: 正常"
    health_status=$(curl -s http://localhost:3001/actuator/health | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    echo "   状态: $health_status"
else
    echo "❌ 健康检查: 失败"
fi

# 外网访问测试
external_ip=$(curl -s --connect-timeout 3 http://100.100.100.200/latest/meta-data/eipv4 2>/dev/null)
if [ -n "$external_ip" ]; then
    echo ""
    echo "🌍 外网访问:"
    echo "----------------------------------------"
    echo "📍 外网地址: http://$external_ip:3001"
    
    if curl -f http://$external_ip:3001/actuator/health --connect-timeout 5 >/dev/null 2>&1; then
        echo "✅ 外网访问: 正常"
    else
        echo "❌ 外网访问: 失败 (检查防火墙和安全组)"
    fi
fi

# 资源使用情况
echo ""
echo "📊 资源使用:"
echo "----------------------------------------"

# 内存使用
mem_info=$(free | grep Mem)
mem_total=$(echo $mem_info | awk '{print $2}')
mem_used=$(echo $mem_info | awk '{print $3}')
mem_percent=$((mem_used * 100 / mem_total))
echo "💾 内存使用: $mem_percent% ($(free -h | grep Mem | awk '{print $3"/"$2}'))"

# 磁盘使用
disk_percent=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo "💽 磁盘使用: $disk_percent% ($(df -h / | tail -1 | awk '{print $3"/"$2}'))"

# CPU负载
load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
echo "🔄 系统负载: $load_avg"

echo ""
echo "📋 快速检查完成！"

# 如果有问题，给出建议
echo ""
echo "💡 常用命令:"
echo "   完整检查: bash check-environment.sh"
echo "   查看日志: journalctl -u elderdiet -f"
echo "   重启服务: systemctl restart elderdiet"
echo "   测试API: curl http://localhost:3001/actuator/health" 