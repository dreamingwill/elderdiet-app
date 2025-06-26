#!/bin/bash

# ElderDiet 简化部署脚本
# 避免系统兼容性问题，直接进行核心安装

set -e

echo "📦 ElderDiet 简化部署脚本"
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

# 1. 安装Java 17（简化版）
install_java() {
    log_info "安装Java 17..."
    
    # 检查是否已安装Java 17
    if java -version 2>&1 | grep -q "17\."; then
        log_success "Java 17 已安装"
        return 0
    fi
    
    # 直接安装，忽略警告
    log_info "安装OpenJDK 17..."
    yum install -y java-17-openjdk java-17-openjdk-devel >/dev/null 2>&1 || {
        log_warning "标准安装失败，尝试强制安装..."
        yum install -y java-17-openjdk java-17-openjdk-devel --skip-broken
    }
    
    # 设置JAVA_HOME
    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
    echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk' >> /etc/profile
    echo 'export PATH=$JAVA_HOME/bin:$PATH' >> /etc/profile
    source /etc/profile
    
    log_success "Java 17 安装完成"
    java -version
}

# 2. 安装Maven（简化版）
install_maven() {
    log_info "安装Maven..."
    
    if command -v mvn &> /dev/null; then
        log_success "Maven 已安装"
    else
        # 尝试系统安装
        yum install -y maven >/dev/null 2>&1 || {
            log_info "系统Maven安装失败，手动安装..."
            install_maven_manual
        }
    fi
    
    # 简化的Maven配置
    mkdir -p ~/.m2
    cat > ~/.m2/settings.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<settings>
  <mirrors>
    <mirror>
      <id>aliyun-maven</id>
      <name>Aliyun Maven</name>
      <url>https://maven.aliyun.com/repository/public</url>
      <mirrorOf>central</mirrorOf>
    </mirror>
  </mirrors>
</settings>
EOF
    
    log_success "Maven 安装完成"
}

# 手动安装Maven
install_maven_manual() {
    cd /tmp
    log_info "下载Maven..."
    
    if curl -L -o maven.tar.gz "https://mirrors.aliyun.com/apache/maven/maven-3/3.8.6/binaries/apache-maven-3.8.6-bin.tar.gz"; then
        tar -xzf maven.tar.gz
        mv apache-maven-3.8.6 /opt/maven
        ln -sf /opt/maven/bin/mvn /usr/local/bin/mvn
        export M2_HOME=/opt/maven
        export PATH=$M2_HOME/bin:$PATH
        echo 'export M2_HOME=/opt/maven' >> /etc/profile
        echo 'export PATH=$M2_HOME/bin:$PATH' >> /etc/profile
        log_success "Maven手动安装完成"
    else
        log_error "Maven下载失败"
        exit 1
    fi
}

# 3. 安装MongoDB（最简策略）
install_mongodb() {
    log_info "安装MongoDB..."
    
    # 检查是否已安装
    if systemctl is-active --quiet mongod 2>/dev/null; then
        log_success "MongoDB 已安装并运行"
        return 0
    fi
    
    # 策略1: 直接从系统仓库安装
    if yum list available mongodb* 2>/dev/null | grep -q mongodb; then
        log_info "从系统仓库安装MongoDB..."
        yum install -y mongodb mongodb-server >/dev/null 2>&1 && {
            systemctl start mongod 2>/dev/null || systemctl start mongodb
            systemctl enable mongod 2>/dev/null || systemctl enable mongodb
            log_success "系统仓库安装MongoDB成功"
            return 0
        }
    fi
    
    # 策略2: 安装替代品 - 使用Docker运行MongoDB
    if command -v docker &> /dev/null; then
        log_info "使用Docker运行MongoDB..."
        docker run -d --name mongodb \
            -p 27017:27017 \
            -e MONGO_INITDB_ROOT_USERNAME=admin \
            -e MONGO_INITDB_ROOT_PASSWORD=$MONGO_PASSWORD \
            --restart unless-stopped \
            mongo:5.0 >/dev/null 2>&1 && {
            log_success "Docker MongoDB启动成功"
            return 0
        }
    fi
    
    # 策略3: 手动下载最小版本
    log_info "下载MongoDB二进制文件..."
    cd /tmp
    
    if curl -L -o mongodb.tgz "https://mirrors.aliyun.com/mongodb/linux/mongodb-linux-x86_64-rhel80-5.0.14.tgz"; then
        tar -xzf mongodb.tgz
        mkdir -p /opt/mongodb
        cp mongodb-linux-x86_64-rhel80-5.0.14/bin/mongod /opt/mongodb/
        cp mongodb-linux-x86_64-rhel80-5.0.14/bin/mongo* /opt/mongodb/ 2>/dev/null || true
        
        # 创建用户和目录
        useradd -r -s /bin/false mongodb 2>/dev/null || true
        mkdir -p /var/lib/mongodb /var/log/mongodb
        chown mongodb:mongodb /var/lib/mongodb /var/log/mongodb
        
        # 启动MongoDB
        /opt/mongodb/mongod --dbpath /var/lib/mongodb --logpath /var/log/mongodb/mongod.log --fork
        
        log_success "手动安装MongoDB成功"
        return 0
    fi
    
    log_error "MongoDB安装失败"
    exit 1
}

