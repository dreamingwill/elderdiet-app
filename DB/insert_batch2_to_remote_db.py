#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从本地连接服务器MongoDB插入第二批健康文章数据
支持远程数据库连接
"""

import json
import os
from datetime import datetime

# 检查并安装依赖
try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, DuplicateKeyError
except ImportError:
    print("❌ 缺少pymongo依赖，正在安装...")
    os.system("pip3 install pymongo")
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, DuplicateKeyError

# 数据库配置
DB_CONFIG = {
    # 本地MongoDB（默认）
    "local": {
        "host": "localhost",
        "port": 27017,
        "database": "elderdiet_dev",
        "username": None,
        "password": None
    },
    
    # 远程MongoDB（请根据你的服务器配置修改）
    "remote": {
        "host": "8.153.204.247",  # 替换为你的服务器IP
        "port": 27017,
        "database": "elderdiet_prod",
        "username": "prodUser",  # 如果需要认证，请填入用户名
        "password": os.environ.get("MONGODB_PASSWORD")   # 如果需要认证，请填入密码或使用环境变量
    }
}

def get_mongodb_connection(config_type="local"):
    """获取MongoDB连接"""
    config = DB_CONFIG[config_type]
    
    try:
        # 构建连接字符串
        if config["username"] and config["password"]:
            connection_string = f"mongodb://{config['username']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
        else:
            connection_string = f"mongodb://{config['host']}:{config['port']}"
        
        print(f"🔗 连接到 {config_type} MongoDB: {config['host']}:{config['port']}")
        
        # 创建客户端
        client = MongoClient(connection_string, serverSelectionTimeoutMS=5000)
        
        # 测试连接
        client.admin.command('ping')
        
        # 获取数据库
        db = client[config["database"]]
        
        print(f"✅ 成功连接到数据库: {config['database']}")
        return db, client
        
    except ConnectionFailure as e:
        print(f"❌ 连接失败: {str(e)}")
        return None, None
    except Exception as e:
        print(f"❌ 连接错误: {str(e)}")
        return None, None

def load_batch2_data():
    """加载第二批文章数据"""
    data_file = "health_articles_data_batch2.json"
    
    if not os.path.exists(data_file):
        print(f"❌ 数据文件不存在: {data_file}")
        print("   请先运行 generate_health_articles_data_batch2.py 生成数据")
        return None
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            articles = json.load(f)
        
        print(f"📖 成功加载 {len(articles)} 条第二批文章数据")
        return articles
        
    except Exception as e:
        print(f"❌ 读取数据文件时出错: {str(e)}")
        return None

def create_indexes(collection):
    """创建必要的索引"""
    try:
        indexes = [
            ("category", 1),
            ("status", 1),
            ("is_featured", 1),
            ("is_carousel", 1),
            ("created_at", -1),
            ("tags", 1)
        ]
        
        for field, direction in indexes:
            collection.create_index([(field, direction)])
        
        print("✅ 索引创建完成")
        
    except Exception as e:
        print(f"⚠️  索引创建警告: {str(e)}")

def insert_articles_to_db(db, articles):
    """插入文章数据到数据库"""
    try:
        collection = db.health_articles
        
        # 创建索引
        create_indexes(collection)
        
        # 检查现有数据
        existing_count = collection.count_documents({})
        print(f"📊 数据库中现有文章数: {existing_count}")
        
        # 处理日期字段
        processed_articles = []
        for article in articles:
            processed_article = article.copy()
            processed_article["created_at"] = datetime.fromisoformat(article["created_at"].replace('Z', '+00:00'))
            processed_article["updated_at"] = datetime.fromisoformat(article["updated_at"].replace('Z', '+00:00'))
            processed_articles.append(processed_article)
        
        # 批量插入
        print("📤 开始插入第二批文章数据...")
        result = collection.insert_many(processed_articles)
        
        print(f"✅ 成功插入 {len(result.inserted_ids)} 条第二批文章数据")
        
        # 统计信息
        total_count = collection.count_documents({})
        featured_count = collection.count_documents({"is_featured": 1})
        carousel_count = collection.count_documents({"is_carousel": 1})
        
        print(f"\n📊 数据库统计:")
        print(f"   总文章数: {total_count}")
        print(f"   推荐文章数: {featured_count}")
        print(f"   轮播文章数: {carousel_count}")
        
        return True
        
    except DuplicateKeyError as e:
        print(f"⚠️  发现重复数据: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ 插入数据时出错: {str(e)}")
        return False

def main():
    """主函数"""
    print("🚀 开始插入第二批健康文章数据到数据库...")
    print("=" * 50)
    
    # 加载数据
    articles = load_batch2_data()
    if not articles:
        return
    
    # 选择连接类型
    print("\n🔧 请选择数据库连接类型:")
    print("1. 本地MongoDB (localhost:27017)")
    print("2. 远程MongoDB (需要配置服务器信息)")
    
    choice = input("请输入选择 (1/2): ").strip()
    
    if choice == "1":
        config_type = "local"
    elif choice == "2":
        config_type = "remote"
        print("\n⚠️  请先编辑脚本中的远程数据库配置信息:")
        print("   - host: 服务器IP地址")
        print("   - port: MongoDB端口")
        print("   - username/password: 如果需要认证")
        
        confirm = input("配置已完成？(y/N): ").strip().lower()
        if confirm != 'y':
            print("❌ 请先完成配置后再运行")
            return
    else:
        print("❌ 无效选择")
        return
    
    # 连接数据库
    db, client = get_mongodb_connection(config_type)
    if db is None:
        return
    
    try:
        # 插入数据
        success = insert_articles_to_db(db, articles)
        
        if success:
            print("\n🎉 第二批健康文章数据插入完成！")
        else:
            print("\n💥 数据插入失败")
            
    finally:
        # 关闭连接
        if client:
            client.close()
            print("🔌 数据库连接已关闭")

if __name__ == "__main__":
    main()
