// MongoDB健康文章数据初始化脚本
// 从Excel数据和OSS图片URL生成并插入健康文章数据到数据库

// 使用elderdiet_dev数据库
db = db.getSiblingDB('elderdiet_dev');

print('🚀 开始初始化健康文章数据...');

// 检查是否存在health_articles集合
try {
  const existingCount = db.health_articles.countDocuments();
  if (existingCount > 0) {
    print(`⚠️  数据库中已存在 ${existingCount} 条健康文章数据`);
    print('是否要清空现有数据？(y/N)');
    // 在实际使用时，可以根据需要决定是否清空
    // db.health_articles.deleteMany({});
    // print('✅ 已清空现有数据');
  }
} catch (error) {
  print('❌ 检查现有数据时出错:', error);
}

// 创建健康文章集合和索引
try {
  // 确保集合存在
  db.createCollection('health_articles');
  
  // 创建必要的索引
  db.health_articles.createIndex({ "category": 1 });
  db.health_articles.createIndex({ "status": 1 });
  db.health_articles.createIndex({ "is_featured": 1 });
  db.health_articles.createIndex({ "is_carousel": 1 });
  db.health_articles.createIndex({ "created_at": -1 });
  db.health_articles.createIndex({ "tags": 1 });
  
  print('✅ 健康文章集合和索引创建成功');
  
} catch (error) {
  print('❌ 创建集合和索引时出错:', error);
}

// 注意：这里需要手动插入从Python脚本生成的数据
// 实际使用时，需要先运行以下步骤：
// 1. 配置并运行 upload_images_to_oss.py 上传图片到OSS
// 2. 运行 generate_health_articles_data.py 生成JSON数据
// 3. 将生成的JSON数据复制到下面的articles数组中

print('📝 请按以下步骤操作：');
print('1. 编辑 upload_images_to_oss.py 中的OSS配置信息');
print('2. 运行: python3 upload_images_to_oss.py');
print('3. 运行: python3 generate_health_articles_data.py');
print('4. 将生成的 health_articles_data.json 内容复制到此脚本中');
print('5. 重新运行此脚本完成数据插入');

// 示例数据结构（实际使用时替换为生成的数据）
const sampleArticles = [
  {
    title: "示例文章标题",
    subtitle: "示例副标题",
    category: "健康养生",
    content: {
      paragraphs: [
        {
          type: "text",
          content: "这是示例文本内容...",
          order: 1
        },
        {
          type: "image",
          url: "https://your-oss-domain.com/health-articles/images/fig_1.jpg",
          caption: "示例图片说明",
          altText: "示例图片描述",
          order: 2
        }
      ]
    },
    read_time: 3,
    tags: ["健康", "养生", "营养"],
    cover_image: "https://your-oss-domain.com/health-articles/images/fig_1.jpg",
    status: 1,
    is_featured: 1,
    is_carousel: 1,
    carousel_order: 1,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01")
  }
];

// 插入数据的函数
function insertHealthArticles(articles) {
  try {
    if (!articles || articles.length === 0) {
      print('❌ 没有要插入的文章数据');
      return;
    }
    
    // 处理日期字段
    const processedArticles = articles.map(article => {
      return {
        ...article,
        created_at: new Date(article.created_at),
        updated_at: new Date(article.updated_at)
      };
    });
    
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
  }
}

// 检查是否存在生成的数据文件
const fs = require('fs');
const path = require('path');

function loadGeneratedData() {
  const dataFile = 'health_articles_data.json';

  try {
    if (fs.existsSync(dataFile)) {
      const rawData = fs.readFileSync(dataFile, 'utf8');
      const articles = JSON.parse(rawData);
      print(`📖 成功加载 ${articles.length} 条文章数据`);
      return articles;
    } else {
      print(`❌ 数据文件不存在: ${dataFile}`);
      print('请先运行数据生成脚本');
      return null;
    }
  } catch (error) {
    print(`❌ 读取数据文件时出错: ${error}`);
    return null;
  }
}

// 尝试加载并插入真实数据
const generatedArticles = loadGeneratedData();
if (generatedArticles && generatedArticles.length > 0) {
  insertHealthArticles(generatedArticles);
} else {
  print('⚠️  未找到生成的数据，插入示例数据用于测试');
  insertHealthArticles(sampleArticles);
}

print('🎉 健康文章数据初始化完成！');
