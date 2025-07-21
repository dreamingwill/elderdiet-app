# 图片上传优化方案

## 问题分析

### 原始问题
1. **后端文件大小限制** - Spring Boot默认限制为1MB，大图片上传失败
2. **前端无压缩** - 直接上传原图，可能达到几MB甚至更大
3. **缺少验证** - 没有预先检查文件大小和格式
4. **用户体验差** - 上传失败时错误信息不明确

## 解决方案

### 1. 后端配置优化

#### 文件上传大小限制配置
```yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB      # 单个文件最大10MB
      max-request-size: 50MB   # 整个请求最大50MB
      file-size-threshold: 2KB # 文件写入磁盘的阈值
```

#### 后端压缩机制
- OSS服务已实现图片压缩（质量0.7）
- 支持JPEG、PNG、GIF、WEBP格式
- 自动生成唯一文件名

### 2. 前端压缩优化

#### 图片压缩配置
```typescript
const IMAGE_COMPRESSION_CONFIG = {
  maxWidth: 1200,      // 最大宽度
  maxHeight: 1200,     // 最大高度
  quality: 0.8,        // 压缩质量
  maxSizeKB: 500,      // 最大文件大小(KB)
};
```

#### 压缩流程
1. **尺寸压缩** - 超过1200x1200自动缩放
2. **质量压缩** - JPEG质量设为0.8
3. **格式统一** - 统一转换为JPEG格式
4. **大小验证** - 压缩后验证文件大小

### 3. 用户体验改进

#### 状态指示
- 压缩进度提示
- 按钮禁用状态
- 加载动画显示

#### 错误处理
- 文件大小超限提示
- 网络错误识别
- 格式不支持提示

## 技术实现

### 依赖库
```bash
npm install expo-image-manipulator
```

### 核心函数

#### 图片压缩
```typescript
const compressImage = async (uri: string): Promise<string> => {
  // 获取原图信息
  const imageInfo = await ImageManipulator.manipulateAsync(uri, []);
  
  // 计算压缩尺寸
  const ratio = Math.min(
    maxWidth / originalWidth,
    maxHeight / originalHeight
  );
  
  // 执行压缩
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: targetWidth, height: targetHeight } }],
    { compress: 0.8, format: SaveFormat.JPEG }
  );
  
  return compressed.uri;
};
```

#### 文件大小验证
```typescript
const validateFileSize = async (uri: string): Promise<boolean> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const sizeInKB = blob.size / 1024;
  
  return sizeInKB <= maxSizeKB;
};
```

## 性能优化

### 压缩效果
- **原图**: 通常2-8MB
- **压缩后**: 通常100-500KB
- **压缩比**: 80-95%

### 处理时间
- **单张图片**: 1-3秒
- **多张图片**: 并行处理
- **用户感知**: 有进度提示

## 兼容性

### 支持格式
- **输入**: JPG, PNG, GIF, WEBP
- **输出**: JPEG (统一格式)

### 平台支持
- iOS: ✅ 完全支持
- Android: ✅ 完全支持
- Web: ✅ 完全支持

## 测试建议

### 功能测试
1. 上传大图片（>5MB）验证压缩
2. 上传多张图片验证并行处理
3. 网络异常时的错误处理
4. 不同格式图片的兼容性

### 性能测试
1. 压缩时间测试
2. 内存使用监控
3. 网络传输效率
4. 用户体验评估

## 监控指标

### 关键指标
- 压缩成功率
- 平均压缩时间
- 文件大小减少比例
- 上传成功率

### 错误监控
- 压缩失败次数
- 上传失败原因
- 网络超时频率
- 用户取消操作
