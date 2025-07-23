#!/bin/bash

# 测试设备注册接口
echo "🧪 测试设备注册接口..."

# 后端URL
BACKEND_URL="http://8.153.204.247:3001/api/v1"

# 测试用的认证token（需要先登录获取）
echo "📋 请先登录获取认证token..."

# 登录获取token
LOGIN_RESPONSE=$(curl -s -X POST \
  "${BACKEND_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "password123"
  }')

echo "登录响应: $LOGIN_RESPONSE"

# 从响应中提取token（需要根据实际响应格式调整）
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ 登录失败，无法获取token"
  echo "请检查用户名密码是否正确，或手动设置TOKEN变量"
  echo "例如: TOKEN='your-jwt-token-here' ./test-device-registration.sh"
  exit 1
fi

echo "✅ 获取到认证token: ${TOKEN:0:20}..."

# 测试设备注册
echo ""
echo "📱 测试设备注册..."

DEVICE_REQUEST='{
  "deviceToken": "test_simple_push_android_abc123",
  "platform": "ANDROID",
  "deviceModel": "Test Device Model",
  "appVersion": "1.0.0",
  "pushEnabled": true,
  "mealRecordPushEnabled": true,
  "reminderPushEnabled": true
}'

echo "发送的设备注册请求:"
echo "$DEVICE_REQUEST" | jq .

DEVICE_RESPONSE=$(curl -s -X POST \
  "${BACKEND_URL}/devices/register" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$DEVICE_REQUEST" \
  -w "\nHTTP_CODE:%{http_code}")

# 分离响应体和HTTP状态码
HTTP_CODE=$(echo "$DEVICE_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$DEVICE_RESPONSE" | sed '/HTTP_CODE:/d')

echo ""
echo "HTTP状态码: $HTTP_CODE"
echo "响应体:"
echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ 设备注册成功"
else
  echo "❌ 设备注册失败"
fi

echo ""
echo "🔍 查看后端日志以获取更多信息" 