# 4. 构建应用（简化版）
build_application() {
    log_info "构建Spring Boot应用..."
    
    cd elderdiet-backend-java
    
    # 检查现有构建
    if [ -f target/elderdiet-backend-java-*.jar ]; then
        log_info "发现已构建的JAR文件"
        cd ..
        return 0
    fi
    
    # 简化构建
    log_info "Maven构建（使用阿里云镜像）..."
    mvn clean package -DskipTests -q || {
        log_warning "构建失败，尝试详细模式..."
        mvn clean package -DskipTests
    }
    
    cd ..
    log_success "应用构建完成"
}

# 5. 创建服务
create_service() {
    log_info "创建应用服务..."
    
    # 创建目录和用户
    mkdir -p /opt/elderdiet
    cp elderdiet-backend-java/target/elderdiet-backend-java-*.jar /opt/elderdiet/app.jar
    useradd -r -s /bin/false elderdiet 2>/dev/null || true
    chown -R elderdiet:elderdiet /opt/elderdiet
    
    # 创建服务文件
    cat > /etc/systemd/system/elderdiet.service << EOF
[Unit]
Description=ElderDiet Backend
After=network.target

[Service]
Type=simple
User=elderdiet
WorkingDirectory=/opt/elderdiet
ExecStart=/usr/bin/java -Xms256m -Xmx768m -jar /opt/elderdiet/app.jar
Restart=always

Environment=SPRING_PROFILES_ACTIVE=$SPRING_PROFILES_ACTIVE
Environment=MONGODB_URI=mongodb://admin:$MONGO_PASSWORD@localhost:27017/elderdiet?authSource=admin
Environment=JWT_SECRET=$JWT_SECRET
Environment=JWT_EXPIRES_IN=$JWT_EXPIRES_IN
Environment=SERVER_PORT=$SERVER_PORT

[Install]
WantedBy=multi-user.target
EOF
    
    # 启动服务
    systemctl daemon-reload
    systemctl enable elderdiet
    systemctl start elderdiet
    
    log_success "应用服务创建完成"
}

# 6. 等待和验证
wait_and_verify() {
    log_info "等待服务启动..."
    
    local timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3001/actuator/health > /dev/null 2>&1; then
            log_success "服务启动成功！"
            echo ""
            echo "🎉 部署完成！"
            echo "📱 访问地址: http://8.153.204.247:3001"
            echo "🔍 健康检查: http://8.153.204.247:3001/actuator/health"
            return 0
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    log_error "服务启动超时"
    systemctl status elderdiet
    return 1
}

# 主流程
main() {
    log_info "开始简化部署..."
    
    load_environment
    install_java
    install_maven
    install_mongodb
    build_application
    create_service
    wait_and_verify
    
    log_success "🚀 部署完成！"
}

# 执行
main "$@" 