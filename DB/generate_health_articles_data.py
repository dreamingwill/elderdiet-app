#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成健康文章数据脚本
根据Excel数据和图片URL，生成符合HealthArticle实体类要求的JSON格式数据
"""

import pandas as pd
import json
import os
import re
from datetime import datetime, timedelta
from pathlib import Path

def load_image_urls():
    """加载图片URL映射"""
    url_file = "image_urls.json"
    if os.path.exists(url_file):
        with open(url_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        print(f"⚠️  图片URL文件不存在: {url_file}")
        print("   请先运行 upload_images_to_oss.py 上传图片")
        return {}

def parse_content_to_paragraphs(content_text, image_id, image_urls):
    """将内容文本解析为段落结构"""
    paragraphs = []
    order = 1
    
    # 分割内容，处理换行符
    content_text = content_text.replace('\\n', '\n').replace('/n', '\n')
    sections = re.split(r'\n+', content_text.strip())
    
    # 添加文本段落
    for section in sections:
        section = section.strip()
        if section:
            paragraphs.append({
                "type": "text",
                "content": section,
                "order": order
            })
            order += 1
    
    # 在中间位置插入图片
    if image_id in image_urls:
        insert_position = len(paragraphs) // 2 if len(paragraphs) > 1 else 1
        
        image_paragraph = {
            "type": "image",
            "url": image_urls[image_id],
            "caption": f"相关图片 - {image_id}",
            "altText": f"健康文章配图 {image_id}",
            "order": insert_position + 1
        }
        
        # 调整后续段落的order
        for p in paragraphs[insert_position:]:
            p["order"] += 1
        
        paragraphs.insert(insert_position, image_paragraph)
    
    return paragraphs

def parse_category_to_tags(category_str):
    """将分类字符串解析为标签列表"""
    # 移除"类别："前缀
    category_str = re.sub(r'^类别：', '', category_str)
    
    # 分割标签
    tags = re.split(r'[,，、]', category_str)
    
    # 清理标签
    cleaned_tags = []
    for tag in tags:
        tag = tag.strip()
        if tag:
            cleaned_tags.append(tag)
    
    return cleaned_tags

def estimate_read_time(content):
    """估算阅读时间（分钟）"""
    # 中文平均阅读速度约为300字/分钟
    char_count = len(content)
    read_time = max(1, round(char_count / 300))
    return read_time

def generate_health_articles_data():
    """生成健康文章数据"""
    
    # 读取Excel数据
    excel_path = "health_article_content/list.xlsx"
    if not os.path.exists(excel_path):
        print(f"❌ Excel文件不存在: {excel_path}")
        return None
    
    print(f"📖 读取Excel数据: {excel_path}")
    df = pd.read_excel(excel_path)
    
    # 加载图片URL映射
    print(f"🖼️  加载图片URL映射...")
    image_urls = load_image_urls()
    
    # 生成文章数据
    articles = []
    base_date = datetime(2024, 1, 1)
    
    for index, row in df.iterrows():
        try:
            # 解析内容为段落
            paragraphs = parse_content_to_paragraphs(
                row['content'], 
                row['image_ID'], 
                image_urls
            )
            
            # 解析标签
            tags = parse_category_to_tags(row['category'])
            
            # 估算阅读时间
            read_time = estimate_read_time(row['content'])
            
            # 创建文章对象
            article = {
                "title": row['title'],
                "subtitle": f"来源：{row['reference']}" if pd.notna(row['reference']) else "",
                "category": tags[0] if tags else "健康养生",  # 使用第一个标签作为主分类
                "content": {
                    "paragraphs": paragraphs
                },
                "read_time": read_time,
                "tags": tags,
                "cover_image": image_urls.get(row['image_ID'], ""),
                "status": 1,  # 已发布
                "is_featured": 1 if index < 20 else 0,  # 前20篇设为推荐
                "is_carousel": 1 if index < 5 else 0,   # 前5篇设为轮播
                "carousel_order": index + 1 if index < 5 else 0,
                "created_at": base_date + timedelta(days=index),
                "updated_at": base_date + timedelta(days=index)
            }
            
            articles.append(article)
            print(f"✅ [{index + 1}/{len(df)}] 处理完成: {row['title']}")
            
        except Exception as e:
            print(f"❌ [{index + 1}/{len(df)}] 处理失败: {row['title']} - {str(e)}")
    
    # 保存为JSON文件
    output_file = "health_articles_data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=2, default=str)
    
    print(f"\n📊 数据生成统计:")
    print(f"   总文章数: {len(articles)}")
    print(f"   推荐文章: {sum(1 for a in articles if a['is_featured'] == 1)}")
    print(f"   轮播文章: {sum(1 for a in articles if a['is_carousel'] == 1)}")
    print(f"   数据已保存到: {output_file}")
    
    return articles

if __name__ == "__main__":
    print("🚀 开始生成健康文章数据...")
    result = generate_health_articles_data()
    
    if result:
        print(f"\n🎉 数据生成完成！共生成 {len(result)} 篇文章数据")
    else:
        print(f"\n💥 数据生成失败")
