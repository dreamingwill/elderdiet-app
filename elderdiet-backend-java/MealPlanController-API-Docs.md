# Meal Plan API 文档 (V3)

本文档根据 `MealPlanController.java` 的最新代码生成，旨在为前端开发团队提供与膳食计划（Meal Plan）功能相关的后端 API 的详细规范。

**基础 URL**: `http://<your_server_address>:<port>/api/v1/meal-plans`

**通用 Headers**:

| Key             | Value                 | 备注                             |
| --------------- | --------------------- | -------------------------------- |
| `Content-Type`  | `application/json`    | 适用于所有 POST 和 PUT 请求      |
| `Authorization` | `Bearer <your_token>` | 所有接口都需要，通过登录接口获取 |

---

## 1. 膳食计划生成

### 1.1 生成指定日期的膳食计划

- **Endpoint**: `/`
- **Method**: `POST`
- **Description**: 为当前登录用户生成指定日期的膳食计划。
- **Request Body**:

  ```json
  {
    "plan_date": "2024-07-26"
  }
  ```

- **Success Response (200 OK)**: 返回包含新膳食计划的 `ApiResponse`。

  ```json
  {
    "success": true,
    "message": "膳食计划生成成功",
    "data": {
      "id": "66a28d5a1b2c3d4e5f6a7b8c",
      "user_id": "668b82a0b82f6343c5b52a92",
      "plan_date": "2024-07-26"
      // ... 其他膳食计划字段
    }
  }
  ```

- **`curl` 示例**:
  ```bash
  curl -X POST 'http://localhost:3031/api/v1/meal-plans' \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
      "plan_date": "2024-07-26"
  }'
  ```

### 1.2 一键生成今日膳食计划

- **Endpoint**: `/generate-today`
- **Method**: `POST`
- **Description**: 为当前登录用户快速生成当天的膳食计划。
- **Request Body**: (Empty)
- **Success Response (200 OK)**: 返回新生成的今日膳食计划。
- **`curl` 示例**:
  ```bash
  curl -X POST 'http://localhost:3031/api/v1/meal-plans/generate-today' \
  -H 'Authorization: Bearer <your_token>'
  ```

---

## 2. 膳食计划查询

### 2.1 获取今日最新膳食计划

- **Endpoint**: `/today`
- **Method**: `GET`
- **Description**: 获取当前登录用户今天的最新一份膳食计划。
- **Success Response (200 OK)**: 返回最新的膳食计划；如果不存在则`data`为`null`。
- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:3031/api/v1/meal-plans/today' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 2.2 获取今日所有膳食计划

- **Endpoint**: `/today/all`
- **Method**: `GET`
- **Description**: 获取当前登录用户今天生成的所有膳食计划列表。
- **Success Response (200 OK)**: 返回膳食计划列表。
- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:3031/api/v1/meal-plans/today/all' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 2.3 获取指定日期的最新膳食计划

- **Endpoint**: `/latest`
- **Method**: `GET`
- **Description**: 获取当前登录用户在特定日期的最新一份膳食计划。
- **Query Parameters**:
  - `plan_date` (string, required): 日期, 格式 `YYYY-MM-DD`。
- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:3031/api/v1/meal-plans/latest?plan_date=2024-07-26' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 2.4 获取指定日期的所有膳食计划

- **Endpoint**: `/by-date`
- **Method**: `GET`
- **Description**: 获取当前登录用户在特定日期的所有膳食计划列表。
- **Query Parameters**:
  - `plan_date` (string, required): 日期, 格式 `YYYY-MM-DD`。
- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:3031/api/v1/meal-plans/by-date?plan_date=2024-07-26' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 2.5 获取膳食计划历史记录

- **Endpoint**: `/history`
- **Method**: `GET`
- **Description**: 获取当前登录用户的所有历史膳食计划。
- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:3031/api/v1/meal-plans/history' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 2.6 获取指定日期范围的膳食计划

