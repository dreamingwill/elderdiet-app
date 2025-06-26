# 阿里云服务器SSH连接完整解决方案

## 🚨 当前问题
- SSH端口22仍然被阻挡
- 不知道服务器登录密码

## 📋 解决步骤

### 第一步：重新检查和配置安全组

1. **登录阿里云控制台**
   - 网址：https://ecs.console.aliyun.com/
   
2. **确认实例状态**
   - 找到IP为 `8.153.204.247` 的实例
   - 确认状态为"运行中"
   
3. **重新配置安全组规则**
   ```
   实例管理 → 点击实例ID → 安全组 → 配置规则
   
   或者：
   更多 → 网络和安全组 → 安全组配置
   
   在"入方向"规则中添加：
   - 协议类型：SSH(22) 
   - 端口范围：22/22
   - 授权对象：0.0.0.0/0
   - 优先级：1
   - 策略：允许
   ```
   
4. **检查是否有多个安全组**
   - 如果实例绑定了多个安全组，每个都需要配置

### 第二步：重置实例密码（解决登录问题）

1. **在ECS控制台重置密码**
   ```
   实例管理 → 选择你的实例 → 更多 → 密码/密钥 → 重置实例密码
   
   或者：
   点击实例ID → 实例详情 → 重置实例密码
   ```
   
2. **设置新密码**
   - 用户名：root
   - 新密码：设置一个强密码（包含大小写字母、数字、特殊字符）
   - 确认密码：重复输入
   
3. **重启实例使密码生效**
   ```
   实例管理 → 更多 → 实例状态 → 重启
   ```

### 第三步：使用VNC连接（备用方案）

如果SSH仍然无法连接：

1. **VNC连接服务器**
   ```
   实例管理 → 远程连接 → VNC远程连接
   ```
   
2. **在VNC中配置SSH服务**
   ```bash
   # 检查SSH服务状态
   systemctl status sshd
   
   # 启动SSH服务
   systemctl start sshd
   systemctl enable sshd
   
   # 检查SSH配置
   cat /etc/ssh/sshd_config | grep Port
   cat /etc/ssh/sshd_config | grep PermitRootLogin
   
   # 如果需要，修改SSH配置
   vi /etc/ssh/sshd_config
   # 确保以下配置：
   # Port 22
   # PermitRootLogin yes
   
   # 重启SSH服务
   systemctl restart sshd
   ```

### 第四步：检查系统防火墙

在VNC连接中检查系统防火墙：

```bash
# CentOS/RHEL 系统
systemctl status firewalld
firewall-cmd --list-all
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload

# Ubuntu/Debian 系统  
ufw status
ufw allow ssh
ufw enable
```

### 第五步：测试连接

配置完成后，使用我们创建的测试脚本：

```bash
./test-ssh-connection.sh
```

## 🔑 常见登录方式

### 方式1：密码登录
```bash
ssh root@8.153.204.247
# 输入刚才重置的密码
```

### 方式2：使用SSH配置
```bash
ssh aliyun-server
# 输入密码
```

### 方式3：密钥登录（如果创建了密钥对）
```bash
# 下载密钥文件到本地
chmod 400 ~/Downloads/your-key.pem
ssh -i ~/Downloads/your-key.pem root@8.153.204.247
```

## 📱 联系阿里云技术支持

如果以上步骤都无法解决，可以：
1. 提交工单：https://selfservice.console.aliyun.com/ticket/
2. 拨打技术支持热线：95187
3. 说明问题：SSH无法连接，需要检查网络配置

## ✅ 连接成功后的初始配置

```bash
# 更新系统
yum update -y  # CentOS
apt update && apt upgrade -y  # Ubuntu

# 安装必要软件
yum install -y git docker docker-compose  # CentOS
apt install -y git docker.io docker-compose  # Ubuntu

# 创建普通用户（可选）
useradd -m -s /bin/bash yourusername
usermod -aG sudo yourusername  # Ubuntu
usermod -aG wheel yourusername  # CentOS
``` 