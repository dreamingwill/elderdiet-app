#!/bin/bash

# 健康文章数据初始化完整执行脚本
# 包含图片上传、数据生成和数据库插入的完整流程

set -e  # 遇到错误立即退出

echo "🚀 开始健康文章数据初始化流程..."
echo "=================================="

# 检查当前目录
if [ ! -f "health_article_content/list.xlsx" ]; then
    echo "❌ 错误：请在DB目录下运行此脚本"
    echo "   当前目录应包含 health_article_content/list.xlsx 文件"
    exit 1
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

# 步骤1：检查OSS配置
echo ""
echo "📋 步骤1：检查OSS配置"
echo "=================================="

if grep -q "YOUR_ACCESS_KEY_ID" upload_images_to_oss.py; then
    echo "⚠️  检测到OSS配置未完成"
    echo ""
    echo "请编辑 upload_images_to_oss.py 文件，填入以下配置："
    echo "  - access_key_id: 阿里云AccessKey ID"
    echo "  - access_key_secret: 阿里云AccessKey Secret"
    echo "  - endpoint: OSS地域节点 (如: https://oss-cn-hangzhou.aliyuncs.com)"
    echo "  - bucket_name: OSS存储桶名称"
    echo "  - path_prefix: 图片存储路径前缀 (如: health-articles/images/)"
    echo ""
    echo "配置完成后，请重新运行此脚本"
    exit 1
else
    echo "✅ OSS配置检查通过"
fi

# 步骤2：上传图片到OSS
echo ""
echo "📤 步骤2：上传图片到阿里云OSS"
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

# 步骤3：生成文章数据
echo ""
echo "📝 步骤3：生成文章数据"
echo "=================================="

echo "🔄 处理Excel数据并生成JSON格式..."
python3 generate_health_articles_data.py

# 检查数据生成结果
if [ ! -f "health_articles_data.json" ]; then
    echo "❌ 错误：数据生成失败，未生成JSON文件"
    exit 1
fi

echo "✅ 文章数据生成完成"

# 步骤4：插入数据到MongoDB
echo ""
echo "🗄️  步骤4：插入数据到MongoDB"
echo "=================================="

# 检查MongoDB连接
echo "🔍 检查MongoDB连接..."
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "❌ 错误：未找到MongoDB客户端 (mongosh 或 mongo)"
    echo "   请确保已安装MongoDB并且客户端在PATH中"
    exit 1
fi

# 选择MongoDB客户端
if command -v mongosh &> /dev/null; then
    MONGO_CLIENT="mongosh"
else
    MONGO_CLIENT="mongo"
fi

echo "📊 使用 $MONGO_CLIENT 连接MongoDB..."

# 创建临时的MongoDB脚本，包含生成的数据
echo "🔄 准备MongoDB插入脚本..."
cat > temp_insert_script.js << 'EOF'
// 临时插入脚本
db = db.getSiblingDB('elderdiet_dev');

// 读取生成的数据
const fs = require('fs');
let articles = [];

try {
    const rawData = fs.readFileSync('health_articles_data.json', 'utf8');
    articles = JSON.parse(rawData);
    print(`📖 成功加载 ${articles.length} 条文章数据`);
} catch (error) {
    print(`❌ 读取数据文件时出错: ${error}`);
    quit(1);
}

// 创建集合和索引
try {
    db.createCollection('health_articles');
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

// 处理并插入数据
try {
    const processedArticles = articles.map(article => ({
        ...article,
        created_at: new Date(article.created_at),
        updated_at: new Date(article.updated_at)
    }));
    
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

print('🎉 数据插入完成！');
EOF

# 执行MongoDB脚本
$MONGO_CLIENT temp_insert_script.js

# 清理临时文件
rm -f temp_insert_script.js

echo ""
echo "🎉 健康文章数据初始化流程完成！"
echo "=================================="
echo "📊 处理结果："
echo "   ✅ 图片已上传到阿里云OSS"
echo "   ✅ Excel数据已转换为JSON格式"
echo "   ✅ 数据已插入到MongoDB数据库"
echo ""
echo "📁 生成的文件："
echo "   - image_urls.json: 图片URL映射"
echo "   - health_articles_data.json: 文章数据"
echo ""
echo "🗄️  数据库信息："
echo "   - 数据库: elderdiet_dev"
echo "   - 集合: health_articles"
