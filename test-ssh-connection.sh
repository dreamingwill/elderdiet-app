#!/bin/bash

echo "🔍 测试阿里云服务器连接..."
SERVER_IP="8.153.204.247"

echo "1. 测试网络连通性..."
if ping -c 3 $SERVER_IP > /dev/null 2>&1; then
    echo "✅ 网络连通正常"
else
    echo "❌ 网络连通失败"
    exit 1
fi

echo "2. 测试SSH端口22..."
if nc -zv $SERVER_IP 22 2>/dev/null; then
    echo "✅ SSH端口22开放"
    
    echo "3. 尝试SSH连接..."
    echo "请输入密码或确认密钥配置："
    ssh -o ConnectTimeout=10 -o BatchMode=no aliyun-server
else
    echo "❌ SSH端口22被阻挡"
    echo ""
    echo "📋 解决步骤："
    echo "1. 登录阿里云控制台: https://ecs.console.aliyun.com/"
    echo "2. 找到你的ECS实例 (IP: $SERVER_IP)"
    echo "3. 配置安全组 → 入方向规则 → 添加SSH(22)端口"
    echo "4. 授权对象设置为: 0.0.0.0/0"
    echo "5. 保存配置后重新运行此脚本"
fi 