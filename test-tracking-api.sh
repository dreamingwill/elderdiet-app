#!/bin/bash

# 用户追踪API测试脚本
API_BASE="https://api06.dxdu.cn"

echo "=== 用户追踪API测试 ==="

# 测试登录获取token (需要替换为实际的用户凭据)
echo "1. 测试登录获取token..."
LOGIN_RESPONSE=$(curl -s -X POST \
  "${API_BASE}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "password": "test123456"
  }')

echo "登录响应: $LOGIN_RESPONSE"

# 从响应中提取token (这里需要根据实际的响应格式调整)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 无法获取token，请检查登录凭据"
  exit 1
fi

echo "✅ 获取到token: ${TOKEN:0:20}..."

# 测试开始会话
echo -e "\n2. 测试开始会话..."
SESSION_RESPONSE=$(curl -s -X POST \
  "${API_BASE}/api/tracking/session/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "deviceType": "android",
    "deviceModel": "test-device",
    "osVersion": "12.0",
    "appVersion": "1.0.0",
    "userAgent": "TestAgent/1.0"
  }')

echo "会话开始响应: $SESSION_RESPONSE"

# 提取sessionId
SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
  echo "❌ 无法获取sessionId"
else
  echo "✅ 获取到sessionId: $SESSION_ID"
fi

# 测试事件追踪
echo -e "\n3. 测试事件追踪..."
EVENT_RESPONSE=$(curl -s -X POST \
  "${API_BASE}/api/tracking/event" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "eventType": "FEATURE_USE",
    "eventName": "test_api_call",
    "eventData": {
      "test": true,
      "timestamp": '$(date +%s)'
    },
    "result": "success",
    "deviceType": "android",
    "sessionId": "'$SESSION_ID'"
  }')

echo "事件追踪响应: $EVENT_RESPONSE"

# 测试页面访问开始
echo -e "\n4. 测试页面访问开始..."
PAGE_START_RESPONSE=$(curl -s -X POST \
  "${API_BASE}/api/tracking/page/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "pageName": "test-page",
    "pageTitle": "测试页面",
    "route": "/test",
    "deviceType": "android",
    "sessionId": "'$SESSION_ID'"
  }')

echo "页面访问开始响应: $PAGE_START_RESPONSE"

# 等待2秒
echo -e "\n等待2秒..."
sleep 2

# 测试页面访问结束
echo -e "\n5. 测试页面访问结束..."
PAGE_END_RESPONSE=$(curl -s -X POST \
  "${API_BASE}/api/tracking/page/end" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "pageName": "test-page",
    "exitReason": "test_complete"
  }')

echo "页面访问结束响应: $PAGE_END_RESPONSE"

# 测试Tab切换
echo -e "\n6. 测试Tab切换..."
TAB_RESPONSE=$(curl -s -X POST \
  "${API_BASE}/api/tracking/event/tab-switch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "targetTab": "profile",
    "previousTab": "test-page",
    "sessionId": "'$SESSION_ID'",
    "deviceType": "android"
  }')

echo "Tab切换响应: $TAB_RESPONSE"

# 测试批量事件
echo -e "\n7. 测试批量事件..."
BATCH_RESPONSE=$(curl -s -X POST \
  "${API_BASE}/api/tracking/events/batch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "events": [
      {
        "eventType": "INTERACTION",
        "eventName": "button_click",
        "eventData": {"button": "test1"}
      },
      {
        "eventType": "INTERACTION", 
        "eventName": "button_click",
        "eventData": {"button": "test2"}
      }
    ],
    "sessionId": "'$SESSION_ID'",
    "deviceType": "android"
  }')

echo "批量事件响应: $BATCH_RESPONSE"

# 测试获取当前会话
echo -e "\n8. 测试获取当前会话..."
CURRENT_SESSION_RESPONSE=$(curl -s -X GET \
  "${API_BASE}/api/tracking/session/current" \
  -H "Authorization: Bearer $TOKEN")

echo "当前会话响应: $CURRENT_SESSION_RESPONSE"

# 测试结束会话
if [ ! -z "$SESSION_ID" ]; then
  echo -e "\n9. 测试结束会话..."
  END_SESSION_RESPONSE=$(curl -s -X POST \
    "${API_BASE}/api/tracking/session/end" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "sessionId": "'$SESSION_ID'",
      "reason": "test_complete"
    }')

  echo "结束会话响应: $END_SESSION_RESPONSE"
fi

echo -e "\n=== 测试完成 ===" 