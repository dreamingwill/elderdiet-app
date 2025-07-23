#!/bin/bash

# 极光推送测试脚本

echo "🚀 开始测试极光推送功能..."

# 检查环境变量
echo "📋 检查环境变量..."
if [ -z "$JPUSH_APP_KEY" ]; then
    echo "❌ JPUSH_APP_KEY 未设置"
    exit 1
fi

if [ -z "$JPUSH_MASTER_SECRET" ]; then
    echo "❌ JPUSH_MASTER_SECRET 未设置"
    exit 1
fi

echo "✅ 环境变量配置正确"
echo "   AppKey: ${JPUSH_APP_KEY:0:10}..."
echo "   Environment: ${JPUSH_ENVIRONMENT:-dev}"

# 检查后端服务状态
echo "📡 检查后端服务..."
BACKEND_URL="http://localhost:3001"
if curl -s "$BACKEND_URL/actuator/health" > /dev/null; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务未运行或无法访问"
    exit 1
fi

# 检查推送服务状态
echo "📱 检查推送服务状态..."
if curl -s "$BACKEND_URL/api/v1/push/status" > /dev/null; then
    echo "✅ 推送服务可访问"
else
    echo "❌ 推送服务无法访问"
fi

echo ""
echo "🎯 测试步骤："
echo "1. 确保使用独立APK（不是Expo Go）"
echo "2. 登录应用并授权推送权限"
echo "3. 进入'设置 > 推送测试'页面"
echo "4. 点击测试按钮验证推送功能"
echo ""
echo "📱 如果收到推送通知，说明配置成功！"
