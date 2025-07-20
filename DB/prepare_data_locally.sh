#!/bin/bash

# 本地数据准备脚本
# 在本地环境上传图片到OSS并生成完整的数据库插入脚本

set -e  # 遇到错误立即退出

echo "🏠 本地数据准备流程开始..."
echo "=================================="

# 检查当前目录
if [ ! -f "health_article_content/list.xlsx" ]; then
    echo "❌ 错误：请在DB目录下运行此脚本"
    echo "   当前目录应包含 health_article_content/list.xlsx 文件"
    exit 1
fi

# 检查环境变量
echo "🔍 检查环境变量..."
if [ -z "$ALIYUN_OSS_ACCESS_KEY_ID" ] || [ -z "$ALIYUN_OSS_ACCESS_KEY_SECRET" ]; then
    echo "❌ 错误：请先设置阿里云OSS环境变量"
    echo "   export ALIYUN_OSS_ACCESS_KEY_ID='你的AccessKey ID'"
    echo "   export ALIYUN_OSS_ACCESS_KEY_SECRET='你的AccessKey Secret'"
    echo ""
    echo "   或者在 ~/.bashrc 或 ~/.zshrc 中添加："
    echo "   export ALIYUN_OSS_ACCESS_KEY_ID='你的AccessKey ID'"
    echo "   export ALIYUN_OSS_ACCESS_KEY_SECRET='你的AccessKey Secret'"
    exit 1
else
    echo "✅ 环境变量检查通过"
fi

# 检查Python环境
echo "🐍 检查Python环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：未找到python3，请先安装Python 3"
    exit 1
fi

# 安装Python依赖
echo "📦 安装Python依赖..."
pip3 install pandas openpyxl oss2 --user

# 步骤1：上传图片到OSS
echo ""
echo "📤 步骤1：上传图片到阿里云OSS"
echo "=================================="

if [ -f "image_urls.json" ]; then
    echo "⚠️  发现已存在的图片URL文件，是否重新上传？(y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "🔄 重新上传图片..."
        python3 upload_images_to_oss.py
    else
        echo "📋 使用现有的图片URL文件"
    fi
else
    echo "🆕 首次上传图片..."
    python3 upload_images_to_oss.py
fi

# 检查上传结果
if [ ! -f "image_urls.json" ]; then
    echo "❌ 错误：图片上传失败，未生成URL映射文件"
    exit 1
fi

echo "✅ 图片上传完成"

# 步骤2：生成文章数据
echo ""
echo "📝 步骤2：生成文章数据"
echo "=================================="

echo "🔄 处理Excel数据并生成JSON格式..."
python3 generate_health_articles_data.py

# 检查数据生成结果
if [ ! -f "health_articles_data.json" ]; then
    echo "❌ 错误：数据生成失败，未生成JSON文件"
    exit 1
fi

echo "✅ 文章数据生成完成"

# 步骤3：生成服务器端执行脚本
echo ""
echo "📜 步骤3：生成服务器端执行脚本"
echo "=================================="

# 读取生成的JSON数据并嵌入到MongoDB脚本中
echo "🔄 生成包含数据的MongoDB脚本..."

cat > server_insert_health_articles.js << 'EOF'
// 服务器端健康文章数据插入脚本
// 此脚本包含完整的文章数据，可直接在服务器上运行

print('🚀 开始插入健康文章数据到数据库...');

// 使用elderdiet_dev数据库
db = db.getSiblingDB('elderdiet_dev');

// 检查现有数据
try {
  const existingCount = db.health_articles.countDocuments();
  if (existingCount > 0) {
    print(`⚠️  数据库中已存在 ${existingCount} 条健康文章数据`);
    print('如需清空现有数据，请手动执行: db.health_articles.deleteMany({})');
  }
} catch (error) {
  print('❌ 检查现有数据时出错:', error);
}

// 创建集合和索引
try {
  db.createCollection('health_articles');
  
  // 创建必要的索引
  db.health_articles.createIndex({ "category": 1 });
  db.health_articles.createIndex({ "status": 1 });
  db.health_articles.createIndex({ "is_featured": 1 });
  db.health_articles.createIndex({ "is_carousel": 1 });
  db.health_articles.createIndex({ "created_at": -1 });
  db.health_articles.createIndex({ "tags": 1 });
  
  print('✅ 集合和索引创建成功');
  
} catch (error) {
  print('⚠️  集合可能已存在:', error.message);
}

// 文章数据
const articles = 
EOF

# 将JSON数据追加到脚本中
cat health_articles_data.json >> server_insert_health_articles.js

# 添加插入逻辑
cat >> server_insert_health_articles.js << 'EOF'
;

// 插入数据
try {
  if (!articles || articles.length === 0) {
    print('❌ 没有要插入的文章数据');
    quit(1);
  }
  
  // 处理日期字段
  const processedArticles = articles.map(article => ({
    ...article,
    created_at: new Date(article.created_at),
    updated_at: new Date(article.updated_at)
  }));
  
  // 批量插入
  const result = db.health_articles.insertMany(processedArticles);
  
  print(`✅ 成功插入 ${result.insertedIds.length} 条健康文章数据`);
  
  // 统计信息
  const totalCount = db.health_articles.countDocuments();
  const featuredCount = db.health_articles.countDocuments({ is_featured: 1 });
  const carouselCount = db.health_articles.countDocuments({ is_carousel: 1 });
  
  print('📊 数据统计:');
  print(`   总文章数: ${totalCount}`);
  print(`   推荐文章数: ${featuredCount}`);
  print(`   轮播文章数: ${carouselCount}`);
  
} catch (error) {
  print('❌ 插入数据时出错:', error);
  quit(1);
}

print('🎉 健康文章数据插入完成！');
EOF

echo "✅ 服务器端脚本生成完成: server_insert_health_articles.js"

# 创建服务器端执行说明
cat > SERVER_DEPLOYMENT.md << 'EOF'
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
EOF

echo ""
echo "🎉 本地数据准备完成！"
echo "=================================="
echo "📊 处理结果："
echo "   ✅ 图片已上传到阿里云OSS"
echo "   ✅ Excel数据已转换为JSON格式"
echo "   ✅ 服务器端执行脚本已生成"
echo ""
echo "📁 生成的文件："
echo "   - image_urls.json: 图片URL映射"
echo "   - health_articles_data.json: 文章数据"
echo "   - server_insert_health_articles.js: 服务器端执行脚本"
echo "   - SERVER_DEPLOYMENT.md: 服务器部署说明"
echo ""
echo "🚀 下一步："
echo "   1. 将 server_insert_health_articles.js 提交到Git"
echo "   2. 在服务器上拉取最新代码"
echo "   3. 在服务器DB目录下执行: mongosh server_insert_health_articles.js"
