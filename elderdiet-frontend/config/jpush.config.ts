// JPush配置文件
export const JPUSH_CONFIG = {
  // 开发环境
  development: {
    appKey: 'fe2833d9f5871fd5f212dc84', // 请替换为JPush控制台的AppKey
    channel: 'developer-default',
    production: false,
  },
  // 生产环境
  production: {
    appKey: 'fe2833d9f5871fd5f212dc84', // 请替换为JPush控制台的AppKey
    channel: 'official',
    production: true,
  },
};

// 根据环境选择配置
const getEnvironment = () => {
  if (__DEV__) {
    return 'development';
  }
  return 'production';
};

export const getCurrentJPushConfig = () => {
  const env = getEnvironment();
  return JPUSH_CONFIG[env];
};

export const JPUSH_APP_KEY = getCurrentJPushConfig().appKey;
export const JPUSH_CHANNEL = getCurrentJPushConfig().channel;
export const JPUSH_PRODUCTION = getCurrentJPushConfig().production;
