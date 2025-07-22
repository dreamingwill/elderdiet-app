#!/bin/bash

# 测试营养师评论功能的API脚本
# 使用方法: ./test-nutritionist-comment-api.sh

BASE_URL="http://localhost:3001/api/v1"
CONTENT_TYPE="Content-Type: application/json"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 营养师评论功能API测试 ===${NC}"
echo

# 检查服务器是否运行
echo -e "${YELLOW}1. 检查服务器状态...${NC}"
if ! curl -s "$BASE_URL/actuator/health" > /dev/null; then
    echo -e "${RED}❌ 服务器未运行，请先启动后端服务${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 服务器运行正常${NC}"
echo

# 用户登录获取token
echo -e "${YELLOW}2. 用户登录...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "$CONTENT_TYPE" \
  -d '{
    "phone": "13800138000",
    "password": "123456"
  }')

echo "登录响应: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ 登录失败，无法获取token${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 登录成功，Token: ${TOKEN:0:20}...${NC}"
echo

# 创建带营养师评论的膳食记录
echo -e "${YELLOW}3. 创建膳食记录（分享给营养师）...${NC}"

# 创建临时测试图片文件
echo "创建测试图片文件..."
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > test_image.png

# 使用multipart/form-data创建膳食记录
MEAL_RECORD_RESPONSE=$(curl -s -X POST "$BASE_URL/meal-records" \
  -H "Authorization: Bearer $TOKEN" \
  -F 'request={"caption":"今天吃了营养丰富的蔬菜沙拉，感觉很健康！","visibility":"FAMILY","shareWithNutritionist":true}' \
  -F 'images=@test_image.png')

echo "膳食记录创建响应: $MEAL_RECORD_RESPONSE"

RECORD_ID=$(echo $MEAL_RECORD_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -z "$RECORD_ID" ]; then
    echo -e "${RED}❌ 膳食记录创建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 膳食记录创建成功，ID: $RECORD_ID${NC}"
echo

# 等待营养师评论生成
echo -e "${YELLOW}4. 等待营养师评论生成（10秒）...${NC}"
sleep 10

# 获取分享墙，查看营养师评论
echo -e "${YELLOW}5. 获取分享墙，检查营养师评论...${NC}"
FEED_RESPONSE=$(curl -s -X GET "$BASE_URL/meal-records/feed" \
  -H "Authorization: Bearer $TOKEN")

echo "分享墙响应: $FEED_RESPONSE"

# 检查是否包含营养师评论
if echo $FEED_RESPONSE | grep -q "nutritionist_comment"; then
    echo -e "${GREEN}✅ 营养师评论字段存在${NC}"
    
    # 提取营养师评论内容
    NUTRITIONIST_COMMENT=$(echo $FEED_RESPONSE | grep -o '"nutritionist_comment":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$NUTRITIONIST_COMMENT" ] && [ "$NUTRITIONIST_COMMENT" != "null" ]; then
        echo -e "${GREEN}✅ 营养师评论已生成: $NUTRITIONIST_COMMENT${NC}"
    else
        echo -e "${YELLOW}⚠️ 营养师评论尚未生成，可能需要更多时间${NC}"
    fi
else
    echo -e "${RED}❌ 营养师评论字段不存在${NC}"
fi
echo

# 测试手动生成营养师评论API
echo -e "${YELLOW}6. 测试手动生成营养师评论API...${NC}"
MANUAL_COMMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/meal-records/$RECORD_ID/nutritionist-comment" \
  -H "Authorization: Bearer $TOKEN")

echo "手动生成营养师评论响应: $MANUAL_COMMENT_RESPONSE"

if echo $MANUAL_COMMENT_RESPONSE | grep -q "success.*true"; then
    echo -e "${GREEN}✅ 手动生成营养师评论API调用成功${NC}"
else
    echo -e "${RED}❌ 手动生成营养师评论API调用失败${NC}"
fi
echo

# 再次等待并检查
echo -e "${YELLOW}7. 再次等待并检查营养师评论（10秒）...${NC}"
sleep 10

FEED_RESPONSE2=$(curl -s -X GET "$BASE_URL/meal-records/feed" \
  -H "Authorization: Bearer $TOKEN")

NUTRITIONIST_COMMENT2=$(echo $FEED_RESPONSE2 | grep -o '"nutritionist_comment":"[^"]*"' | cut -d'"' -f4)
if [ ! -z "$NUTRITIONIST_COMMENT2" ] && [ "$NUTRITIONIST_COMMENT2" != "null" ]; then
    echo -e "${GREEN}✅ 最终营养师评论: $NUTRITIONIST_COMMENT2${NC}"
else
    echo -e "${YELLOW}⚠️ 营养师评论仍未生成，请检查AI API配置${NC}"
fi

# 清理测试文件
rm -f test_image.png

echo
echo -e "${BLUE}=== 测试完成 ===${NC}"
echo -e "${YELLOW}注意事项:${NC}"
echo "1. 确保AI API配置正确（application.yml中的ai.api.key等）"
echo "2. 营养师评论是异步生成的，可能需要几秒到几十秒时间"
echo "3. 如果评论未生成，请检查后端日志中的错误信息"
