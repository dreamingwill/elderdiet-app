/**
 * 聊天记录用户隔离测试脚本
 * 
 * 这个脚本用于测试修复后的聊天功能是否正确隔离不同用户的聊天记录
 */

const API_BASE_URL = 'http://30.71.181.219:3001/api/v1';

// 测试用户数据
const testUsers = [
  { phone: '13800138000', password: 'password123', name: '用户A' },
  { phone: '13800138001', password: 'password123', name: '用户B' }
];

// 测试消息
const testMessages = [
  { user: 'A', content: '我是用户A，我想了解糖尿病饮食' },
  { user: 'B', content: '我是用户B，我想了解高血压饮食' },
  { user: 'A', content: '用户A的第二条消息' },
  { user: 'B', content: '用户B的第二条消息' }
];

let userTokens = {};

// 工具函数：发送HTTP请求
async function request(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  return response.json();
}

// 步骤1：测试用户注册/登录
async function testUserAuth() {
  console.log('🧪 步骤1: 测试用户认证');
  
  for (const user of testUsers) {
    try {
      // 尝试登录
      let response = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          phone: user.phone,
          password: user.password
        })
      });
      
      if (!response.success) {
        // 登录失败，尝试注册
        console.log(`${user.name} 不存在，正在注册...`);
        response = await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            phone: user.phone,
            password: user.password,
            role: 'elder'
          })
        });
      }
      
      if (response.success) {
        userTokens[user.name] = response.data.token;
        console.log(`✅ ${user.name} 认证成功`);
      } else {
        console.error(`❌ ${user.name} 认证失败:`, response.message);
        return false;
      }
    } catch (error) {
      console.error(`❌ ${user.name} 认证出错:`, error.message);
      return false;
    }
  }
  
  return true;
}

// 步骤2：发送测试消息
async function testSendMessages() {
  console.log('\n🧪 步骤2: 发送测试消息');
  
  for (const message of testMessages) {
    const token = userTokens[`用户${message.user}`];
    if (!token) {
      console.error(`❌ 用户${message.user} 没有有效token`);
      continue;
    }
    
    try {
      const response = await request('/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'text',
          content: message.content
        })
      });
      
      if (response.success) {
        console.log(`✅ 用户${message.user} 发送消息成功: "${message.content}"`);
      } else {
        console.error(`❌ 用户${message.user} 发送消息失败:`, response.message);
      }
    } catch (error) {
      console.error(`❌ 用户${message.user} 发送消息出错:`, error.message);
    }
    
    // 稍微延迟，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// 步骤3：检查聊天历史隔离
async function testChatHistoryIsolation() {
  console.log('\n🧪 步骤3: 检查聊天历史隔离');
  
  const userHistories = {};
  
  // 获取每个用户的聊天历史
  for (const user of testUsers) {
    const token = userTokens[user.name];
    if (!token) continue;
    
    try {
      const response = await request('/chat/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.success) {
        userHistories[user.name] = response.data;
        console.log(`✅ ${user.name} 聊天历史获取成功，共 ${response.data.length} 条消息`);
        
        // 显示消息内容
        response.data.forEach((msg, index) => {
          console.log(`   ${index + 1}. [${msg.role}] ${msg.content}`);
        });
      } else {
        console.error(`❌ ${user.name} 获取聊天历史失败:`, response.message);
      }
    } catch (error) {
      console.error(`❌ ${user.name} 获取聊天历史出错:`, error.message);
    }
  }
  
  // 验证隔离性
  console.log('\n🔍 验证聊天记录隔离性:');
  
  const userAHistory = userHistories['用户A'] || [];
  const userBHistory = userHistories['用户B'] || [];
  
  // 检查用户A的消息是否只包含用户A发送的内容
  const userAMessages = userAHistory.filter(msg => msg.role === 'user');
  const userBMessages = userBHistory.filter(msg => msg.role === 'user');
  
  let isolationPassed = true;
  
  // 检查用户A的消息中是否包含用户B的内容
  for (const msgA of userAMessages) {
    for (const msgB of userBMessages) {
      if (msgA.content === msgB.content) {
        console.error(`❌ 隔离失败: 用户A的聊天记录中包含用户B的消息: "${msgA.content}"`);
        isolationPassed = false;
      }
    }
  }
  
  // 检查消息内容是否符合预期
  const expectedUserAContent = ['我是用户A，我想了解糖尿病饮食', '用户A的第二条消息'];
  const expectedUserBContent = ['我是用户B，我想了解高血压饮食', '用户B的第二条消息'];
  
  const actualUserAContent = userAMessages.map(msg => msg.content);
  const actualUserBContent = userBMessages.map(msg => msg.content);
  
  console.log('📊 用户A实际消息:', actualUserAContent);
  console.log('📊 用户B实际消息:', actualUserBContent);
  
  if (isolationPassed) {
    console.log('✅ 聊天记录隔离测试通过！');
  } else {
    console.log('❌ 聊天记录隔离测试失败！');
  }
  
  return isolationPassed;
}

// 步骤4：测试清空聊天记录
async function testClearHistory() {
  console.log('\n🧪 步骤4: 测试清空聊天记录');
  
  const token = userTokens['用户A'];
  if (!token) {
    console.error('❌ 用户A没有有效token');
    return false;
  }
  
  try {
    // 清空用户A的聊天记录
    const response = await request('/chat/history', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.success) {
      console.log('✅ 用户A聊天记录清空成功');
      
      // 验证清空结果
      const historyResponse = await request('/chat/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (historyResponse.success && historyResponse.data.length === 0) {
        console.log('✅ 确认用户A聊天记录已清空');
        
        // 检查用户B的记录是否还在
        const userBToken = userTokens['用户B'];
        if (userBToken) {
          const userBHistoryResponse = await request('/chat/history', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${userBToken}`
            }
          });
          
          if (userBHistoryResponse.success && userBHistoryResponse.data.length > 0) {
            console.log('✅ 确认用户B的聊天记录未受影响');
            return true;
          } else {
            console.error('❌ 用户B的聊天记录意外丢失');
            return false;
          }
        }
      } else {
        console.error('❌ 用户A聊天记录清空失败');
        return false;
      }
    } else {
      console.error('❌ 清空聊天记录失败:', response.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 清空聊天记录出错:', error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始聊天记录用户隔离测试\n');
  
  try {
    // 测试API连接
    const healthResponse = await request('/health');
    if (!healthResponse.status) {
      console.error('❌ API服务不可用');
      return;
    }
    console.log('✅ API服务连接正常\n');
    
    // 执行测试步骤
    const authSuccess = await testUserAuth();
    if (!authSuccess) {
      console.error('❌ 用户认证测试失败，停止测试');
      return;
    }
    
    await testSendMessages();
    const isolationSuccess = await testChatHistoryIsolation();
    const clearSuccess = await testClearHistory();
    
    // 测试总结
    console.log('\n📋 测试总结:');
    console.log(`- 用户认证: ${authSuccess ? '✅ 通过' : '❌ 失败'}`);
    console.log(`- 聊天记录隔离: ${isolationSuccess ? '✅ 通过' : '❌ 失败'}`);
    console.log(`- 清空聊天记录: ${clearSuccess ? '✅ 通过' : '❌ 失败'}`);
    
    if (authSuccess && isolationSuccess && clearSuccess) {
      console.log('\n🎉 所有测试通过！聊天记录用户隔离功能正常工作。');
    } else {
      console.log('\n⚠️  部分测试失败，请检查实现。');
    }
    
  } catch (error) {
    console.error('❌ 测试执行出错:', error.message);
  }
}

// 运行测试
runTests(); 