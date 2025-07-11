# Meal Plan API 文档 (V3)

本文档根据 `MealPlanController.java` 的最新代码生成，旨在为前端开发团队提供与膳食计划（Meal Plan）功能相关的后端 API 的详细规范。

**基础 URL**: `http://<your_server_address>:<port>/api/meal-plans`

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
    "plan_date": "2024-07-26",

    "preferred_ingredients": ["牛肉", "土豆"], // 可选
    "avoid_ingredients": ["海鲜"], // 可选
    "special_requirements": "喝汤" // 可选
  }
  ```

- **Success Response (200 OK)**: 返回包含新膳食计划的 `ApiResponse`。

  ```json
  {
    "success": true,
    "message": "膳食计划生成成功",
    "data": {
      "id": "6870d7e4846d094cf5081215",
      "user_id": "686de4370bb95957dceb484e",
      "plan_date": "2024-01-17",
      "breakfast": {
        "meal_type": "breakfast",
        "dishes": [
          {
            "name": "燕麦牛奶粥",
            "ingredients": ["燕麦", "牛奶"],
            "recommendation_reason": "燕麦富含纤维，有助于控制体重和改善消化系统。牛奶提供优质蛋白质和钙，适合老年人维护骨骼健康。",
            "preparation_notes": "将燕麦放入牛奶中煮沸，然后小火煮至粥状，搅拌均匀即可。",
            "tags": ["易消化", "高钙"]
          },
          {
            "name": "鸡蛋蔬菜饼",
            "ingredients": ["鸡蛋", "胡萝卜", "菠菜"],
            "recommendation_reason": "鸡蛋提供优质蛋白质，胡萝卜富含维生素A，菠菜含铁和纤维，均衡营养，有助于增强免疫力。",
            "preparation_notes": "将鸡蛋打散，加入切碎的胡萝卜和菠菜，煎成饼状即可。",
            "tags": ["高蛋白", "维生素丰富"]
          }
        ],
        "nutrition_summary": "早餐提供优质蛋白质、纤维和钙，帮助提供能量和促进消化。",
        "meal_tips": "早餐宜清淡，建议搭配温开水或淡茶。",
        "dish_count": 2,
        "meal_type_label": "早餐"
      },
      "lunch": {
        "meal_type": "lunch",
        "dishes": [
          {
            "name": "牛肉土豆汤",
            "ingredients": ["牛肉", "土豆", "洋葱"],
            "recommendation_reason": "牛肉提供丰富的铁和蛋白质，帮助维持肌肉质量。土豆富含维生素C和钾，有助于心血管健康。洋葱具有抗氧化效果。",
            "preparation_notes": "将牛肉和土豆切块，与洋葱一起煮成浓汤，适合老年人饮用。",
            "tags": ["低脂", "高蛋白"]
          },
          {
            "name": "清炒西兰花",
            "ingredients": ["西兰花", "蒜"],
            "recommendation_reason": "西兰花富含维生素C和膳食纤维，蒜有抗菌作用，帮助提高免疫力。",
            "preparation_notes": "西兰花切小块，蒜切片，用少量油清炒至熟即可。",
            "tags": ["抗氧化", "低热量"]
          },
          {
            "name": "红枣银耳羹",
            "ingredients": ["红枣", "银耳", "冰糖"],
            "recommendation_reason": "银耳滋阴润肺，红枣补血安神，适合老年人补充能量和调理脾胃。",
            "preparation_notes": "银耳泡发后与红枣一起煮至软烂，加入适量冰糖调味。",
            "tags": ["滋补", "甜品"]
          }
        ],
        "nutrition_summary": "午餐提供优质蛋白质、维生素和矿物质，促进代谢和增强免疫力。",
        "meal_tips": "午餐可适量多摄入蔬菜和汤品，避免过量油腻食物。",
        "dish_count": 3,
        "meal_type_label": "午餐"
      },
      "dinner": {
        "meal_type": "dinner",
        "dishes": [
          {
            "name": "蒸鸡肉豆腐",
            "ingredients": ["鸡胸肉", "豆腐", "姜"],
            "recommendation_reason": "鸡肉富含蛋白质，豆腐提供钙和植物蛋白，姜有助于提高消化功能。",
            "preparation_notes": "鸡胸肉切片与豆腐一起蒸熟，加入姜片调味。",
            "tags": ["低脂", "高蛋白"]
          },
          {
            "name": "冬瓜瘦肉汤",
            "ingredients": ["冬瓜", "瘦肉", "香菜"],
            "recommendation_reason": "冬瓜清热利水，瘦肉提供蛋白质，香菜提升香气，适合老年人清淡饮食。",
            "preparation_notes": "瘦肉切片，与冬瓜一起煮汤，最后放入香菜调味。",
            "tags": ["清淡", "利水"]
          },
          {
            "name": "胡萝卜炒蘑菇",
            "ingredients": ["胡萝卜", "蘑菇", "青椒"],
            "recommendation_reason": "胡萝卜富含维生素A，蘑菇提供膳食纤维和微量元素，有助于增强免疫力。",
            "preparation_notes": "胡萝卜切丝，蘑菇切片，与青椒一起炒至熟。",
            "tags": ["维生素丰富", "低热量"]
          }
        ],
        "nutrition_summary": "晚餐提供丰富的蛋白质和膳食纤维，帮助消化和促进睡眠。",
        "meal_tips": "晚餐应以清淡为主，避免太油腻或过量食用。",
        "dish_count": 3,
        "meal_type_label": "晚餐"
      },
      "generated_reason": "根据用户的健康状况和需求，膳食计划注重蛋白质摄入和心血管健康，同时结合中医养生理念，选择适合老年人的食材和烹饪方式。",
      "health_tips": "建议每天适量运动如步行，帮助控制体重和增强心肺功能。保持良好的生活作息，注意饮食多样化。",
      "status": "active",
      "liked": false,
      "created_at": "2025-07-11 17:22:44",
      "updated_at": "2025-07-11 17:22:44"
    },
    "timestamp": "2025-07-11T17:22:44.912Z"
  }
  ```

- **`curl` 示例**:
  ```bash
  curl -X POST 'http://localhost:3001/api/meal-plans' \
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
  curl -X POST 'http://localhost:3001/api/meal-plans/generate-today' \
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
  curl -X GET 'http://localhost:3001/api/meal-plans/today' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 2.2 获取今日所有膳食计划

