const { withAndroidManifest } = require('@expo/config-plugins');

const JPUSH_APP_KEY = 'fe2833d9f5871fd5f212dc84';

const withJPush = (config) => {
  console.log('🔧 配置JPush Config Plugin...');
  
  // 只需要添加JPush的meta-data配置，其他的jpush-react-native包已经提供
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];
    
    // 添加JPush的meta-data
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }
    
    const jpushAppKey = {
      $: {
        'android:name': 'JPUSH_APPKEY',
        'android:value': JPUSH_APP_KEY
      }
    };
    
    const jpushChannel = {
      $: {
        'android:name': 'JPUSH_CHANNEL',
        'android:value': 'developer-default'
      }
    };
    
    // 检查并添加meta-data
    const existingAppKey = application['meta-data'].find(
      m => m.$['android:name'] === 'JPUSH_APPKEY'
    );
    if (!existingAppKey) {
      application['meta-data'].push(jpushAppKey);
    }
    
    const existingChannel = application['meta-data'].find(
      m => m.$['android:name'] === 'JPUSH_CHANNEL'
    );
    if (!existingChannel) {
      application['meta-data'].push(jpushChannel);
    }
    
    console.log('✅ 仅添加JPush meta-data配置，其他配置由jpush-react-native包提供');
    return config;
  });

  console.log('✅ JPush Config Plugin配置完成');
  return config;
};

module.exports = withJPush; 