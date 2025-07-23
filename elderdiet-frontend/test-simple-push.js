// 测试简化推送服务的Token生成
const crypto = require('crypto');

// 模拟设备信息
const mockDeviceInfo = {
  platform: 'android',
  model: 'Test Device',
  osVersion: '12',
  brand: 'Test Brand',
  timestamp: Date.now()
};

// 简单哈希函数（与前端一致）
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// 生成设备Token
function generateDeviceToken() {
  const deviceString = JSON.stringify(mockDeviceInfo);
  const hash = simpleHash(deviceString);
  const token = `simple_push_${mockDeviceInfo.platform}_${hash}`;
  
  console.log('🔍 设备信息:', deviceString);
  console.log('🔑 生成的Token:', token);
  console.log('📏 Token长度:', token.length);
  
  return token;
}

// 测试设备注册数据
function testDeviceRegistration() {
  const token = generateDeviceToken();
  
  const deviceData = {
    deviceToken: token,
    platform: 'ANDROID',
    deviceModel: 'Test Device',
    appVersion: '1.0.0',
    pushEnabled: true,
    mealRecordPushEnabled: true,
    reminderPushEnabled: true
  };
  
  console.log('\n📋 设备注册数据:');
  console.log(JSON.stringify(deviceData, null, 2));
  
  // 验证数据完整性
  console.log('\n✅ 数据验证:');
  console.log('- deviceToken存在:', !!deviceData.deviceToken);
  console.log('- deviceToken非空:', deviceData.deviceToken !== '');
  console.log('- platform有效:', ['ANDROID', 'IOS'].includes(deviceData.platform));
  
  return deviceData;
}

// 运行测试
console.log('🧪 测试简化推送服务Token生成\n');
testDeviceRegistration();
