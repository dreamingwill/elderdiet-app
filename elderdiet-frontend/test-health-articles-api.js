// 测试养生文章API
//const API_BASE_URL = 'http://8.153.204.247:3001/api/v1';
const API_BASE_URL = 'http://localhost:3001/api/v1';
async function testHealthArticlesAPI() {
  console.log('🧪 开始测试养生文章API...\n');

  try {
    // 测试1: 获取文章列表
    console.log('📝 测试1: 获取文章列表');
    const articlesResponse = await fetch(`${API_BASE_URL}/health-articles`);
    const articlesData = await articlesResponse.json();
    console.log('状态码:', articlesResponse.status);
    console.log('响应数据:', JSON.stringify(articlesData, null, 2));
    console.log('');

    // 测试2: 获取轮播图文章
    console.log('🖼️ 测试2: 获取轮播图文章');
    const carouselResponse = await fetch(`${API_BASE_URL}/health-articles/carousel`);
    const carouselData = await carouselResponse.json();
    console.log('状态码:', carouselResponse.status);
    console.log('响应数据:', JSON.stringify(carouselData, null, 2));
    console.log('');

    // 测试3: 获取推荐文章
    console.log('⭐ 测试3: 获取推荐文章');
    const featuredResponse = await fetch(`${API_BASE_URL}/health-articles/featured?limit=5`);
    const featuredData = await featuredResponse.json();
    console.log('状态码:', featuredResponse.status);
    console.log('响应数据:', JSON.stringify(featuredData, null, 2));
    console.log('');

    // 测试4: 获取文章分类
    console.log('📂 测试4: 获取文章分类');
    const categoriesResponse = await fetch(`${API_BASE_URL}/health-articles/categories`);
    const categoriesData = await categoriesResponse.json();
    console.log('状态码:', categoriesResponse.status);
    console.log('响应数据:', JSON.stringify(categoriesData, null, 2));
    console.log('');

    console.log('✅ API测试完成！');

  } catch (error) {
    console.error('❌ API测试失败:', error);
  }
}

// 运行测试
testHealthArticlesAPI(); 