- **Endpoint**: `/range`
- **Method**: `GET`
- **Description**: 获取当前登录用户在指定日期范围内的所有膳食计划。
- **Query Parameters**:
  - `start_date` (string, required): 开始日期, `YYYY-MM-DD`。
  - `end_date` (string, required): 结束日期, `YYYY-MM-DD`。
- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:3031/api/v1/meal-plans/range?start_date=2024-07-01&end_date=2024-07-26' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 2.7 获取所有收藏的膳食计划

- **Endpoint**: `/liked`
- **Method**: `GET`
- **Description**: 获取当前登录用户所有标记为“喜欢”的膳食计划。
- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:3031/api/v1/meal-plans/liked' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 2.8 获取膳食计划统计信息

- **Endpoint**: `/stats`
- **Method**: `GET`
- **Description**: 获取当前登录用户的膳食计划统计数据。
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "膳食计划统计信息获取成功",
    "data": {
      "total_plans": 25,
      "liked_plans": 8
    }
  }
  ```
- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:3031/api/v1/meal-plans/stats' \
  -H 'Authorization: Bearer <your_token>'
  ```

---

## 3. 膳食计划操作

### 3.1 更换菜品

- **Endpoint**: `/replace-dish`
- **Method**: `PUT`
- **Description**: 替换指定膳食计划中某餐的某个菜品。
- **Request Body**:

  ```json
  {
    "meal_plan_id": "66a28d5a1b2c3d4e5f6a7b8c",
    "meal_type": "LUNCH",
    "dish_index": 0
  }
  ```

- **Success Response (200 OK)**: 返回更新后的整个膳食计划。
- **`curl` 示例**:
  ```bash
  curl -X PUT 'http://localhost:3031/api/v1/meal-plans/replace-dish' \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
      "meal_plan_id": "66a28d5a1b2c3d4e5f6a7b8c",
      "meal_type": "LUNCH",
      "dish_index": 0
  }'
  ```

### 3.2 设置膳食计划喜欢状态

- **Endpoint**: `/like`
- **Method**: `PUT`
- **Description**: 明确设置一个膳食计划的喜欢状态（喜欢/不喜欢）。
- **Request Body**:

  ```json
  {
    "meal_plan_id": "66a28d5a1b2c3d4e5f6a7b8c",
    "liked": true
  }
  ```

- **`curl` 示例**:
  ```bash
  curl -X PUT 'http://localhost:3031/api/v1/meal-plans/like' \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
      "meal_plan_id": "66a28d5a1b2c3d4e5f6a7b8c",
      "liked": true
  }'
  ```

### 3.3 切换膳食计划喜欢状态

- **Endpoint**: `/{mealPlanId}/toggle-like`
- **Method**: `PUT`
- **Description**: 切换一个膳食计划的喜欢状态（喜欢 -> 不喜欢，不喜欢 -> 喜欢）。
- **Path Variable**:
  - `mealPlanId` (string, required): 膳食计划的 ID。
- **`curl` 示例**:
  ```bash
  curl -X PUT 'http://localhost:3031/api/v1/meal-plans/66a28d5a1b2c3d4e5f6a7b8c/toggle-like' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 3.4 归档膳食计划

- **Endpoint**: `/{mealPlanId}/archive`
- **Method**: `PUT`
- **Description**: 将指定的膳食计划标记为已归档。
- **Path Variable**:
  - `mealPlanId` (string, required): 膳食计划的 ID。
- **`curl` 示例**:
  ```bash
  curl -X PUT 'http://localhost:3031/api/v1/meal-plans/66a28d5a1b2c3d4e5f6a7b8c/archive' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 3.5 删除膳食计划

- **Endpoint**: `/{mealPlanId}`
- **Method**: `DELETE`
- **Description**: 删除指定的膳食计划。
- **Path Variable**:
  - `mealPlanId` (string, required): 膳食计划的 ID。
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "膳食计划删除成功",
    "data": null
  }
  ```
- **`curl` 示例**:
  ```bash
  curl -X DELETE 'http://localhost:3031/api/v1/meal-plans/66a28d5a1b2c3d4e5f6a7b8c' \
  -H 'Authorization: Bearer <your_token>'
  ```
