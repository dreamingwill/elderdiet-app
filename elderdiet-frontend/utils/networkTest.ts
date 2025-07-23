/**
 * 网络连通性测试工具
 * 用于检查Expo推送服务在中国大陆的可用性
 */

export interface NetworkTestResult {
  success: boolean;
  service: string;
  responseTime?: number;
  error?: string;
}

/**
 * 带超时的fetch请求
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 测试Expo推送服务连通性
 */
export async function testExpoPushService(): Promise<NetworkTestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🌐 测试Expo推送服务连通性...');
    
    // 测试Expo API端点
    const response = await fetchWithTimeout('https://exp.host/--/api/v2/push/getReceiptIds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: ['test-id'],
      }),
    }, 10000); // 10秒超时

    const responseTime = Date.now() - startTime;
    
    if (response.status < 500) {
      // 即使返回错误，但能连通就说明网络OK
      console.log('✅ Expo推送服务连通正常');
      return {
        success: true,
        service: 'Expo Push Service',
        responseTime,
      };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error('❌ Expo推送服务连通失败:', error);
    
    return {
      success: false,
      service: 'Expo Push Service',
      responseTime,
      error: error.message || '连接失败',
    };
  }
}

/**
 * 测试后端API连通性
 */
export async function testBackendAPI(baseUrl: string): Promise<NetworkTestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🌐 测试后端API连通性...');
    
    const response = await fetchWithTimeout(`${baseUrl}/actuator/health`, {}, 5000);
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      console.log('✅ 后端API连通正常');
      return {
        success: true,
        service: 'Backend API',
        responseTime,
      };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error('❌ 后端API连通失败:', error);
    
    return {
      success: false,
      service: 'Backend API',
      responseTime,
      error: error.message || '连接失败',
    };
  }
}

/**
 * 综合网络测试
 */
export async function runNetworkTests(backendUrl: string): Promise<NetworkTestResult[]> {
  console.log('🚀 开始网络连通性测试...');
  
  const results = await Promise.all([
    testExpoPushService(),
    testBackendAPI(backendUrl),
  ]);
  
  console.log('📊 网络测试结果:', results);
  return results;
}

/**
 * 检查是否在中国大陆网络环境
 */
export async function detectChinaNetwork(): Promise<boolean> {
  try {
    // 尝试访问Google DNS，如果失败可能在中国大陆
    await fetchWithTimeout('https://8.8.8.8/', { method: 'HEAD' }, 3000);
    return false; // 能访问Google DNS，不在中国大陆限制网络
  } catch {
    try {
      // 尝试访问百度，如果成功可能在中国大陆
      await fetchWithTimeout('https://www.baidu.com/', { method: 'HEAD' }, 3000);
      return true; // 能访问百度但不能访问Google，可能在中国大陆
    } catch {
      return false; // 都访问不了，网络问题
    }
  }
} 