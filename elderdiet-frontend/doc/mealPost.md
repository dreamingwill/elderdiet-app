家庭分享墙模块 - 后端 API 文档

1. 概述
   本文档旨在为前端开发团队提供“家庭分享墙”模块所需的后端 API 接口说明、数据结构和调用方式。该模块允许老人用户发布图文膳食记录，子女用户查看、点赞和评论，并通过小树成长的游戏化机制激励用户。
2. 模块功能
   膳食记录: 老人用户可以发布包含多张图片和文字的膳食记录。
   家庭分享: 老人可以选择将记录设为私密或家庭可见。子女用户可以看到其绑定的所有老人的家庭可见记录。
   互动: 所有用户都可以对可见的记录进行点赞/取消点赞和发表评论。
   小树成长: 老人每次发布记录都会给虚拟小树浇水，浇水两次后小树会进入下一成长阶段。
3. 认证
   所有 API 请求都需要在 HTTP Header 中提供有效的 JWT 令牌。
   Header: Authorization
   Value: Bearer {你的 JWT 令牌}
4. API 端点详解
   4.1 认证 (Auth)
   POST /api/v1/auth/register: 用户注册
   POST /api/v1/auth/login: 用户登录
   这两个接口用于获取测试所需的 JWT 令牌。
   4.2 家庭关系 (Family)
   POST /api/v1/family/link
   功能: 链接子女账号（仅限老人角色调用）。
   请求体 (JSON):
   {
   "child_phone": "13900000002"
   }
   成功响应: 200 OK，返回创建的 FamilyLink 对象。
   {
   "success": true,
   "message": "家庭链接创建成功",
   "data": {
   "id": "68726a5cc8137a08ae64a8ed",
   "parent_id": "687249c195979310396e0bb4",
   "child_id": "68724b1095979310396e0bb5",
   "created_at": "2025-07-12T21:59:56.546242",
   "updated_at": "2025-07-12T21:59:56.546242"
   },
   "timestamp": "2025-07-12T21:59:56.563Z"
   }
   失败响应: 400 Bad Request (如用户不存在、重复绑定等), 403 Forbidden (非老人角色调用)。
   4.3 分享墙 (Meal Records)
   POST /api/v1/meal-records
   功能: 创建一条新的膳食记录（仅限老人角色调用）。
   请求类型: multipart/form-data
   请求体:
   request (Part): 一个 JSON 字符串，包含文字和可见性。
   {
   "caption": "今天的午餐很丰盛！",
   "visibility": "FAMILY" // 或 "PRIVATE"
   }
   images (Part, File): 一个或多个图片文件。Key 必须为 images。
   成功响应: 200 OK，返回新创建的 MealRecord 对象。
   失败响应: 400 Bad Request (验证失败), 403 Forbidden (非老人角色调用)。
   GET /api/v1/meal-records/feed
   功能: 获取当前用户的分享墙时间线。
   老人用户: 返回自己所有的记录。
   子女用户: 返回所有已绑定老人的 FAMILY 可见记录。
   成功响应: 200 OK，返回一个 MealRecordResponse 数组。
   失败响应: 400 Bad Request。
   4.4 互动 (Likes & Comments)
   POST /api/v1/meal-records/{recordId}/toggle-like
   功能: 对指定 ID 的记录进行点赞或取消点赞。
   URL 参数: recordId - 膳食记录的 ID。
   成功响应: 200 OK，返回成功信息。
   失败响应: 400 Bad Request (记录不存在)。
   POST /api/v1/meal-records/{recordId}/comments
   功能: 对指定 ID 的记录发表评论。
   URL 参数: recordId - 膳食记录的 ID。
   请求体 (JSON):
   {
   "text": "看起来真美味！"
   }
   成功响应: 200 OK，返回新创建的 RecordComment 对象。
   失败响应: 400 Bad Request (记录不存在或评论内容为空)。
   GET /api/v1/meal-records/{recordId}/comments
   功能: 获取指定 ID 记录的所有评论。
   URL 参数: recordId - 膳食记录的 ID。
   成功响应: 200 OK，返回一个 CommentInfo 数组。
   失败响应: 400 Bad Request (记录不存在)。
   4.5 游戏化 (Gamification)
   GET /api/v1/profiles/tree-status
   功能: 获取当前用户的小树成长状态。
   成功响应: 200 OK，返回 TreeStatus 对象。
   失败响应: 500 Internal Server Error (档案不存在等)。
