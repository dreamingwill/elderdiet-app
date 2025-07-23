// 测试推送服务配置
const fetch = require('node-fetch');

const API_BASE_URL = 'http://8.153.204.247:3001/api/v1';

// 模拟设备注册数据（使用真实的JPush格式）
const mockDeviceData = {
  deviceToken: 'simple_push_android_test123456', // 简化推送服务生成的Token
  platform: 'ANDROID',
  deviceModel: 'Test Device',
  appVersion: '1.0.0',
  pushEnabled: true,
  mealRecordPushEnabled: true,
  reminderPushEnabled: true
};

// 测试用户数据
const testUser = {
  phone: '13600136000',
  password: '123456'
};

async function testPushService() {
  console.log('🔄 测试推送服务配置...');
  console.log('API_BASE_URL:', API_BASE_URL);
  
  try {
    // 1. 测试健康检查
    console.log('\n1. 测试健康检查:');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ 健康检查成功:', healthData);
    } else {
      console.log('❌ 健康检查失败:', healthResponse.status);
    }
    
    // 2. 测试用户注册（如果需要）
    console.log('\n2. 测试用户注册:');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '13800138999',
        password: '123456',
        role: 'ELDER'
      })
    });
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ 用户注册成功:', registerData);
    } else {
      const errorText = await registerResponse.text();
      console.log('⚠️ 用户注册失败（可能已存在）:', registerResponse.status, errorText);
    }
    
    // 3. 测试用户登录
    console.log('\n3. 测试用户登录:');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: testUser.phone,
        password: testUser.password
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ 用户登录失败:', loginResponse.status);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ 用户登录成功');
    const authToken = loginData.data.token;
    
    // 4. 测试设备注册
    console.log('\n4. 测试设备注册:');

    // 打印详细的请求信息
    console.log('请求URL:', `${API_BASE_URL}/devices/register`);
    console.log('请求头:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken.substring(0, 20)}...`
    });
    console.log('请求体:', JSON.stringify(mockDeviceData, null, 2));

    const deviceResponse = await fetch(`${API_BASE_URL}/devices/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(mockDeviceData)
    });
    
    if (deviceResponse.ok) {
      const deviceData = await deviceResponse.json();
      console.log('✅ 设备注册成功:', deviceData);
    } else {
      const errorText = await deviceResponse.text();
      console.log('❌ 设备注册失败:', deviceResponse.status, errorText);
    }
    
    // 5. 测试获取设备列表
    console.log('\n5. 测试获取设备列表:');
    const devicesResponse = await fetch(`${API_BASE_URL}/api/v1/devices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });
    
    if (devicesResponse.ok) {
      const devicesData = await devicesResponse.json();
      console.log('✅ 获取设备列表成功:', devicesData);
    } else {
      const errorText = await devicesResponse.text();
      console.log('❌ 获取设备列表失败:', devicesResponse.status, errorText);
    }
    
    console.log('\n🎉 推送服务测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testPushService();
