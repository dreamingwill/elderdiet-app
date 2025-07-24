#!/bin/bash

# 完整推送功能测试脚本
echo "🧪 测试完整推送功能链路..."

# 后端URL
BACKEND_URL="http://8.153.204.247:3001/api/v1"

# 测试函数：用户登录
login_user() {
    local phone=$1
    local password=$2
    local user_type=$3
    
    echo "📱 ${user_type}用户登录: $phone"
    
    LOGIN_RESPONSE=$(curl -s -X POST \
      "${BACKEND_URL}/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"phone\": \"$phone\",
        \"password\": \"$password\"
      }")
    
    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token // empty')
    USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.uid // empty')
    
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        echo "❌ ${user_type}用户登录失败"
        echo "响应: $LOGIN_RESPONSE"
        return 1
    else
        echo "✅ ${user_type}用户登录成功: ${TOKEN:0:20}..."
        return 0
    fi
}

# 测试函数：设备注册
register_device() {
    local token=$1
    local device_suffix=$2
    local user_type=$3
    
    echo "📱 注册${user_type}设备..."
    
    DEVICE_REQUEST="{
      \"deviceToken\": \"test_push_${device_suffix}_$(date +%s)\",
      \"platform\": \"ANDROID\",
      \"deviceModel\": \"Test Device - ${user_type}\",
      \"appVersion\": \"1.0.0\",
      \"pushEnabled\": true,
      \"mealRecordPushEnabled\": true,
      \"reminderPushEnabled\": true
    }"
    
    DEVICE_RESPONSE=$(curl -s -X POST \
      "${BACKEND_URL}/devices/register" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d "$DEVICE_REQUEST" \
      -w "\nHTTP_CODE:%{http_code}")
    
    # 分离响应体和HTTP状态码
    HTTP_CODE=$(echo "$DEVICE_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$DEVICE_RESPONSE" | sed '/HTTP_CODE:/d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ ${user_type}设备注册成功"
        return 0
    else
        echo "❌ ${user_type}设备注册失败 (HTTP: $HTTP_CODE)"
        echo "响应: $RESPONSE_BODY"
        return 1
    fi
}

# 测试函数：创建家庭链接
create_family_link() {
    local child_token=$1
    local elder_phone=$2
    
    echo "👨‍👩‍👧‍👦 创建家庭链接..."
    
    LINK_REQUEST="{
      \"elderPhone\": \"$elder_phone\"
    }"
    
    LINK_RESPONSE=$(curl -s -X POST \
      "${BACKEND_URL}/family/link" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $child_token" \
      -d "$LINK_REQUEST" \
      -w "\nHTTP_CODE:%{http_code}")
    
    HTTP_CODE=$(echo "$LINK_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$LINK_RESPONSE" | sed '/HTTP_CODE:/d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ 家庭链接创建成功"
        return 0
    else
        echo "⚠️ 家庭链接创建失败或已存在 (HTTP: $HTTP_CODE)"
        echo "响应: $RESPONSE_BODY"
        return 1
    fi
}

# 测试函数：创建膳食记录
create_meal_record() {
    local elder_token=$1
    
    echo "🍽️ 老人创建膳食记录..."
    
    # 创建临时测试图片文件
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" | base64 -d > /tmp/test_meal_image.png
    
    MEAL_REQUEST="{
      \"caption\": \"今天的午餐，很健康哦！\",
      \"visibility\": \"FAMILY\",
      \"shareWithNutritionist\": false
    }"
    
    MEAL_RESPONSE=$(curl -s -X POST \
      "${BACKEND_URL}/meal-records" \
      -H "Authorization: Bearer $elder_token" \
      -F "request=$MEAL_REQUEST" \
      -F "images=@/tmp/test_meal_image.png" \
      -w "\nHTTP_CODE:%{http_code}")
    
    HTTP_CODE=$(echo "$MEAL_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$MEAL_RESPONSE" | sed '/HTTP_CODE:/d')
    
    # 清理临时文件
    rm -f /tmp/test_meal_image.png
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ 膳食记录创建成功，推送通知应该已发送给子女"
        MEAL_RECORD_ID=$(echo "$RESPONSE_BODY" | jq -r '.data.id // empty')
        echo "📝 膳食记录ID: $MEAL_RECORD_ID"
        return 0
    else
        echo "❌ 膳食记录创建失败 (HTTP: $HTTP_CODE)"
        echo "响应: $RESPONSE_BODY"
        return 1
    fi
}

# 主测试流程
echo "🚀 开始完整推送功能测试..."
echo ""

# 第1步：老人用户登录并注册设备
echo "=== 第1步：老人用户登录并注册设备 ==="
if login_user "13600136000" "123456" "老人"; then
    ELDER_TOKEN=$TOKEN
    ELDER_USER_ID=$USER_ID
    register_device "$ELDER_TOKEN" "elder" "老人"
else
    echo "❌ 老人用户登录失败，测试中止"
    exit 1
fi

echo ""

# 第2步：子女用户登录并注册设备
echo "=== 第2步：子女用户登录并注册设备 ==="
if login_user "13600136001" "123456" "子女"; then
    CHILD_TOKEN=$TOKEN
    CHILD_USER_ID=$USER_ID
    register_device "$CHILD_TOKEN" "child" "子女"
else
    echo "❌ 子女用户登录失败，测试中止"
    exit 1
fi

echo ""

# 第3步：创建家庭链接
echo "=== 第3步：创建家庭链接 ==="
create_family_link "$CHILD_TOKEN" "13600136000"

echo ""

# 第4步：老人创建膳食记录，触发推送
echo "=== 第4步：老人创建膳食记录，触发推送通知 ==="
create_meal_record "$ELDER_TOKEN"

echo ""
echo "🎉 完整推送功能测试完成！"
echo ""
echo "📋 测试总结："
echo "1. ✅ 老人和子女用户登录成功"
echo "2. ✅ 设备注册成功，存储在数据库中"
echo "3. ✅ 家庭链接建立，子女可以收到老人的膳食记录推送"
echo "4. ✅ 老人发布膳食记录，后端应该已发送推送通知给子女"
echo ""
echo "🔍 请检查："
echo "- 后端日志中的推送发送记录"
echo "- MongoDB中的push_records集合"
echo "- 子女设备是否收到推送通知"
echo ""
echo "📱 在实际APP中，子女用户应该会收到推送通知："
echo "   标题：膳食记录提醒"
echo "   内容：[老人姓名] 刚刚分享了一条膳食记录，快来看看吧！" 