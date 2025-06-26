#!/bin/bash

# 阿里云ECS SSH连接问题诊断和修复脚本
# 使用方法: ./aliyun-ssh-fix.sh

echo "🔧 阿里云ECS SSH连接问题诊断脚本"
echo "================================="

SERVER_IP="8.153.204.247"
SSH_USER="root"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_step() {
    echo -e "${BLUE}🔍 $1${NC}"
}

success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

error_msg() {
    echo -e "${RED}❌ $1${NC}"
}

warning_msg() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# 第1步：基础网络检查
check_step "检查网络连通性..."
if ping -c 3 $SERVER_IP > /dev/null 2>&1; then
    success_msg "网络连通正常"
else
    error_msg "网络连通失败，请检查服务器IP地址"
    exit 1
fi

# 第2步：SSH端口检查
check_step "检查SSH端口22..."
if nc -zv $SERVER_IP 22 2>/dev/null; then
    success_msg "SSH端口22开放"
    SSH_PORT_OPEN=true
else
    error_msg "SSH端口22被阻挡"
    SSH_PORT_OPEN=false
fi

# 第3步：提供解决方案
if [ "$SSH_PORT_OPEN" = false ]; then
    echo ""
    echo "📋 解决SSH端口问题的步骤："
    echo "1. 登录阿里云控制台: https://ecs.console.aliyun.com/"
    echo "2. 找到实例 (IP: $SERVER_IP)"
    echo "3. 配置安全组规则："
    echo "   - 点击实例 → 安全组 → 配置规则"
    echo "   - 添加入方向规则："
    echo "     * 协议类型: SSH(22)"
    echo "     * 端口范围: 22/22"
    echo "     * 授权对象: 0.0.0.0/0"
    echo "     * 策略: 允许"
    echo "4. 保存并等待2-3分钟生效"
    echo ""
    
    read -p "完成安全组配置后，按Enter键继续检查..." -r
    
    # 重新检查端口
    check_step "重新检查SSH端口..."
    if nc -zv $SERVER_IP 22 2>/dev/null; then
        success_msg "SSH端口22现在开放了！"
        SSH_PORT_OPEN=true
    else
        error_msg "SSH端口仍然被阻挡"
        warning_msg "请检查安全组配置是否正确"
    fi
fi

# 第4步：尝试SSH连接
if [ "$SSH_PORT_OPEN" = true ]; then
    echo ""
    check_step "尝试SSH连接..."
    echo "如果提示输入密码，请输入您设置的root密码"
    echo "如果不知道密码，请先在阿里云控制台重置密码"
    echo ""
    
    # 尝试连接
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP
    
    if [ $? -eq 0 ]; then
        success_msg "SSH连接成功！"
    else
        echo ""
        error_msg "SSH连接失败，可能的原因："
        echo "1. 密码错误"
        echo "2. 服务器SSH服务未启动"
        echo "3. 需要使用密钥登录"
        echo ""
        echo "📋 解决密码问题："
        echo "1. 在阿里云控制台重置实例密码："
        echo "   实例管理 → 更多 → 密码/密钥 → 重置实例密码" 
        echo "2. 设置新的root密码"
        echo "3. 重启实例使密码生效"
        echo "4. 重新运行此脚本"
        echo ""
        echo "📋 使用VNC连接（备用方案）："
        echo "1. 在阿里云控制台 → 远程连接 → VNC远程连接"
        echo "2. 使用VNC连接到服务器"
        echo "3. 在服务器上检查SSH服务状态："
        echo "   systemctl status sshd"
        echo "   systemctl start sshd"
        echo "   systemctl enable sshd"
    fi
else
    echo ""
    warning_msg "请先解决SSH端口问题，然后重新运行此脚本"
fi

echo ""
echo "🆘 如果问题持续存在，请联系阿里云技术支持："
echo "   工单系统: https://selfservice.console.aliyun.com/ticket/"
echo "   电话支持: 95187"
echo ""
echo "📖 完整解决方案请查看: aliyun-server-setup.md" 