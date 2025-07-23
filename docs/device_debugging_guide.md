# 📱 真实设备调试完整指南

## 🚀 方法一：使用 Expo Development Build（推荐）

### 1. 安装 EAS CLI

```bash
npm install -g @expo/eas-cli
```

### 2. 登录 Expo 账号

```bash
eas login
```

### 3. 构建开发版本

```bash
# 进入前端目录
cd elderdiet-frontend

# 构建 Android 开发版本
eas build --profile development --platform android

# 如果是首次构建，会提示配置 eas.json
```

### 4. 在真实设备上安装

```bash
# 构建完成后，扫描二维码或从链接下载APK到手机安装
# 安装完成后启动开发服务器
expo start --dev-client
```

### 5. 查看日志

```bash
# 在终端查看日志
expo start --dev-client

# 或使用 React Native 调试工具
npx react-native log-android  # Android
npx react-native log-ios      # iOS
```

## 🔧 方法二：使用 Expo Go（限制较多）

### ⚠️ 注意：Expo Go 无法获取真实的推送 Token，仅用于基础 UI 测试

```bash
cd elderdiet-frontend
expo start

# 使用 Expo Go 扫描二维码
```

## 🛠 方法三：构建独立 APK（生产测试）

### 1. 配置构建环境

```bash
# 确保已安装 EAS CLI
npm install -g @expo/eas-cli
eas login
```

### 2. 更新 eas.json 配置

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      },
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3. 构建 APK

```bash
# 构建预览版本（APK格式）
eas build --profile preview --platform android
```

## 📱 调试步骤详解

### Step 1: 准备工作

```bash
# 1. 确保后端服务运行
cd elderdiet-backend-java
./mvnw spring-boot:run

# 2. 检查后端健康状态
curl http://localhost:3001/actuator/health

# 3. 确保极光配置正确
echo $JPUSH_APP_KEY
echo $JPUSH_MASTER_SECRET
```

### Step 2: 构建并安装应用

```bash
cd elderdiet-frontend

# 选择以下方式之一：

# 方式A: 开发构建
eas build --profile development --platform android
expo start --dev-client

# 方式B: 预览构建
eas build --profile preview --platform android
# 下载APK到设备安装
```

### Step 3: 查看实时日志

#### 终端日志

```bash
# 在 elderdiet-frontend 目录
expo start --dev-client

# 或单独查看原生日志
npx react-native log-android
```

#### Chrome 调试器

```bash
# 启动应用后，在应用中打开调试菜单
# Android: 摇晃设备或 adb shell input keyevent 82
# 选择 "Debug with Chrome"
```

#### Flipper 调试（推荐）

```bash
# 安装 Flipper
# https://fbflipper.com/

# 在应用中启用 Flipper
# 可以查看网络请求、日志、AsyncStorage等
```

### Step 4: 推送功能测试流程

#### 4.1 网络连通性测试

```bash
# 在应用中进入：设置 > 网络测试
# 查看以下测试结果：
# - 🇨🇳/🌍 网络环境检测
# - 📱 Expo推送服务连通性
# - 🔄 后端API连通性
```

#### 4.2 推送 Token 获取测试

```bash
# 在应用中进入：设置 > 推送测试
# 检查以下信息：
# - 📱 设备信息（必须显示"真实设备"）
# - 🔔 推送权限（必须显示"已授权"）
# - 🔑 推送Token状态（必须显示Token）
```

#### 4.3 推送发送测试

```bash
# 在推送测试页面：
# 1. 点击"测试午餐提醒"
# 2. 查看终端日志输出
# 3. 检查手机通知栏

# 后端日志检查：
cd elderdiet-backend-java
tail -f logs/application.log | grep -i push
```

## 🔍 日志查看详解

### 前端日志关键信息

```javascript
// 在 Chrome 控制台或终端查找：
🚀 开始初始化推送服务...
📱 检查推送权限...
🔔 推送权限状态: granted
🔑 获取推送Token...
✅ 推送Token获取成功: ExponentPushToken[...
📤 向后端注册设备...
✅ 设备注册成功
```

### 后端日志关键信息

```bash
# 查看后端日志
cd elderdiet-backend-java
tail -f logs/application.log

# 寻找这些日志：
初始化JPush客户端，环境: dev
JPush客户端初始化成功
用户 xxx 注册设备，Token: ExponentPushToken[...
设备注册成功: xxx
推送发送成功，消息ID: xxx
```

### Android 系统日志

```bash
# 查看 Android 系统日志
adb logcat | grep -i expo
adb logcat | grep -i notification
adb logcat | grep -i elderdiet
```

## 🐛 常见调试问题

### 1. 模拟器问题

```
❌ 错误: 推送Token获取失败
🔧 解决: 必须使用真实设备，模拟器无法获取推送Token
```

### 2. 权限问题

```
❌ 错误: 推送权限被拒绝
🔧 解决:
- 卸载应用重新安装
- 手动到设置中开启通知权限
- 检查设备的"请勿打扰"模式
```

### 3. 网络问题

```
❌ 错误: 无法访问Expo推送服务
🔧 解决:
- 切换到移动数据网络测试
- 使用VPN（如果在中国大陆）
- 检查防火墙设置
```

### 4. 后端连接问题

```
❌ 错误: 设备注册失败
🔧 解决:
- 检查后端服务是否运行
- 确认API地址配置正确
- 查看JWT Token是否有效
```

## 💡 调试技巧

### 1. 分步骤测试

```bash
# 第一步：测试网络连通性
打开应用 > 设置 > 网络测试 > 测试Expo推送服务

# 第二步：测试Token获取
设置 > 推送测试 > 查看Token状态

# 第三步：测试设备注册
推送测试 > 重新注册设备

# 第四步：测试推送发送
推送测试 > 测试午餐提醒
```

### 2. 日志对比

```bash
# 同时查看前端和后端日志
# 前端终端
expo start --dev-client

# 后端终端
tail -f logs/application.log | grep -i push

# 对比时间戳确认请求流程
```

### 3. 网络抓包（高级）

```bash
# 使用 Charles 或 Wireshark 抓包
# 查看到 exp.host 的网络请求
# 确认是否有网络阻断
```

## 🎯 成功标识

推送功能正常工作的标识：

✅ **设备信息显示真实设备**
✅ **推送权限已授权**  
✅ **推送 Token 成功获取**
✅ **设备注册到后端成功**
✅ **测试推送能收到通知**
✅ **后端日志显示推送发送成功**

如果以上 6 项都通过，说明推送功能完全正常！🎉
