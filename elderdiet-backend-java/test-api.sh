#!/bin/bash

# ElderDiet Java Backend API 测试脚本

API_BASE="http://localhost:3001/api/v1"

echo "🔄 开始测试 ElderDiet Java Backend API..."
echo

# 测试健康检查
echo "1. 测试健康检查 API"
curl -s -X GET "$API_BASE/health" | jq '.'
echo
echo "---"

# 测试用户注册
echo "2. 测试用户注册 API"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "123456",
    "role": "elder"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# 提取 token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token // empty')
echo "提取到的 Token: $TOKEN"
echo
echo "---"

# 测试重复注册（应该失败）
echo "3. 测试重复注册（期望失败）"
curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "123456",
    "role": "elder"
  }' | jq '.'
echo
echo "---"

# 测试用户登录
echo "4. 测试用户登录 API"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "123456"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# 如果注册失败但登录成功，更新 token
if [ -z "$TOKEN" ]; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')
  echo "从登录响应中提取到的 Token: $TOKEN"
fi
echo
echo "---"

# 测试错误登录
echo "5. 测试错误登录（期望失败）"
curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "wrongpassword"
  }' | jq '.'
echo
echo "---"

# 测试获取用户信息（需要认证）
if [ -n "$TOKEN" ]; then
  echo "6. 测试获取用户信息 API（需要认证）"
  curl -s -X GET "$API_BASE/auth/me" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo
  echo "---"
else
  echo "6. 跳过获取用户信息测试（没有有效的 token）"
  echo "---"
fi

# 测试退出登录
if [ -n "$TOKEN" ]; then
  echo "7. 测试用户退出登录 API"
  curl -s -X POST "$API_BASE/auth/logout" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo
  echo "---"
else
  echo "7. 跳过退出登录测试（没有有效的 token）"
  echo "---"
fi

# 测试参数验证
echo "8. 测试参数验证（期望失败）"
curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "invalid-phone",
    "password": "123",
    "role": "invalid-role"
  }' | jq '.'
echo

echo "✅ API 测试完成！" 