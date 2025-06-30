#!/bin/bash

echo "🚀 Starting ElderDiet Docker Deployment..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# 检查Docker Compose命令
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# 停止现有容器
echo "🛑 Stopping existing containers..."
$COMPOSE_CMD -f docker-compose.prod.yml down

# 清理旧镜像（可选）
echo "🧹 Cleaning up old images..."
docker system prune -f

# 构建并启动服务
echo "🔨 Building and starting services..."
$COMPOSE_CMD -f docker-compose.prod.yml up -d --build

# 检查服务状态
echo "⏳ Waiting for services to start..."
sleep 10

echo "📊 Service Status:"
$COMPOSE_CMD -f docker-compose.prod.yml ps

echo "✅ Deployment completed!"
echo "🌐 Backend API: http://localhost:3001"
echo "🗄️  MongoDB: http://localhost:27017"
echo ""
echo "📝 To view logs:"
echo "   $COMPOSE_CMD -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 To stop services:"
echo "   $COMPOSE_CMD -f docker-compose.prod.yml down" 