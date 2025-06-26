#!/bin/bash

# ElderDiet 离线部署脚本 - 修复版
# 解决MongoDB安装问题，使用多种安装策略
# 适用于阿里云ECS Alibaba Cloud Linux 3

set -e

echo "📦 ElderDiet 离线部署脚本 - 修复版"
echo "=================================="

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

# 0. 配置系统镜像源
configure_system_repos() {
    log_info "配置系统镜像源..."
    
    # 检测系统信息
    if [ -f /etc/os-release ]; then
        source /etc/os-release
        log_info "检测到系统: $PRETTY_NAME"
    fi
    
    # 备份原有配置
    cp -r /etc/yum.repos.d /etc/yum.repos.d.backup 2>/dev/null || true
    
    # 如果是阿里云ECS，配置阿里云镜像源
    if curl -s --connect-timeout 5 http://100.100.100.200/latest/meta-data/instance-id > /dev/null 2>&1; then
        log_info "检测到阿里云ECS，配置阿里云镜像源..."
        
        # 确保基础工具已安装（忽略警告）
        yum install -y wget curl 2>/dev/null || true
        
        # 检测系统类型并配置相应镜像源
        if grep -qi "alibaba" /etc/os-release 2>/dev/null; then
            log_info "检测到Alibaba Cloud Linux，使用专用镜像源..."
            # Alibaba Cloud Linux 通常已经配置了最优镜像源
        elif [ -f /etc/centos-release ] || grep -qi "centos\|rhel" /etc/os-release 2>/dev/null; then
            log_info "配置CentOS/RHEL阿里云镜像源..."
            wget -O /etc/yum.repos.d/CentOS-Base.repo https://mirrors.aliyun.com/repo/Centos-8.repo 2>/dev/null || true
        fi
        
        # 添加EPEL阿里云源（适用于大多数系统）
        log_info "配置EPEL阿里云镜像源..."
        yum install -y epel-release 2>/dev/null || true
        wget -O /etc/yum.repos.d/epel.repo https://mirrors.aliyun.com/repo/epel-8.repo 2>/dev/null || true
        
        # 清理缓存
        log_info "清理并更新包管理器缓存..."
        yum clean all >/dev/null 2>&1 || true
        
        # 兼容不同版本的makecache命令
        if yum makecache --help 2>&1 | grep -q "fast"; then
            yum makecache fast >/dev/null 2>&1 || yum makecache >/dev/null 2>&1 || true
        else
            yum makecache >/dev/null 2>&1 || true
        fi
        
        log_success "阿里云镜像源配置完成"
    else
        log_info "非阿里云环境，跳过镜像源配置"
    fi
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
    log_info "更新系统包..."
    yum update -y
    
    log_info "安装Java 17..."
    yum install -y java-17-openjdk java-17-openjdk-devel
    
    # 设置JAVA_HOME
    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
    echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk' >> /etc/profile
    echo 'export PATH=$JAVA_HOME/bin:$PATH' >> /etc/profile
    
    source /etc/profile
    
    log_success "Java 17 安装完成"
    java -version
}

# 2. 安装MongoDB - 多种策略
install_mongodb() {
    log_info "安装MongoDB..."
    
    # 检查是否已安装
    if systemctl is-active --quiet mongod 2>/dev/null; then
        log_success "MongoDB 已安装并运行"
        return 0
    fi
    
    # 策略1: 尝试EPEL仓库安装
    if install_mongodb_epel; then
        return 0
    fi
    
    # 策略2: 尝试修正的官方仓库
    if install_mongodb_official_fixed; then
        return 0
    fi
    
    # 策略3: 手动下载安装
    if install_mongodb_manual; then
        return 0
    fi
    
    log_error "所有MongoDB安装策略都失败了"
    exit 1
}

