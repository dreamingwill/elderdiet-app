#!/bin/bash

# 测试聊天API脚本

BASE_URL="http://localhost:3001"
JWT_TOKEN="your-jwt-token-here"

echo "============================================"
echo "聊天API测试脚本"
echo "============================================"

echo "请先设置你的JWT Token："
echo "export JWT_TOKEN='your-actual-jwt-token'"
echo ""

if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" = "your-jwt-token-here" ]; then
    echo "错误：请先设置JWT_TOKEN环境变量"
    echo "使用方法: export JWT_TOKEN='你的实际token'"
    exit 1
fi

echo "使用Token: ${JWT_TOKEN:0:20}..."
echo ""

# 测试1: 发送文本消息
echo "测试1: 发送文本消息"
echo "----------------------------------------"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "type": "text",
    "content": "这是个test",
    "imageUrls": null
  }' | jq '.'

echo -e "\n\n"

# 测试2: 发送图片消息
echo "测试2: 发送图片消息"
echo "----------------------------------------"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "type": "image",
    "content": "图片中是什么",
    "imageUrls": ["https://elder-diet.oss-cn-shanghai.aliyuncs.com/%E6%88%AA%E5%B1%8F2025-07-08%2023.54.10.png"]
  }' | jq '.'

echo -e "\n\n"

# 测试3: 发送多图片消息
echo "测试3: 发送多图片消息"
echo "----------------------------------------"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "type": "image",
    "content": "请分析这些图片",
    "imageUrls": [
      "https://elder-diet.oss-cn-shanghai.aliyuncs.com/%E6%88%AA%E5%B1%8F2025-07-08%2023.54.10.png",
      "https://example.com/image2.jpg"
    ]
  }' | jq '.'

echo -e "\n\n"

# 测试4: 获取聊天历史
echo "测试4: 获取聊天历史"
echo "----------------------------------------"
curl -X GET "$BASE_URL/api/v1/chat/history" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'

echo -e "\n\n"

# 测试5: 测试错误情况 - 空文本消息
echo "测试5: 测试错误情况 - 空文本消息"
echo "----------------------------------------"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "type": "text",
    "content": "",
    "imageUrls": null
  }' | jq '.'

echo -e "\n\n"

# 测试6: 测试错误情况 - 空图片URL
echo "测试6: 测试错误情况 - 空图片URL"
echo "----------------------------------------"
curl -X POST "$BASE_URL/api/v1/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "type": "image",
    "content": "图片中是什么",
    "imageUrls": []
  }' | jq '.'

echo -e "\n\n"

echo "测试完成！" 