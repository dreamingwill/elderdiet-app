#!/bin/bash

# 第二批健康文章数据完整处理脚本
# 包含图片上传、数据生成和数据库插入的完整流程

set -e  # 遇到错误立即退出

echo "🚀 开始第二批健康文章数据处理流程..."
echo "================================================"

# 检查当前目录
if [ ! -f "health_article_content_2/list.xlsx" ]; then
    echo "❌ 错误：请在DB目录下运行此脚本"
    echo "   当前目录应包含 health_article_content_2/list.xlsx 文件"
    exit 1
fi

# 检查环境变量
echo "🔍 检查阿里云OSS环境变量..."
if [ -z "$ALIYUN_OSS_ACCESS_KEY_ID" ] || [ -z "$ALIYUN_OSS_ACCESS_KEY_SECRET" ]; then
    echo "❌ 错误：请先设置阿里云OSS环境变量"
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
pip3 install pandas openpyxl oss2 pymongo --user

# 步骤1：上传第二批图片到OSS
echo ""
echo "📤 步骤1：上传第二批图片到阿里云OSS"
echo "================================================"

if [ -f "image_urls_batch2.json" ]; then
    echo "⚠️  发现已存在的第二批图片URL文件，是否重新上传？(y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "🔄 重新上传第二批图片..."
        python3 upload_images_to_oss_batch2.py
    else
        echo "📋 使用现有的第二批图片URL文件"
    fi
else
    echo "🆕 首次上传第二批图片..."
    python3 upload_images_to_oss_batch2.py
fi

# 检查上传结果
if [ ! -f "image_urls_batch2.json" ]; then
    echo "❌ 错误：第二批图片上传失败，未生成URL映射文件"
    exit 1
fi

echo "✅ 第二批图片上传完成"

# 步骤2：生成第二批文章数据
echo ""
echo "📝 步骤2：生成第二批文章数据"
echo "================================================"

echo "🔄 处理第二批Excel数据并生成JSON格式..."
python3 generate_health_articles_data_batch2.py

# 检查数据生成结果
if [ ! -f "health_articles_data_batch2.json" ]; then
    echo "❌ 错误：第二批数据生成失败，未生成JSON文件"
    exit 1
fi

echo "✅ 第二批文章数据生成完成"

# 步骤3：插入数据到数据库
echo ""
echo "🗄️  步骤3：插入第二批数据到数据库"
echo "================================================"

echo "🔧 数据库连接选项："
echo "   1. 本地MongoDB (localhost:27017)"
echo "   2. 远程MongoDB (服务器数据库)"
echo ""
echo "💡 提示：如果选择远程连接，请确保："
echo "   - 服务器MongoDB允许远程连接"
echo "   - 防火墙已开放27017端口"
echo "   - 已在脚本中配置正确的服务器IP"
echo ""

python3 insert_batch2_to_remote_db.py

echo ""
echo "🎉 第二批健康文章数据处理完成！"
echo "================================================"
echo "📊 处理结果："
echo "   ✅ 第二批图片已上传到阿里云OSS"
echo "   ✅ 第二批Excel数据已转换为JSON格式"
echo "   ✅ 第二批数据已插入到数据库"
echo ""
echo "📁 生成的文件："
echo "   - image_urls_batch2.json: 第二批图片URL映射"
echo "   - health_articles_data_batch2.json: 第二批文章数据"
echo ""
echo "🔍 验证数据："
echo "   可以通过MongoDB客户端查询验证："
echo "   db.health_articles.countDocuments()"
echo "   db.health_articles.find({is_featured: 1}).count()"
