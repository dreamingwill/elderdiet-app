#!/bin/bash

# 测试分页API的脚本
BASE_URL="http://localhost:8080/api/v1"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== 测试家庭分享墙分页功能 ===${NC}"
echo

# 1. 用户登录获取token
echo -e "${YELLOW}1. 用户登录...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13600136000",
    "password": "123456"
  }')

echo "登录响应: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ 登录失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 登录成功，Token: ${TOKEN:0:20}...${NC}"
echo

# 2. 测试分页API - 第一页
echo -e "${YELLOW}2. 测试获取第一页数据（每页10条）...${NC}"
FEED_PAGE1_RESPONSE=$(curl -s -X GET "$BASE_URL/meal-records/feed?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")

echo "第一页响应: $FEED_PAGE1_RESPONSE"
echo

# 3. 测试分页API - 第二页
echo -e "${YELLOW}3. 测试获取第二页数据（每页10条）...${NC}"
FEED_PAGE2_RESPONSE=$(curl -s -X GET "$BASE_URL/meal-records/feed?page=2&limit=10" \
  -H "Authorization: Bearer $TOKEN")

echo "第二页响应: $FEED_PAGE2_RESPONSE"
echo

# 4. 测试分页API - 默认参数
echo -e "${YELLOW}4. 测试默认参数（不传分页参数）...${NC}"
FEED_DEFAULT_RESPONSE=$(curl -s -X GET "$BASE_URL/meal-records/feed" \
  -H "Authorization: Bearer $TOKEN")

echo "默认参数响应: $FEED_DEFAULT_RESPONSE"
echo

# 5. 检查响应结构
echo -e "${YELLOW}5. 检查响应数据结构...${NC}"
if echo "$FEED_PAGE1_RESPONSE" | grep -q '"records"'; then
    echo -e "${GREEN}✅ 包含records字段${NC}"
else
    echo -e "${RED}❌ 缺少records字段${NC}"
fi

if echo "$FEED_PAGE1_RESPONSE" | grep -q '"currentPage"'; then
    echo -e "${GREEN}✅ 包含currentPage字段${NC}"
else
    echo -e "${RED}❌ 缺少currentPage字段${NC}"
fi

if echo "$FEED_PAGE1_RESPONSE" | grep -q '"hasMore"'; then
    echo -e "${GREEN}✅ 包含hasMore字段${NC}"
else
    echo -e "${RED}❌ 缺少hasMore字段${NC}"
fi

if echo "$FEED_PAGE1_RESPONSE" | grep -q '"totalRecords"'; then
    echo -e "${GREEN}✅ 包含totalRecords字段${NC}"
else
    echo -e "${RED}❌ 缺少totalRecords字段${NC}"
fi

echo
echo -e "${GREEN}=== 分页API测试完成 ===${NC}"
