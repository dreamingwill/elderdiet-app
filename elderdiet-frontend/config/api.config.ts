// API配置文件
export const API_CONFIG = {
  // 开发环境
  development: {
    //baseURL: 'http://localhost:3001/api/v1',
    baseURL: 'http://8.153.204.247:3001/api/v1',
    timeout: 10000,
  },
  // 生产环境 - HTTP (临时)
  production: {
    baseURL: 'http://8.153.204.247:3001/api/v1',
    timeout: 15000,
  },
  // 生产环境 - HTTPS (推荐)
  productionSecure: {
    baseURL: 'https://api.elderdiet.me/api/v1',
    timeout: 15000,
  },
};

// 根据环境选择配置
const getEnvironment = () => {
  if (__DEV__) {
    return 'development';
  }
  return 'production'; // 可以改为 'productionSecure' 当HTTPS可用时
};

export const getCurrentConfig = () => {
  const env = getEnvironment();
  return API_CONFIG[env];
};

export const API_BASE_URL = getCurrentConfig().baseURL;
export const API_TIMEOUT = getCurrentConfig().timeout; 