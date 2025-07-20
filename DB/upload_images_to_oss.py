#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阿里云OSS图片上传脚本
将health_article_content/image目录下的100张图片上传到阿里云OSS
"""

import os
import json
import sys
from pathlib import Path

# 检查并安装依赖
try:
    import oss2
except ImportError:
    print("❌ 缺少oss2依赖，正在安装...")
    os.system("pip3 install oss2")
    import oss2

# OSS配置信息 - 根据你的Java配置填入
OSS_CONFIG = {
    "access_key_id": os.getenv("ALIYUN_OSS_ACCESS_KEY_ID", "your-access-key-id"),
    "access_key_secret": os.getenv("ALIYUN_OSS_ACCESS_KEY_SECRET", "your-access-key-secret"),
    "endpoint": "https://oss-cn-shanghai.aliyuncs.com",  # 根据你的配置
    "bucket_name": "elder-diet",  # 根据你的配置
    "path_prefix": "health-articles/images/"  # 健康文章图片路径
}

def validate_config():
    """验证OSS配置"""
    for key, value in OSS_CONFIG.items():
        if value.startswith("your-") and key != "path_prefix":
            print(f"❌ 请先设置环境变量或配置OSS参数: {key}")
            print(f"   当前值: {value}")
            return False
    return True

def upload_images_to_oss():
    """上传图片到阿里云OSS"""
    
    if not validate_config():
        print("\n📝 请编辑脚本中的OSS_CONFIG配置信息：")
        print("   - access_key_id: 阿里云AccessKey ID")
        print("   - access_key_secret: 阿里云AccessKey Secret")
        print("   - endpoint: OSS地域节点")
        print("   - bucket_name: OSS存储桶名称")
        print("   - path_prefix: 图片存储路径前缀")
        return None
    
    # 图片目录
    image_dir = Path("health_article_content/image")
    if not image_dir.exists():
        print(f"❌ 图片目录不存在: {image_dir}")
        return None
    
    # 初始化OSS客户端
    try:
        auth = oss2.Auth(OSS_CONFIG["access_key_id"], OSS_CONFIG["access_key_secret"])
        bucket = oss2.Bucket(auth, OSS_CONFIG["endpoint"], OSS_CONFIG["bucket_name"])
        print(f"✅ OSS客户端初始化成功")
    except Exception as e:
        print(f"❌ OSS客户端初始化失败: {str(e)}")
        return None
    
    # 获取所有图片文件
    image_files = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.gif']:
        image_files.extend(image_dir.glob(ext))
    
    image_files.sort()  # 按文件名排序
    print(f"📁 找到 {len(image_files)} 个图片文件")
    
    if len(image_files) == 0:
        print("❌ 没有找到图片文件")
        return None
    
    # 上传图片并记录URL
    uploaded_urls = {}
    failed_uploads = []
    
    for i, image_file in enumerate(image_files, 1):
        try:
            # 构建OSS对象名
            object_name = OSS_CONFIG["path_prefix"] + image_file.name
            
            # 上传文件
            print(f"📤 [{i}/{len(image_files)}] 上传 {image_file.name}...")
            bucket.put_object_from_file(object_name, str(image_file))
            
            # 构建访问URL - 使用Java配置中的base-url格式
            url = f"https://{OSS_CONFIG['bucket_name']}.{OSS_CONFIG['endpoint'].replace('https://', '')}/{object_name}"
            
            # 记录映射关系（去掉扩展名作为key）
            image_id = image_file.stem  # fig_1, fig_2, etc.
            uploaded_urls[image_id] = url
            
            print(f"   ✅ 成功: {url}")
            
        except Exception as e:
            print(f"   ❌ 失败: {str(e)}")
            failed_uploads.append(image_file.name)
    
    # 保存URL映射到JSON文件
    output_file = "image_urls.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(uploaded_urls, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 上传统计:")
    print(f"   成功: {len(uploaded_urls)} 个")
    print(f"   失败: {len(failed_uploads)} 个")
    print(f"   URL映射已保存到: {output_file}")
    
    if failed_uploads:
        print(f"\n❌ 失败的文件:")
        for filename in failed_uploads:
            print(f"   - {filename}")
    
    return uploaded_urls

if __name__ == "__main__":
    print("🚀 开始上传图片到阿里云OSS...")
    result = upload_images_to_oss()
    
    if result:
        print(f"\n🎉 上传完成！共上传 {len(result)} 个图片文件")
    else:
        print(f"\n💥 上传失败，请检查配置和网络连接")
