# 数据库初始化脚本

这个文件夹包含了 MongoDB 数据库的初始化脚本。

## 文件说明

### `health_articles_init.js`

MongoDB 养生文章集合的初始化脚本，包含：

- 创建 `health_articles` 集合
- 创建必要的索引
- 插入 5 条示例养生文章数据

### `run_health_articles_init.sh`

执行初始化脚本的 shell 脚本，包含：

- 检查 MongoDB 服务状态
- 执行初始化脚本
- 提供验证命令

## 使用方法

### 1. 确保 MongoDB 运行

```bash
# 检查MongoDB状态
brew services list | grep mongodb

# 如果未运行，启动MongoDB
brew services start mongodb-community
```

### 2. 执行初始化脚本

```bash
# 方法1: 使用shell脚本（推荐）
./DB/run_health_articles_init.sh

# 方法2: 直接执行MongoDB脚本
mongosh --file DB/health_articles_init.js
```

### 3. 验证数据

```bash
# 查看所有文章
mongosh elderdiet --eval 'db.health_articles.find().pretty()'

# 统计文章数量
mongosh elderdiet --eval 'db.health_articles.countDocuments()'

# 查看推荐文章
mongosh elderdiet --eval 'db.health_articles.find({is_featured: 1}).pretty()'

# 查看轮播文章
mongosh elderdiet --eval 'db.health_articles.find({is_carousel: 1}).pretty()'
```

## 数据结构

### health_articles 集合字段说明

| 字段名         | 类型   | 说明                   |
| -------------- | ------ | ---------------------- |
| title          | String | 文章标题               |
| subtitle       | String | 副标题                 |
| category       | String | 分类名称               |
| content        | Object | 文章内容（JSON 格式）  |
| read_time      | Number | 阅读时间（分钟）       |
| tags           | Array  | 标签数组               |
| cover_image    | String | 封面图片 URL           |
| status         | Number | 状态（1-发布，0-草稿） |
| is_featured    | Number | 是否推荐（1-是，0-否） |
| is_carousel    | Number | 是否轮播（1-是，0-否） |
| carousel_order | Number | 轮播排序               |
| created_at     | Date   | 创建时间               |
| updated_at     | Date   | 更新时间               |

### content 字段结构

```json
{
  "paragraphs": [
    {
      "type": "text|image",
      "content": "文本内容或图片URL",
      "caption": "图片说明（仅图片类型）",
      "alt_text": "图片描述（仅图片类型）",
      "order": 1
    }
  ]
}
```

## 示例数据

脚本会插入 5 条养生文章数据：

1. 为什么晚上不能吃姜？ - 中医养生
2. 老年人补钙，别只知道喝牛奶 - 营养科学
3. 三高人群这样吃，血管更健康 - 慢病管理
4. 入秋了，这样进补不上火 - 季节养生
5. 老妈失眠，食疗比安眠药管用 - 睡眠健康

每条数据都包含完整的文字内容和相关图片，可以直接用于前端展示。
