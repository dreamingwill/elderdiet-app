import { API_BASE_URL } from '@/config/api.config';

export interface NetworkTestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export const testNetworkConnection = async (): Promise<NetworkTestResult> => {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('Testing network connection to:', API_BASE_URL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: '网络连接正常',
        details: {
          status: response.status,
          statusText: response.statusText,
          data,
          baseURL: API_BASE_URL,
        },
        timestamp,
      };
    } else {
      return {
        success: false,
        message: `服务器响应错误: ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          baseURL: API_BASE_URL,
        },
        timestamp,
      };
    }
  } catch (error: any) {
    let message = '网络连接失败';
    
    if (error.name === 'AbortError') {
      message = '请求超时';
    } else if (error.message) {
      message = error.message;
    }
    
    return {
      success: false,
      message,
      details: {
        error: error.toString(),
        name: error.name,
        baseURL: API_BASE_URL,
      },
      timestamp,
    };
  }
};

export const testMultipleEndpoints = async (): Promise<NetworkTestResult[]> => {
  const endpoints = [
    '/health',
    '/auth/test',
    '/user/profile',
  ];
  
  const results: NetworkTestResult[] = [];
  
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      results.push({
        success: response.ok,
        message: `${endpoint}: ${response.status} ${response.statusText}`,
        details: {
          endpoint,
          status: response.status,
          statusText: response.statusText,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      results.push({
        success: false,
        message: `${endpoint}: ${error.message || 'Unknown error'}`,
        details: {
          endpoint,
          error: error.toString(),
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  return results;
}; 