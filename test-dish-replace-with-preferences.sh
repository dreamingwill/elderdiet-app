#!/bin/bash

# 测试菜品更换功能（带偏好）

# 配置
BASE_URL="http://localhost:8080/api/v1"
CONTENT_TYPE="Content-Type: application/json"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== 菜品更换功能测试（带偏好） ===${NC}"

# 检查参数
if [ $# -lt 3 ]; then
    echo -e "${RED}使用方法: $0 <token> <meal_plan_id> <dish_index> [meal_type]${NC}"
    echo "meal_type 默认为 BREAKFAST"
    exit 1
fi

TOKEN="$1"
MEAL_PLAN_ID="$2"
DISH_INDEX="$3"
MEAL_TYPE="${4:-BREAKFAST}"

echo "Token: ${TOKEN:0:20}..."
echo "Meal Plan ID: $MEAL_PLAN_ID"
echo "Dish Index: $DISH_INDEX"
echo "Meal Type: $MEAL_TYPE"
echo

# 测试1：不带偏好的更换
echo -e "${YELLOW}测试1: 不带偏好的菜品更换${NC}"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X PUT "$BASE_URL/meal-plans/replace-dish" \
  -H "Authorization: Bearer $TOKEN" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"mealPlanId\": \"$MEAL_PLAN_ID\",
    \"mealType\": \"$MEAL_TYPE\",
    \"dishIndex\": $DISH_INDEX
  }")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 测试1通过 (HTTP $HTTP_CODE)${NC}"
    echo "响应: $(echo "$BODY" | jq -r '.message // "成功"')"
else
    echo -e "${RED}❌ 测试1失败 (HTTP $HTTP_CODE)${NC}"
    echo "错误: $(echo "$BODY" | jq -r '.message // .error // "未知错误"')"
fi
echo

# 等待2秒
sleep 2

# 测试2：带偏好的更换
echo -e "${YELLOW}测试2: 带偏好的菜品更换${NC}"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X PUT "$BASE_URL/meal-plans/replace-dish" \
  -H "Authorization: Bearer $TOKEN" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"mealPlanId\": \"$MEAL_PLAN_ID\",
    \"mealType\": \"$MEAL_TYPE\",
    \"dishIndex\": $DISH_INDEX,
    \"preferredIngredient\": \"鸡肉,胡萝卜\",
    \"avoidIngredient\": \"辛辣,油腻\",
    \"specialRequirement\": \"清淡易消化\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 测试2通过 (HTTP $HTTP_CODE)${NC}"
    echo "响应: $(echo "$BODY" | jq -r '.message // "成功"')"
    
    # 显示新菜品信息
    NEW_DISH_NAME=$(echo "$BODY" | jq -r ".data.${MEAL_TYPE,,}.dishes[$DISH_INDEX].name // \"未知\"")
    echo "新菜品: $NEW_DISH_NAME"
else
    echo -e "${RED}❌ 测试2失败 (HTTP $HTTP_CODE)${NC}"
    echo "错误: $(echo "$BODY" | jq -r '.message // .error // "未知错误"')"
fi
echo

# 测试3：验证用户档案是否更新了偏好
echo -e "${YELLOW}测试3: 检查用户档案偏好更新${NC}"
PROFILE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X GET "$BASE_URL/profile" \
  -H "Authorization: Bearer $TOKEN")

PROFILE_HTTP_CODE=$(echo "$PROFILE_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
PROFILE_BODY=$(echo "$PROFILE_RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$PROFILE_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 获取用户档案成功${NC}"
    
    # 检查饮食偏好
    PREFERENCES=$(echo "$PROFILE_BODY" | jq -r '.data.dietary_preferences // []' | jq -r '.[]' 2>/dev/null)
    if [ -n "$PREFERENCES" ]; then
        echo "当前饮食偏好:"
        echo "$PREFERENCES" | while read -r pref; do
            echo "  - $pref"
        done
    else
        echo "暂无饮食偏好记录"
    fi
else
    echo -e "${RED}❌ 获取用户档案失败 (HTTP $PROFILE_HTTP_CODE)${NC}"
    echo "错误: $(echo "$PROFILE_BODY" | jq -r '.message // .error // "未知错误"')"
fi

echo
echo -e "${YELLOW}=== 测试完成 ===${NC}" 