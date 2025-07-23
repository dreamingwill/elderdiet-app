# 极光推送功能配置指南

## 概述

本项目已集成极光推送功能，支持以下特性：
- 老人发布膳食记录时自动推送给关联的子女用户
- 每日定时推送（12:30和18:30）提醒老人记录膳食
- 用户可自定义推送设置（开启/关闭不同类型的推送）
- 推送历史记录和统计功能

## 配置步骤

### 1. 极光控制台配置

#### 1.1 注册极光账号
1. 访问 [极光推送官网](https://www.jiguang.cn/)
2. 注册账号并登录控制台

#### 1.2 创建应用
1. 在控制台创建新应用
2. 应用名称：ElderDiet（或自定义）
3. 获取 `AppKey` 和 `Master Secret`

#### 1.3 Android配置
1. 添加Android平台
2. 包名：`com.zeroh12.ElderDiet`
3. 如需FCM支持，上传 `google-services.json`

#### 1.4 iOS配置（可选）
1. 添加iOS平台
2. Bundle ID：`com.zeroh12.ElderDiet`
3. 上传APNs证书（需要iOS开发者账号）

### 2. 环境变量配置

在服务器或开发环境中设置以下环境变量：

```bash
export JPUSH_APP_KEY="your-jpush-app-key"
export JPUSH_MASTER_SECRET="your-jpush-master-secret"
export JPUSH_ENVIRONMENT="dev"  # 或 "production"
```

### 3. 后端配置验证

启动后端服务后，检查日志确认JPush客户端初始化成功：
```
🚀 ElderDiet Backend Java 启动成功!
初始化JPush客户端，环境: dev
JPush客户端初始化成功
```

### 4. 前端配置

前端已自动配置，无需额外设置。应用启动时会：
1. 请求推送权限
2. 获取推送Token
3. 注册设备到后端

## 功能使用

### 推送触发场景

1. **膳食记录推送**
   - 老人发布膳食记录且可见性设置为"家庭可见"
   - 自动推送给所有关联的子女用户

2. **定时提醒推送**
   - 每日12:30：午餐提醒
   - 每日18:30：晚餐提醒
   - 只推送给启用提醒的老人用户

### 推送设置管理

用户可在"设置 > 推送通知"中管理：
- 总推送开关
- 膳食记录推送开关
- 定时提醒推送开关

### 测试功能

在"设置 > 推送测试"页面可以：
- 查看推送Token状态
- 手动触发测试推送
- 查看推送统计信息

## API接口

### 设备管理
- `POST /api/v1/devices/register` - 注册设备
- `GET /api/v1/devices` - 获取用户设备列表
- `PUT /api/v1/devices/{token}/settings` - 更新推送设置
- `DELETE /api/v1/devices/{token}` - 删除设备

### 推送管理
- `GET /api/v1/push/history` - 获取推送历史
- `GET /api/v1/push/statistics` - 获取推送统计
- `GET /api/v1/push/status` - 获取推送服务状态

### 测试接口
- `POST /api/v1/push/test/lunch-reminder` - 测试午餐提醒
- `POST /api/v1/push/test/dinner-reminder` - 测试晚餐提醒
- `GET /api/v1/push/test/statistics` - 获取测试统计

## 数据库集合

推送功能使用以下MongoDB集合：

1. **user_devices** - 用户设备信息
   - 存储设备Token、平台、推送设置等

2. **push_records** - 推送记录
   - 记录所有推送的详细信息和状态

3. **family_links** - 家庭关联关系
   - 用于确定推送目标用户

## 故障排除

### 常见问题

1. **推送Token获取失败**
   - 检查设备是否为真实设备（模拟器不支持推送）
   - 确认用户已授权推送权限
   - 检查网络连接

2. **推送发送失败**
   - 验证极光配置是否正确
   - 检查环境变量设置
   - 查看后端日志错误信息

3. **收不到推送**
   - 确认设备已注册且推送设置已开启
   - 检查应用是否在前台/后台
   - 验证推送内容是否符合平台规范

### 日志检查

后端关键日志位置：
- JPush客户端初始化：应用启动时
- 设备注册：`UserDeviceService`
- 推送发送：`JPushService`
- 定时任务：`PushSchedulerService`

## 生产环境部署

1. 设置正确的环境变量
2. 确保 `JPUSH_ENVIRONMENT=production`
3. 上传正确的iOS生产证书
4. 测试推送功能正常工作

## 注意事项

1. **iOS推送**：需要iOS开发者账号和正确的APNs证书
2. **推送频率**：避免过于频繁的推送，遵循平台规范
3. **用户体验**：提供清晰的推送设置选项
4. **隐私保护**：推送内容不应包含敏感信息
5. **错误处理**：推送失败时应有适当的重试机制

## 技术架构

```
前端 (React Native + Expo)
├── expo-notifications (推送接收)
├── pushService.ts (推送服务)
└── PushSettingsModal (设置界面)

后端 (Spring Boot + Java)
├── JPushService (推送发送)
├── UserDeviceService (设备管理)
├── PushSchedulerService (定时任务)
└── 相关Controller (API接口)

数据库 (MongoDB)
├── user_devices (设备信息)
├── push_records (推送记录)
└── family_links (家庭关系)
```

## 更新日志

- v1.0.0: 初始版本，支持基础推送功能
- 支持膳食记录推送和定时提醒
- 支持推送设置管理
- 支持推送历史和统计
