#!/bin/bash

# ElderDiet 快速部署脚本
# 使用预构建镜像，避免网络问题
# 使用方法: ./deploy-quick.sh

set -e

echo "⚡ ElderDiet 快速部署脚本"
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

# 加载环境变量
load_env() {
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

# 停止旧版服务
stop_services() {
    log_info "停止旧版服务..."
    docker-compose -f docker-compose.prod.yml down > /dev/null 2>&1 || true
    log_success "服务停止完成"
}

# 拉取基础镜像
pull_images() {
    log_info "拉取基础镜像..."
    
    # 尝试拉取MongoDB镜像
    if ! docker pull mongo:5.0 > /dev/null 2>&1; then
        log_error "无法拉取MongoDB镜像，尝试使用国内镜像..."
        docker pull registry.cn-hangzhou.aliyuncs.com/library/mongo:5.0 || {
            log_error "镜像拉取失败，请检查网络连接"
            exit 1
        }
        docker tag registry.cn-hangzhou.aliyuncs.com/library/mongo:5.0 mongo:5.0
    fi
    
    log_success "基础镜像拉取完成"
}

# 手动构建后端镜像
build_backend() {
    log_info "构建后端应用..."
    
    cd elderdiet-backend-java
    
    # 使用Maven构建
    if ! mvn clean package -DskipTests -q > /dev/null 2>&1; then
        log_error "Maven构建失败"
        exit 1
    fi
    
    # 创建简化的Dockerfile
    cat > Dockerfile.quick << 'EOF'
FROM openjdk:17-jre-slim
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY target/*.jar app.jar
ENV JAVA_OPTS="-Xms256m -Xmx768m -XX:+UseG1GC"
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/actuator/health || exit 1
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
EOF
    
    # 构建镜像
    docker build -f Dockerfile.quick -t elderdiet-backend:latest . || {
        log_error "后端镜像构建失败"
        exit 1
    }
    
    rm -f Dockerfile.quick
    cd ..
    
    log_success "后端应用构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 创建简化版docker-compose文件
    cat > docker-compose.quick.yml << EOF
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: elderdiet-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: \${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: elderdiet
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    deploy:
      resources:
        limits:
          memory: \${MONGO_MEMORY_LIMIT:-512m}
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  backend:
    image: elderdiet-backend:latest
    container_name: elderdiet-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      SPRING_PROFILES_ACTIVE: \${SPRING_PROFILES_ACTIVE}
      MONGODB_URI: \${MONGODB_URI}
      JWT_SECRET: \${JWT_SECRET}
      JWT_EXPIRES_IN: \${JWT_EXPIRES_IN}
      SERVER_PORT: \${SERVER_PORT}
    depends_on:
      mongodb:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: \${BACKEND_MEMORY_LIMIT:-768m}

volumes:
  mongodb_data:
    driver: local
EOF
    
    # 启动服务
    docker-compose -f docker-compose.quick.yml up -d
    
    log_success "服务启动完成"
}

# 等待服务就绪
wait_services() {
    log_info "等待服务就绪..."
    
    # 等待后端服务
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3001/actuator/health > /dev/null 2>&1; then
            log_success "后端服务已就绪"
            break
        fi
        sleep 5
        timeout=$((timeout-5))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "服务启动超时"
        docker-compose -f docker-compose.quick.yml logs
        exit 1
    fi
}

# 显示结果
show_result() {
    echo ""
    echo "🎉 快速部署完成！"
    echo "=================="
    echo "📱 访问地址: http://8.153.204.247:3001"
    echo "🔍 健康检查: http://8.153.204.247:3001/actuator/health"
    echo ""
    echo "📊 服务状态:"
    docker-compose -f docker-compose.quick.yml ps
    echo ""
    echo "📝 管理命令:"
    echo "   查看日志: docker-compose -f docker-compose.quick.yml logs -f"
    echo "   停止服务: docker-compose -f docker-compose.quick.yml down"
}

# 主流程
main() {
    load_env
    stop_services
    pull_images
    build_backend
    start_services
    wait_services
    show_result
    
    log_success "🚀 ElderDiet 快速部署成功！"
}

# 错误处理
trap 'log_error "部署失败，请检查日志"; exit 1' ERR

# 执行
main "$@" 