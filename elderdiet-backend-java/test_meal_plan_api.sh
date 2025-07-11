#!/bin/bash

# API基础URL
BASE_URL="http://localhost:3001/api"

# 登录信息
PHONE="13800138000"
PASSWORD="123456"

# 函数：打印彩色标题
print_header() {
    echo -e "\n\e[1;34m===== $1 =====\e[0m"
}

# 函数：检查jq命令是否存在
check_jq() {
    if ! command -v jq &> /dev/null
    then
        echo -e "\e[1;31m错误: 'jq' 命令未找到. 请先安装 jq (e.g., brew install jq) 再运行此脚本.\e[0m"
        exit 1
    fi
}

# 检查jq
check_jq

# --- 1. 用户登录 ---
print_header "1. 用户登录"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/login" \
-H "Content-Type: application/json" \
-d '{
  "phone": "'$PHONE'",
  "password": "'$PASSWORD'"
}')

# 提取JWT
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo -e "\e[1;31m登录失败，请检查手机号或密码。响应如下：\e[0m"
    echo $LOGIN_RESPONSE | jq
    exit 1
fi

echo -e "\e[32m登录成功！\e[0m"
# echo "Token: $TOKEN"

# --- 2. 一键生成今日膳食计划 ---
print_header "2. 一键生成今日膳食计划"
GENERATE_RESPONSE=$(curl -s -X POST "$BASE_URL/meal-plans/generate-today" \
-H "Authorization: Bearer $TOKEN")

echo $GENERATE_RESPONSE | jq
PLAN_ID=$(echo $GENERATE_RESPONSE | jq -r '.data.id')

if [ -z "$PLAN_ID" ] || [ "$PLAN_ID" == "null" ]; then
    echo -e "\e[1;31m生成膳食计划失败。脚本终止。\e[0m"
    exit 1
fi

echo -e "\e[32m今日膳食计划生成成功！ID: $PLAN_ID\e[0m"

# --- 3. 切换喜欢状态 (第一次，设为喜欢) ---
print_header "3. 切换喜欢状态 (设置为 '喜欢')"
TOGGLE_RESPONSE_1=$(curl -s -X PUT "$BASE_URL/meal-plans/$PLAN_ID/toggle-like" \
-H "Authorization: Bearer $TOKEN")

echo $TOGGLE_RESPONSE_1 | jq
LIKED_STATUS_1=$(echo $TOGGLE_RESPONSE_1 | jq -r '.data.liked')
echo -e "\e[32m切换后喜欢状态: $LIKED_STATUS_1\e[0m"

# --- 4. 切换喜欢状态 (第二次，取消喜欢) ---
print_header "4. 切换喜欢状态 (设置为 '不喜欢')"
TOGGLE_RESPONSE_2=$(curl -s -X PUT "$BASE_URL/meal-plans/$PLAN_ID/toggle-like" \
-H "Authorization: Bearer $TOKEN")

echo $TOGGLE_RESPONSE_2 | jq
LIKED_STATUS_2=$(echo $TOGGLE_RESPONSE_2 | jq -r '.data.liked')
echo -e "\e[32m切换后喜欢状态: $LIKED_STATUS_2\e[0m"

# --- 5. 设置喜欢状态 ---
print_header "5. 直接设置喜欢状态为 '喜欢'"
SET_LIKE_RESPONSE=$(curl -s -X PUT "$BASE_URL/meal-plans/like" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "meal_plan_id": "'$PLAN_ID'",
  "liked": true
}')

echo $SET_LIKE_RESPONSE | jq
LIKED_STATUS_3=$(echo $SET_LIKE_RESPONSE | jq -r '.data.liked')
echo -e "\e[32m设置后喜欢状态: $LIKED_STATUS_3\e[0m"

# --- 6. 获取所有喜欢的计划 ---
print_header "6. 获取所有喜欢的计划"
LIKED_PLANS_RESPONSE=$(curl -s -X GET "$BASE_URL/meal-plans/liked" \
-H "Authorization: Bearer $TOKEN")

echo $LIKED_PLANS_RESPONSE | jq
echo -e "\e[32m获取喜欢的膳食计划成功！\e[0m"

# --- 7. 获取统计信息 ---
print_header "7. 获取膳食计划统计信息"
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/meal-plans/stats" \
-H "Authorization: Bearer $TOKEN")

echo $STATS_RESPONSE | jq
echo -e "\e[32m获取统计信息成功！\e[0m"

print_header "测试完成！" 