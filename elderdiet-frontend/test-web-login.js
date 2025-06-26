// 测试Web端登录功能
// 在浏览器控制台中运行此脚本

// 测试localStorage功能
console.log('🧪 测试localStorage功能...');
try {
  // 测试设置
  localStorage.setItem('test_key', 'test_value');
  console.log('✅ localStorage.setItem 成功');
  
  // 测试获取
  const value = localStorage.getItem('test_key');
  console.log('✅ localStorage.getItem 成功，值:', value);
  
  // 测试删除
  localStorage.removeItem('test_key');
  console.log('✅ localStorage.removeItem 成功');
  
  console.log('🎉 localStorage功能测试通过！');
} catch (error) {
  console.error('❌ localStorage测试失败:', error);
}

// 测试API连接
console.log('\n🧪 测试API连接...');
const API_BASE_URL = 'http://30.71.181.219:3001/api/v1';

fetch(`${API_BASE_URL}/health`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ API连接成功:', data);
    
    // 测试登录API
    console.log('\n🧪 测试登录API...');
    return fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '13800138000',
        password: 'password123'
      })
    });
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('✅ 登录API测试成功:', data);
      
      // 测试token存储
      console.log('\n🧪 测试token存储...');
      localStorage.setItem('userToken', data.data.token);
      localStorage.setItem('userRole', data.data.role);
      localStorage.setItem('userUid', data.data.uid);
      localStorage.setItem('userPhone', data.data.phone);
      
      console.log('✅ 用户数据存储成功');
      console.log('Token:', localStorage.getItem('userToken'));
      console.log('Role:', localStorage.getItem('userRole'));
      console.log('UID:', localStorage.getItem('userUid'));
      console.log('Phone:', localStorage.getItem('userPhone'));
    } else {
      console.log('ℹ️ 登录失败（可能用户不存在）:', data.message);
    }
  })
  .catch(error => {
    console.error('❌ API测试失败:', error);
  });

console.log('\n📝 测试说明:');
console.log('1. 在浏览器中打开 http://localhost:8081');
console.log('2. 打开开发者工具（F12）');
console.log('3. 在控制台中粘贴并运行此脚本');
console.log('4. 查看测试结果');
console.log('5. 如果所有测试通过，尝试在应用中登录'); 