// 测试前端API配置
const fetch = require('node-fetch');

const API_BASE_URL = 'http://30.71.181.219:3001/api/v1';

async function testAPI() {
  console.log('🔄 测试前端API配置...');
  console.log('API_BASE_URL:', API_BASE_URL);
  
  try {
    // 测试健康检查
    console.log('\n1. 测试健康检查:');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ 健康检查成功:', healthData);
    
    // 测试注册
    console.log('\n2. 测试用户注册:');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '13800138001',
        password: '123456',
        role: 'elder'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('✅ 注册测试结果:', registerData);
    
    if (registerData.success) {
      // 测试登录
      console.log('\n3. 测试用户登录:');
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '13800138001',
          password: '123456'
        })
      });
      
      const loginData = await loginResponse.json();
      console.log('✅ 登录测试结果:', loginData);
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
  }
}

testAPI(); 