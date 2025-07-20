# 健康文章数据初始化指南

本目录包含了从Excel数据生成健康文章并导入数据库的完整脚本。

## 📁 文件说明

- `upload_images_to_oss.py` - 阿里云OSS图片上传脚本
- `generate_health_articles_data.py` - Excel数据转换为JSON格式脚本
- `init_health_articles_from_excel.js` - MongoDB数据插入脚本
- `run_health_articles_init_from_excel.sh` - 完整流程执行脚本
- `analyze_excel.py` - Excel数据结构分析脚本

## 🚀 快速开始

### 前置条件

1. **Python 3** 环境
2. **MongoDB** 数据库和客户端 (mongosh 或 mongo)
3. **阿里云OSS** 账号和配置信息

### 步骤1：配置阿里云OSS

编辑 `upload_images_to_oss.py` 文件，填入你的OSS配置：

```python
OSS_CONFIG = {
    "access_key_id": "你的AccessKey ID",
    "access_key_secret": "你的AccessKey Secret", 
    "endpoint": "https://oss-cn-hangzhou.aliyuncs.com",  # 你的OSS地域
    "bucket_name": "你的存储桶名称",
    "path_prefix": "health-articles/images/"  # 图片存储路径
}
```

### 步骤2：执行完整流程

在DB目录下运行：

```bash
./run_health_articles_init_from_excel.sh
```

这个脚本会自动执行以下步骤：
1. 检查环境和配置
2. 上传图片到阿里云OSS
3. 生成符合数据库格式的JSON数据
4. 插入数据到MongoDB

## 📋 手动执行步骤

如果需要分步执行，可以按以下顺序：

### 1. 分析Excel数据结构（可选）
```bash
python3 analyze_excel.py
```

### 2. 上传图片到OSS
```bash
python3 upload_images_to_oss.py
```
生成文件：`image_urls.json`

### 3. 生成文章数据
```bash
python3 generate_health_articles_data.py
```
生成文件：`health_articles_data.json`

### 4. 插入数据到MongoDB
```bash
mongosh init_health_articles_from_excel.js
```

## 📊 数据格式说明

### Excel输入格式
- `title`: 文章标题
- `category`: 分类标签（用逗号分隔）
- `content`: 文章内容
- `image_ID`: 对应的图片ID（如fig_1）
- `reference`: 参考来源

### 数据库输出格式
符合 `HealthArticle` 实体类结构：
- 包含段落化的内容结构
- 图片URL来自OSS
- 自动生成阅读时间
- 设置推荐和轮播标记

## 🔧 故障排除

### 常见问题

1. **OSS上传失败**
   - 检查网络连接
   - 验证OSS配置信息
   - 确认存储桶权限

2. **MongoDB连接失败**
   - 确认MongoDB服务运行
   - 检查数据库连接配置
   - 验证客户端安装

3. **Python依赖问题**
   ```bash
   pip3 install pandas openpyxl oss2 --user
   ```

### 日志文件
- `excel_analysis.txt` - Excel数据分析报告
- `image_urls.json` - 图片URL映射
- `health_articles_data.json` - 生成的文章数据

## 📈 数据统计

脚本执行完成后会显示：
- 总文章数量
- 推荐文章数量（前20篇）
- 轮播文章数量（前5篇）
- 上传的图片数量

## ⚠️ 注意事项

1. **数据备份**：执行前请备份现有数据库数据
2. **OSS费用**：图片上传会产生OSS存储和流量费用
3. **重复执行**：重复运行会产生重复数据，建议先清空集合
4. **图片格式**：支持 jpg、jpeg、png、gif 格式
5. **文件路径**：确保在DB目录下执行脚本

## 🎯 下一步

数据导入完成后，可以：
1. 通过后端API验证数据
2. 在前端应用中查看文章
3. 根据需要调整推荐和轮播设置
4. 添加更多文章数据