- **Endpoint**: `/today/all`
- **Method**: `GET`
- **Description**: 获取当前登录用户今天生成的所有膳食计划列表。
- **Success Response (200 OK)**: 返回膳食计划列表。
- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:3001/api/meal-plans/today/all' \
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
  curl -X GET 'http://localhost:3001/api/meal-plans/latest?plan_date=2024-07-26' \
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
  curl -X GET 'http://localhost:3001/api/meal-plans/by-date?plan_date=2024-07-26' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 2.5 获取膳食计划历史记录

- **Endpoint**: `/history`
- **Method**: `GET`
- **Description**: 获取当前登录用户的所有历史膳食计划。
- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:3001/api/meal-plans/history' \
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
  curl -X GET 'http://localhost:3001/api/meal-plans/range?start_date=2024-07-01&end_date=2024-07-26' \
  -H 'Authorization: Bearer <your_token>'
  ```

### 2.7 获取所有收藏的膳食计划

- **Endpoint**: `/liked`
- **Method**: `GET`
- **Description**: 获取当前登录用户所有标记为“喜欢”的膳食计划。
- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:3001/api/meal-plans/liked' \
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
      "total": 7,
      "liked": 2
    },
    "timestamp": "2025-07-11T19:50:01.984Z"
  }
  ```
- **`curl` 示例**:
  ```bash
  curl -X GET 'http://localhost:3001/api/meal-plans/stats' \
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
  curl -X PUT 'http://localhost:3001/api/meal-plans/replace-dish' \
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
  curl -X PUT 'http://localhost:3001/api/meal-plans/like' \
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
  curl -X PUT 'http://localhost:3001/api/meal-plans/66a28d5a1b2c3d4e5f6a7b8c/toggle-like' \
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
  curl -X PUT 'http://localhost:3001/api/meal-plans/66a28d5a1b2c3d4e5f6a7b8c/archive' \
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
    "data": null,
    "timestamp": "2025-07-11T19:52:50.964Z"
  }
  ```
- **`curl` 示例**:
  ```bash
  curl -X DELETE 'http://localhost:3001/api/meal-plans/66a28d5a1b2c3d4e5f6a7b8c' \
  -H 'Authorization: Bearer <your_token>'
  ```
