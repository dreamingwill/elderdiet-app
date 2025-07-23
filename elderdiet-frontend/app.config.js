// 从app.json读取基础配置
const config = require('./app.json');

// 添加额外的Android配置
module.exports = {
  ...config.expo,
  android: {
    ...config.expo.android,
  },
  // 使用插件来处理网络安全配置
  plugins: [
    ...config.expo.plugins,
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: true,
          extraProguardRules: `
            # 允许HTTP流量
            -keepclassmembers class * {
                @android.webkit.JavascriptInterface <methods>;
            }
          `
        }
      }
    ]
  ],
  // 配置EAS构建
  extra: {
    ...config.expo.extra,
    eas: {
      ...config.expo.extra?.eas,
      projectId: "36ea1d9a-f68a-4445-a8fa-c22c49972703"
    }
  }
}; 