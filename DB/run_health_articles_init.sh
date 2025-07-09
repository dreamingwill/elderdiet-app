#!/bin/bash

# MongoDB养生文章集合初始化脚本
# 执行health_articles_init.js来创建集合和插入示例数据

echo "🚀 开始初始化MongoDB养生文章集合..."

# 检查MongoDB是否运行
if ! pgrep -x "mongod" > /dev/null; then
    echo "❌ MongoDB未运行，请先启动MongoDB服务"
    echo "💡 提示: 可以使用 'brew services start mongodb-community' 启动"
    exit 1
fi

# 执行初始化脚本
echo "📝 执行初始化脚本..."
mongosh --file DB/health_articles_init.js

if [ $? -eq 0 ]; then
    echo "✅ 养生文章集合初始化成功！"
    echo ""
    echo "📊 可以运行以下命令验证数据:"
    echo "   mongosh elderdiet --eval 'db.health_articles.find().pretty()'"
    echo "   mongosh elderdiet --eval 'db.health_articles.countDocuments()'"
else
    echo "❌ 初始化失败，请检查MongoDB连接和脚本语法"
fi 