# JPush 紧急修复指南

## 🚨 问题现状

即使在 Development Build 中，JPush 仍然报错：

```
TypeError: Cannot read property 'setDebugMode' of null
```

## ⚡ 紧急解决方案

### 方案 A：使用简化推送服务（立即可用）

临时禁用 JPush，使用工作正常的简化推送服务：

```typescript
// services/pushService.ts 临时修改
private useJPush = false; // 临时改为false
```

这样可以立即恢复推送功能，虽然不是真正的 JPush，但能让基本的推送流程工作。

### 方案 B：重新构建带 JPush Config Plugin 的 APK

1. **我已经添加了 JPush Config Plugin**：

   - 创建了 `jpush-plugin.js`
   - 更新了 `app.config.js`

2. **重新构建 APK**：

```bash
# 清除缓存并重新构建
eas build --profile development --platform android --clear-cache
```

3. **等待构建完成并测试**

## 🔧 当前已完成的修复

### 1. JPush Config Plugin

- ✅ 自动配置 AndroidManifest.xml
- ✅ 添加 JPush 权限和组件
- ✅ 配置 build.gradle 依赖
- ✅ 初始化 MainApplication.java

### 2. ProGuard 规则

- ✅ 添加 JPush 混淆保护规则

### 3. 应用配置

- ✅ 正确的 AppKey 配置
- ✅ 包名匹配

## 📋 测试验证

重新构建后，您应该看到：

```
✅ JPush SDK在Development Build中可用
📱 使用JPush获取Registration ID...
✅ JPush RegistrationId获取成功: 1a0018970a8fed...
```

而不是：

```
❌ JPush SDK存在但无法调用，可能在Expo Go中运行
```

## 🎯 推荐行动

### 立即行动（5 分钟）：

```typescript
// 临时修改 services/pushService.ts
private useJPush = false;
```

这样可以立即使用简化推送服务恢复功能。

### 完整解决方案（20 分钟）：

```bash
# 重新构建APK
eas build --profile development --platform android --clear-cache
```

安装新 APK 后 JPush 应该能正常工作。

## 💡 为什么之前不工作？

JPush 是原生模块，需要：

1. ✅ 原生依赖（已有）
2. ❌ AndroidManifest.xml 配置（之前缺失）
3. ❌ build.gradle 依赖（之前缺失）
4. ❌ MainApplication.java 初始化（之前缺失）

现在通过 Config Plugin 自动配置了所有缺失的部分！
