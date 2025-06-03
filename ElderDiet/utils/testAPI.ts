import { healthAPI, authAPI } from '@/services/api';

export const runAPITests = async () => {
  console.log('🚀 开始API测试...');
  
  try {
    // 1. 测试健康检查
    console.log('1️⃣ 测试健康检查API...');
    const healthResponse = await healthAPI.check();
    console.log('✅ 健康检查成功:', healthResponse);
    
    // 2. 测试发送验证码
    // console.log('2️⃣ 测试发送验证码API...');
    // const smsResponse = await authAPI.sendSms('13800000001');
    // console.log('✅ 发送验证码成功:', smsResponse);
    
    // 3. 测试登录
    console.log('3️⃣ 测试登录API...');
    const loginResponse = await authAPI.login('13800000001', '000000');
    console.log('✅ 登录成功:', loginResponse);
    
    console.log('🎉 所有API测试通过！');
    return true;
  } catch (error) {
    console.error('❌ API测试失败:', error);
    return false;
  }
};

export const testBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await healthAPI.check();
    return response.success === true;
  } catch (error) {
    console.error('后端连接测试失败:', error);
    return false;
  }
}; 