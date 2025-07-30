const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

const JPUSH_APP_KEY = 'fe2833d9f5871fd5f212dc84';

const withJPush = (config) => {
  console.log('🔧 配置JPush Config Plugin (iOS & Android)...');
  
  // 配置iOS Info.plist
  config = withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;
    
    // 确保infoPlist对象存在
    if (infoPlist) {
      // 添加JPush配置
      infoPlist.JPUSH_APPKEY = JPUSH_APP_KEY;
      infoPlist.JPUSH_CHANNEL = 'developer-default';
      
      console.log(`✅ 配置JPush for iOS with AppKey: ${JPUSH_APP_KEY}`);
    } else {
      console.warn('⚠️ Info.plist对象不存在，跳过iOS配置');
    }
    
    return config;
  });
  
  // 配置Android AndroidManifest.xml
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
    
    console.log(`✅ 配置JPush for Android with AppKey: ${JPUSH_APP_KEY}`);
    return config;
  });

  console.log('✅ JPush Config Plugin配置完成 (iOS & Android)');
  return config;
};

module.exports = withJPush; 