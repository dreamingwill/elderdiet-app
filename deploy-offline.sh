#!/bin/bash

# ElderDiet 离线部署脚本
# 直接安装Java和MongoDB，不依赖Docker
# 适用于网络连接困难的环境

set -e

echo "📦 ElderDiet 离线部署脚本"
echo "========================"

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

# 加载环境变量
load_environment() {
    log_info "加载环境变量..."
    
    if [ ! -f "prod.env" ]; then
        log_error "prod.env 文件不存在"
        exit 1
    fi
    
    set -a
    source <(grep -v '^#' prod.env | grep -v '^$')
    set +a
    
    log_success "环境变量加载完成"
}

# 1. 安装Java 17
install_java() {
    log_info "安装Java 17..."
    
    # 检查是否已安装Java 17
    if java -version 2>&1 | grep -q "17\."; then
        log_success "Java 17 已安装"
        return 0
    fi
    
    # 安装OpenJDK 17
    yum update -y
    yum install -y java-17-openjdk java-17-openjdk-devel
    
    # 设置JAVA_HOME
    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
    echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk' >> /etc/profile
    echo 'export PATH=$JAVA_HOME/bin:$PATH' >> /etc/profile
    
    source /etc/profile
    
    log_success "Java 17 安装完成"
    java -version
}

# 2. 安装MongoDB
install_mongodb() {
    log_info "安装MongoDB..."
    
    # 检查是否已安装
    if systemctl is-active --quiet mongod 2>/dev/null; then
        log_success "MongoDB 已安装并运行"
        return 0
    fi
    
    # 创建MongoDB仓库文件
    cat > /etc/yum.repos.d/mongodb-org-5.0.repo << 'EOF'
[mongodb-org-5.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/5.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-5.0.asc
EOF
    
    # 安装MongoDB
    yum install -y mongodb-org
    
    # 启动MongoDB
    systemctl start mongod
    systemctl enable mongod
    
    log_success "MongoDB 安装完成"
}

# 3. 配置MongoDB
configure_mongodb() {
    log_info "配置MongoDB..."
    
    # 等待MongoDB启动
    sleep 5
    
    # 创建管理员用户
    mongo admin --eval "
        db.createUser({
            user: 'admin',
            pwd: '${MONGO_PASSWORD}',
            roles: [{ role: 'userAdminAnyDatabase', db: 'admin' }]
        })
    " 2>/dev/null || log_warning "管理员用户可能已存在"
    
    # 创建应用数据库和用户
    mongo elderdiet --eval "
        db.createUser({
            user: 'elderdiet',
            pwd: '${MONGO_PASSWORD}',
            roles: [{ role: 'readWrite', db: 'elderdiet' }]
        })
    " 2>/dev/null || log_warning "应用用户可能已存在"
    
    log_success "MongoDB 配置完成"
}

# 4. 构建Spring Boot应用
build_application() {
    log_info "构建Spring Boot应用..."
    
    cd elderdiet-backend-java
    
    # 检查是否已有构建结果
    if [ -f target/elderdiet-backend-java-*.jar ]; then
        log_info "发现已构建的JAR文件，跳过构建"
        cd ..
        return 0
    fi
    
    # 使用Maven构建
    if command -v mvn &> /dev/null; then
        log_info "使用Maven构建..."
        mvn clean package -DskipTests
    else
        log_info "Maven未安装，尝试安装..."
        yum install -y maven
        mvn clean package -DskipTests
    fi
    
    cd ..
    log_success "应用构建完成"
}

# 5. 创建应用服务
create_application_service() {
    log_info "创建应用系统服务..."
    
    # 创建应用目录
    mkdir -p /opt/elderdiet
    
    # 复制JAR文件
    cp elderdiet-backend-java/target/elderdiet-backend-java-*.jar /opt/elderdiet/app.jar
    
    # 创建应用用户
    useradd -r -s /bin/false elderdiet 2>/dev/null || true
    chown -R elderdiet:elderdiet /opt/elderdiet
    
    # 创建systemd服务文件
    cat > /etc/systemd/system/elderdiet.service << EOF
[Unit]
Description=ElderDiet Backend Application
After=network.target mongod.service
Requires=mongod.service

[Service]
Type=simple
User=elderdiet
Group=elderdiet
WorkingDirectory=/opt/elderdiet
ExecStart=/usr/bin/java -Xms256m -Xmx768m -XX:+UseG1GC -jar /opt/elderdiet/app.jar
Restart=always
RestartSec=10

Environment=SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE}
Environment=MONGODB_URI=mongodb://elderdiet:${MONGO_PASSWORD}@localhost:27017/elderdiet
Environment=JWT_SECRET=${JWT_SECRET}
Environment=JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
Environment=SERVER_PORT=${SERVER_PORT}

[Install]
WantedBy=multi-user.target
EOF
    
    # 重载systemd并启动服务
    systemctl daemon-reload
    systemctl enable elderdiet
    systemctl start elderdiet
    
    log_success "应用服务创建完成"
}

# 6. 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    # 检查firewalld状态
    if systemctl is-active --quiet firewalld; then
        firewall-cmd --permanent --add-port=3001/tcp
        firewall-cmd --reload
        log_success "防火墙配置完成"
    else
        log_info "防火墙未启用，跳过配置"
    fi
}

# 7. 等待服务启动
wait_for_service() {
    log_info "等待应用服务启动..."
    
    local timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3001/actuator/health > /dev/null 2>&1; then
            log_success "应用服务已启动"
            return 0
        fi
        sleep 5
        timeout=$((timeout-5))
    done
    
    log_error "应用服务启动超时"
    systemctl status elderdiet
    return 1
}

# 8. 显示部署结果
show_deployment_result() {
    echo ""
    echo "🎉 离线部署完成！"
    echo "=================="
    echo ""
    echo "📱 应用访问地址:"
    echo "   http://8.153.204.247:3001"
    echo ""
    echo "🔍 健康检查:"
    echo "   http://8.153.204.247:3001/actuator/health"
    echo ""
    echo "📊 服务状态:"
    echo "   Java版本: $(java -version 2>&1 | head -1)"
    echo "   MongoDB状态: $(systemctl is-active mongod)"
    echo "   应用状态: $(systemctl is-active elderdiet)"
    echo ""
    echo "📝 管理命令:"
    echo "   查看应用日志: journalctl -u elderdiet -f"
    echo "   重启应用: systemctl restart elderdiet"
    echo "   停止应用: systemctl stop elderdiet"
    echo "   查看MongoDB状态: systemctl status mongod"
    echo ""
    
    # 显示实际的健康检查结果
    echo "🏥 健康检查结果:"
    curl -s http://localhost:3001/actuator/health | python3 -m json.tool 2>/dev/null || echo "健康检查API暂时不可用"
}

# 主执行流程
main() {
    log_info "开始离线部署ElderDiet..."
    
    load_environment
    install_java
    install_mongodb
    configure_mongodb
    build_application
    create_application_service
    configure_firewall
    wait_for_service
    show_deployment_result
    
    log_success "🚀 ElderDiet 离线部署成功！"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主流程
main "$@" 