# 策略1: 使用EPEL仓库安装MongoDB
install_mongodb_epel() {
    log_info "尝试从EPEL仓库安装MongoDB..."
    
    # 安装EPEL仓库
    yum install -y epel-release
    
    # 尝试安装mongodb
    if yum install -y mongodb mongodb-server; then
        # 创建MongoDB数据目录
        mkdir -p /var/lib/mongodb
        chown mongodb:mongodb /var/lib/mongodb
        
        # 启动服务
        systemctl start mongod 2>/dev/null || systemctl start mongodb
        systemctl enable mongod 2>/dev/null || systemctl enable mongodb
        
        log_success "从EPEL仓库安装MongoDB成功"
        return 0
    else
        log_warning "EPEL仓库安装失败"
        return 1
    fi
}

# 策略2: 修正的官方仓库
install_mongodb_official_fixed() {
    log_info "尝试使用修正的官方仓库..."
    
    # 创建修正的MongoDB仓库文件
    cat > /etc/yum.repos.d/mongodb-org-5.0.repo << 'EOF'
[mongodb-org-5.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/5.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-5.0.asc
EOF
    
    # 清理缓存并尝试安装
    yum clean all
    if yum install -y mongodb-org; then
        systemctl start mongod
        systemctl enable mongod
        log_success "官方仓库安装MongoDB成功"
        return 0
    else
        log_warning "官方仓库安装失败"
        return 1
    fi
}

# 策略3: 手动下载安装
install_mongodb_manual() {
    log_info "尝试手动下载安装MongoDB..."
    
    # 创建MongoDB用户
    useradd -r -s /bin/false mongodb 2>/dev/null || true
    
    # 下载MongoDB二进制包
    cd /tmp
    
    # 尝试多个下载源
    log_info "尝试从多个镜像源下载MongoDB..."
    
    # 下载源列表（按速度优先级排序）
    download_sources=(
        "https://mirrors.aliyun.com/mongodb/linux/mongodb-linux-x86_64-rhel80-5.0.14.tgz"
        "https://mirrors.tuna.tsinghua.edu.cn/mongodb/linux/mongodb-linux-x86_64-rhel80-5.0.14.tgz"
        "https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel80-5.0.14.tgz"
    )
    
    download_success=false
    for source in "${download_sources[@]}"; do
        log_info "尝试从 $source 下载..."
        if curl -L --connect-timeout 30 --max-time 300 -o mongodb.tgz "$source"; then
            download_success=true
            log_success "从 $source 下载成功"
            break
        else
            log_warning "从 $source 下载失败，尝试下一个源..."
        fi
    done
    
    if [ "$download_success" = true ]; then
        tar -xzf mongodb.tgz
        
        # 安装到系统目录
        mkdir -p /opt/mongodb
        cp mongodb-linux-x86_64-rhel80-5.0.14/bin/* /opt/mongodb/
        
        # 创建符号链接
        ln -sf /opt/mongodb/mongod /usr/local/bin/mongod
        ln -sf /opt/mongodb/mongo /usr/local/bin/mongo
        ln -sf /opt/mongodb/mongosh /usr/local/bin/mongosh
        
        # 创建配置文件
        mkdir -p /etc/mongodb
        cat > /etc/mongodb/mongod.conf << 'EOF'
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
  
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
    
processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid
  
net:
  port: 27017
  bindIp: 127.0.0.1
EOF
        
        # 创建必要目录
        mkdir -p /var/lib/mongodb /var/log/mongodb /var/run/mongodb
        chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb /var/run/mongodb
        
        # 创建systemd服务文件
        cat > /etc/systemd/system/mongod.service << 'EOF'
[Unit]
Description=MongoDB Database Server
Documentation=https://docs.mongodb.org/manual
After=network.target

[Service]
User=mongodb
Group=mongodb
ExecStart=/usr/local/bin/mongod --config /etc/mongodb/mongod.conf
ExecReload=/bin/kill -HUP $MAINPID
PIDFile=/var/run/mongodb/mongod.pid
TimeoutStopSec=5
KillMode=mixed

[Install]
WantedBy=multi-user.target
EOF
        
        # 启动服务
        systemctl daemon-reload
        systemctl start mongod
        systemctl enable mongod
        
        log_success "手动安装MongoDB成功"
        return 0
    else
        log_warning "手动下载失败"
        return 1
    fi
}

# 3. 配置MongoDB
configure_mongodb() {
    log_info "配置MongoDB..."
    
    # 等待MongoDB启动
    sleep 10
    
    # 检测MongoDB命令
    MONGO_CMD=""
    if command -v mongosh &> /dev/null; then
        MONGO_CMD="mongosh"
    elif command -v mongo &> /dev/null; then
        MONGO_CMD="mongo"
    else
        log_error "找不到MongoDB命令行工具"
        return 1
    fi
    
    log_info "使用 $MONGO_CMD 配置数据库..."
    
    # 创建管理员用户
    $MONGO_CMD admin --eval "
        db.createUser({
            user: 'admin',
            pwd: '$MONGO_PASSWORD',
            roles: [{ role: 'userAdminAnyDatabase', db: 'admin' }]
        })
    " 2>/dev/null || log_warning "管理员用户可能已存在"
    
    # 创建应用数据库和用户
    $MONGO_CMD elderdiet --eval "
        db.createUser({
            user: 'elderdiet',
            pwd: '$MONGO_PASSWORD',
            roles: [{ role: 'readWrite', db: 'elderdiet' }]
        })
    " 2>/dev/null || log_warning "应用用户可能已存在"
    
    log_success "MongoDB 配置完成"
}

# 4. 安装和配置Maven
install_maven() {
    log_info "安装和配置Maven..."
    
    if command -v mvn &> /dev/null; then
        log_success "Maven 已安装"
    else
        log_info "安装Maven..."
        # 尝试从阿里云镜像安装
        yum install -y maven || {
            log_warning "系统仓库安装失败，尝试手动安装Maven..."
            install_maven_manual
        }
    fi
    
    # 配置Maven使用阿里云镜像源
    configure_maven_mirrors
    
    log_success "Maven 安装和配置完成"
}

# 手动安装Maven
install_maven_manual() {
    log_info "手动安装Maven..."
    
    cd /tmp
    
    # 下载Maven 3.8.6，显示进度
    log_info "从阿里云镜像下载Maven 3.8.6..."
    if curl -L --progress-bar -o apache-maven-3.8.6-bin.tar.gz "https://mirrors.aliyun.com/apache/maven/maven-3/3.8.6/binaries/apache-maven-3.8.6-bin.tar.gz"; then
        tar -xzf apache-maven-3.8.6-bin.tar.gz
        
        # 安装到系统目录
        mv apache-maven-3.8.6 /opt/maven
        
        # 创建符号链接
        ln -sf /opt/maven/bin/mvn /usr/local/bin/mvn
        
        # 设置环境变量
        echo 'export M2_HOME=/opt/maven' >> /etc/profile
        echo 'export PATH=$M2_HOME/bin:$PATH' >> /etc/profile
        
        source /etc/profile
        
        log_success "Maven 手动安装完成"
    else
        log_error "Maven 手动安装失败"
        exit 1
    fi
}

# 配置Maven镜像源
configure_maven_mirrors() {
    log_info "配置Maven阿里云镜像源..."
    
    # 创建Maven配置目录
    mkdir -p ~/.m2
    
    # 配置settings.xml使用阿里云镜像
    cat > ~/.m2/settings.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 
          http://maven.apache.org/xsd/settings-1.0.0.xsd">
  
  <mirrors>
    <!-- 阿里云Maven镜像源 -->
    <mirror>
      <id>aliyun-maven</id>
      <name>Aliyun Maven Mirror</name>
      <url>https://maven.aliyun.com/repository/public</url>
      <mirrorOf>central</mirrorOf>
    </mirror>
    
    <!-- 华为云Maven镜像源 -->
    <mirror>
      <id>huawei-maven</id>
      <name>Huawei Maven Mirror</name>
      <url>https://mirrors.huaweicloud.com/repository/maven/</url>
      <mirrorOf>central</mirrorOf>
    </mirror>
    
    <!-- 腾讯云Maven镜像源 -->
    <mirror>
      <id>tencent-maven</id>
      <name>Tencent Maven Mirror</name>
      <url>https://mirrors.cloud.tencent.com/nexus/repository/maven-public/</url>
      <mirrorOf>central</mirrorOf>
    </mirror>
  </mirrors>
  
  <profiles>
    <profile>
      <id>aliyun</id>
      <repositories>
        <repository>
          <id>aliyun-maven</id>
          <url>https://maven.aliyun.com/repository/public</url>
          <releases><enabled>true</enabled></releases>
          <snapshots><enabled>true</enabled></snapshots>
        </repository>
      </repositories>
      <pluginRepositories>
        <pluginRepository>
          <id>aliyun-maven</id>
          <url>https://maven.aliyun.com/repository/public</url>
          <releases><enabled>true</enabled></releases>
          <snapshots><enabled>true</enabled></snapshots>
        </pluginRepository>
      </pluginRepositories>
    </profile>
  </profiles>
  
  <activeProfiles>
    <activeProfile>aliyun</activeProfile>
  </activeProfiles>
  
</settings>
EOF
    
    log_success "Maven镜像源配置完成"
}

# 5. 构建Spring Boot应用
build_application() {
    log_info "构建Spring Boot应用..."
    
    cd elderdiet-backend-java
    
    # 检查是否已有构建结果
    if [ -f target/elderdiet-backend-java-*.jar ]; then
        log_info "发现已构建的JAR文件，跳过构建"
        cd ..
        return 0
    fi
    
    log_info "使用Maven构建应用（使用阿里云镜像源和并行构建）..."
    
    # 显示构建配置信息
    log_info "Maven构建优化配置："
    log_info "  - 使用阿里云镜像源"
    log_info "  - 并行构建 (线程数: $(nproc))"
    log_info "  - 本地仓库: /tmp/.m2/repository"
    log_info "  - 跳过测试以加快构建"
    
    # 使用阿里云镜像源构建，并行构建，显示进度
    mvn clean package -DskipTests \
        -Dmaven.repo.local=/tmp/.m2/repository \
        -T $(nproc)C \
        --batch-mode \
        --show-version \
        -Dmaven.compile.fork=true \
        -Dmaven.javadoc.skip=true \
        -Dspring-boot.repackage.skip=false || {
        
        log_error "Maven构建失败，尝试故障排除..."
        log_info "检查Maven配置..."
        mvn -version
        
        log_info "尝试清理并重新构建（单线程模式）..."
        mvn clean -q
        
        log_info "重新构建（详细日志）..."
        mvn package -DskipTests \
            -Dmaven.repo.local=/tmp/.m2/repository \
            --batch-mode \
            -X
    }
    
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

Environment=SPRING_PROFILES_ACTIVE=$SPRING_PROFILES_ACTIVE
Environment=MONGODB_URI=mongodb://elderdiet:$MONGO_PASSWORD@localhost:27017/elderdiet
Environment=JWT_SECRET=$JWT_SECRET
Environment=JWT_EXPIRES_IN=$JWT_EXPIRES_IN
Environment=SERVER_PORT=$SERVER_PORT

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
    log_info "检查服务状态..."
    systemctl status elderdiet
    log_info "检查应用日志..."
    journalctl -u elderdiet --no-pager -n 20
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
    curl -s http://localhost:3001/actuator/health 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "健康检查API暂时不可用"
}

# 主执行流程
main() {
    log_info "开始离线部署ElderDiet（修复版）..."
    
    load_environment
    configure_system_repos
    install_java
    install_maven
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