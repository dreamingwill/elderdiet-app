# Meal Plan API 文档 (V2)

本文档旨在为前端开发团队提供与膳食计划（Meal Plan）功能相关的后端 API 的详细规范。

**基础 URL**: `http://<your_server_address>:<port>/api/v1`

**通用 Headers**:

| Key             | Value                 | 备注                                   |
| :-------------- | :-------------------- | :------------------------------------- |
| `Content-Type`  | `application/json`    | 适用于所有 POST 和 PUT 请求            |
| `Authorization` | `Bearer <your_token>` | 访问受保护接口时需要，通过登录接口获取 |

---

## 1. 认证 (Auth)

### 1.1 用户登录

获取用于后续请求的 `Authorization` 令牌。

- **Endpoint**: `/auth/login`
- **Method**: `POST`
- **Description**: 使用用户名和密码进行身份验证，成功后返回 JWT。
- **Request Body**:
  ```json
  {
    "username": "testuser",
    "password": "password123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "user_info": {
      "id": "668b82a0b82f6343c5b52a92",
      "username": "testuser",
      "email": "testuser@example.com",
      "created_at": "2024-07-08T08:00:00.000+00:00"
    }
  }
  ```
- **`curl` 示例**:
  ```bash
  curl -X POST 'http://localhost:8080/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
      "username": "testuser",
      "password": "password123"
  }'
  ```

---

## 2. 膳食计划 (Meal Plan)

### 2.1 生成新的膳食计划

为指定用户和日期生成一份全新的膳食计划。每次调用都会创建一个新的计划，即使当天已有计划存在。

- **Endpoint**: `/meal-plans`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: 根据用户的健康档案（如慢性病、过敏等）和指定日期，通过 AI 生成一份个性化的膳食计划。
- **Request Body**:
  ```json
  {
    "plan_date": "2024-07-25",
    "preferred_ingredients": ["鸡肉", "西兰花"],
    "avoid_ingredients": ["芹菜"],
    "special_requirements": "低盐"
  }
  ```
- **`curl` 示例**:
  ```bash
  curl -X POST 'http://localhost:8080/api/v1/meal-plans' \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
      "plan_date": "2024-07-25",
      "preferred_ingredients": ["鸡肉", "西兰花"],
      "avoid_ingredients": ["芹菜"],
      "special_requirements": "低盐"
  }'
  ```

### 2.2 更换单个菜品

在已有的膳食计划中，更换某一餐的单个菜品。

- **Endpoint**: `/meal-plans/replace-dish`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: AI 会根据原有的膳食计划和用户健康档案，重新生成一道菜品来替换指定的旧菜品。
- **Request Body**:
  ```json
  {
    "meal_plan_id": "66a15a7a7b8e9f1a2b3c4d5e",
    "meal_type": "LUNCH",
    "dish_index": 0
  }
  ```
- **`curl` 示例**:
  ```bash
  curl -X PUT 'http://localhost:8080/api/v1/meal-plans/replace-dish' \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
      "meal_plan_id": "66a15a7a7b8e9f1a2b3c4d5e",
      "meal_type": "LUNCH",
      "dish_index": 0
  }'
  ```

### 2.3 获取指定日期的最新膳食计划

获取某个用户在特定日期的最新一份膳食计划。

- **Endpoint**: `/meal-plans/latest`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: 如果用户在同一天生成了多份计划，此接口只返回最新创建的那一份。
- **Query Parameters**:

  - `user_id` (string, required): 用户 ID。
  - `plan_date` (string, required): 日期，格式 `YYYY-MM-DD`。

- **Success Response (200 OK)**:
  返回单个膳食计划对象，结构同 **2.1**。如果未找到，返回 404 Not Found。

- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:8080/api/v1/meal-plans/latest?plan_date=2024-07-25' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 2.4 获取指定日期的所有膳食计划

获取某个用户在特定日期的所有膳食计划列表。

- **Endpoint**: `/meal-plans/by-date`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: 返回一个数组，包含指定用户和日期的所有膳食计划。
- **Query Parameters**:

  - `user_id` (string, required): 用户 ID。
  - `plan_date` (string, required): 日期，格式 `YYYY-MM-DD`。

- **Success Response (200 OK)**:
  返回膳食计划对象组成的数组 `[ MealPlan, MealPlan, ... ]`。

- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:8080/api/v1/meal-plans/by-date?plan_date=2024-07-25' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 2.5 收藏/取消收藏膳食计划

设置指定膳食计划的“收藏”状态。

- **Endpoint**: `/meal-plans/like`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: 通过请求体来设置收藏状态。
- **Request Body**:

  ```json
  {
    "meal_plan_id": "66a15a7a7b8e9f1a2b3c4d5e",
    "liked": true
  }
  ```

- **Success Response (200 OK)**:
  返回更新后的膳食计划对象，结构同 **2.1**。

- **`curl` 示例 (收藏)**:

  ```bash
  curl -X PUT 'http://localhost:8080/api/v1/meal-plans/like' \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
      "meal_plan_id": "66a15a7a7b8e9f1a2b3c4d5e",
      "liked": true
  }'
  ```

- **`curl` 示例 (取消收藏)**:
  ```bash
  curl -X PUT 'http://localhost:8080/api/v1/meal-plans/like' \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
      "meal_plan_id": "66a15a7a7b8e9f1a2b3c4d5e",
      "liked": false
  }'
  ```

### 2.6 获取所有已收藏的膳食计划

获取指定用户所有已收藏的膳食计划。

- **Endpoint**: `/meal-plans/liked`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: 返回一个包含该用户所有 `liked` 字段为 `true` 的膳食计划的数组。
- **Query Parameters**:

  - `user_id` (string, required): 用户 ID。

- **Success Response (200 OK)**:
  返回膳食计划对象组成的数组 `[ MealPlan, MealPlan, ... ]`。

- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:8080/api/v1/meal-plans/liked' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 2.7 获取膳食计划统计数据

获取用户的膳食计划统计数据，如总数、已收藏数等。

- **Endpoint**: `/meal-plans/stats`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: 返回一个包含统计数据的对象。
- **Query Parameters**:

  - `user_id` (string, required): 用户 ID。

- **Success Response (200 OK)**:

  ```json
  {
    "total_plans": 50,
    "liked_plans": 15
  }
  ```

- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:8080/api/v1/meal-plans/stats' \
  -H 'Authorization: Bearer <your_token>'
  ```
