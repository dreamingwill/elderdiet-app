# 第二批健康文章数据处理指南

## 🎯 目标
处理 `health_article_content_2` 目录下的第二批健康文章数据：
1. 上传100张图片到阿里云OSS
2. 生成符合数据库格式的JSON数据
3. 从本地连接服务器数据库插入数据

## 🚀 快速开始

### 方法1：一键执行（推荐）
```bash
./process_batch2_complete.sh
```

### 方法2：分步执行

#### 步骤1：上传第二批图片
```bash
python3 upload_images_to_oss_batch2.py
```
生成文件：`image_urls_batch2.json`

#### 步骤2：生成第二批文章数据
```bash
python3 generate_health_articles_data_batch2.py
```
生成文件：`health_articles_data_batch2.json`

#### 步骤3：插入数据到数据库
```bash
python3 insert_batch2_to_remote_db.py
```

## 🔧 配置说明

### OSS配置
已自动使用环境变量：
- `ALIYUN_OSS_ACCESS_KEY_ID`
- `ALIYUN_OSS_ACCESS_KEY_SECRET`

第二批图片存储路径：`health-articles/images/batch2/`

### 数据库连接配置

#### 本地连接
- 主机：localhost:27017
- 数据库：elderdiet_dev

#### 远程连接
编辑 `insert_batch2_to_remote_db.py` 中的配置：
```python
"remote": {
    "host": "你的服务器IP",
    "port": 27017,
    "database": "elderdiet_dev",
    "username": None,  # 如果需要认证
    "password": None   # 如果需要认证
}
```

## 📊 数据特点

### 与第一批的区别
- 图片路径：`batch2/` 子目录
- 创建时间：从2024年4月开始
- 轮播顺序：从6开始（避免冲突）
- 推荐文章：前15篇
- 轮播文章：前3篇

### 数据结构
- 总计：100篇文章
- 图片：100张PNG格式
- 分类：多种健康养生类别

## 🔍 验证结果

插入完成后，可以通过以下方式验证：

### MongoDB查询
```javascript
// 查看总文章数
db.health_articles.countDocuments()

// 查看第二批文章数（按创建时间）
db.health_articles.countDocuments({
  created_at: { $gte: ISODate("2024-04-01") }
})

// 查看轮播文章
db.health_articles.find({is_carousel: 1}).sort({carousel_order: 1})
```

### 文件检查
- `image_urls_batch2.json` - 第二批图片URL映射
- `health_articles_data_batch2.json` - 第二批文章数据

## ⚠️ 注意事项

1. **环境变量**：确保已设置阿里云OSS环境变量
2. **网络连接**：上传图片需要稳定的网络连接
3. **数据库权限**：确保有写入数据库的权限
4. **重复执行**：重复运行会产生重复数据
5. **远程连接**：确保服务器防火墙开放MongoDB端口

## 🛠️ 故障排除

### OSS上传失败
- 检查环境变量设置
- 验证网络连接
- 确认OSS权限

### 数据库连接失败
- 检查服务器IP和端口
- 验证防火墙设置
- 确认MongoDB服务状态

### 依赖安装问题
```bash
pip3 install pandas openpyxl oss2 pymongo --user
```

## 📈 执行结果

成功执行后会显示：
- 上传的图片数量
- 生成的文章数量
- 插入的数据库记录数
- 推荐和轮播文章统计
