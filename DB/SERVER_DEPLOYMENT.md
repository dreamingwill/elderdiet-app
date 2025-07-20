# 服务器端部署说明

## 📋 文件说明

- `server_insert_health_articles.js` - 包含完整数据的MongoDB插入脚本

## 🚀 在服务器上执行

### 方法1：使用mongosh（推荐）
```bash
mongosh server_insert_health_articles.js
```

### 方法2：使用mongo（旧版本）
```bash
mongo server_insert_health_articles.js
```

### 方法3：连接到特定数据库
```bash
mongosh --host localhost --port 27017 server_insert_health_articles.js
```

## ⚠️ 注意事项

1. **数据库连接**：确保MongoDB服务正在运行
2. **重复数据**：脚本会检查现有数据，如需清空请手动执行：
   ```javascript
   db.health_articles.deleteMany({})
   ```
3. **权限**：确保有写入elderdiet_dev数据库的权限

## 📊 执行结果

脚本执行成功后会显示：
- 插入的文章数量
- 推荐文章数量
- 轮播文章数量

## 🔍 验证数据

执行完成后可以通过以下命令验证：
```javascript
use elderdiet_dev
db.health_articles.countDocuments()
db.health_articles.find({is_featured: 1}).count()
db.health_articles.find({is_carousel: 1}).count()
```
