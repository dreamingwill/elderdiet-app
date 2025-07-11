# 聊天记录用户隔离问题修复

## 问题描述

之前发现的 bug：先登录账号 A 并与 bot 聊天，然后切换到账号 B 时，仍能看到账号 A 的聊天记录。这是一个严重的数据隔离问题。

## 根本原因分析

### 1. 前端问题

- 使用固定的存储 key `@chat_messages` 存储所有用户的聊天记录
- 不同用户登录时共享同一个存储空间
- 切换用户时没有清理上一个用户的本地数据

### 2. 后端实现

- 后端已经正确实现了按用户 ID 隔离聊天记录
- 所有数据库查询都基于 `userId` 进行过滤

### 3. 数据流问题

- 前端优先从本地 `AsyncStorage` 加载数据
- 没有调用后端的 `/chat/history` API 获取用户专属记录

## 修复方案

### 1. 用户隔离的存储 key

```javascript
// 修复前：所有用户共享同一个key
const STORAGE_KEY = "@chat_messages";

// 修复后：每个用户使用独立的key
const getChatStorageKey = (userId: string) => `@chat_messages_${userId}`;
```

### 2. 优先从后端获取聊天历史

```javascript
// 修复后的加载逻辑
const loadMessages = async (userId: string) => {
  // 1. 优先从后端获取
  const response = await chatAPI.getChatHistory(token);
  if (response.success && response.data.length > 0) {
    // 转换格式并保存到本地
    setMessages(convertedMessages);
    await saveMessagesToLocal(convertedMessages, userId);
    return;
  }

  // 2. 后端获取失败时，从本地加载
  const storageKey = getChatStorageKey(userId);
  const savedMessages = await AsyncStorage.getItem(storageKey);
  // ...
};
```

### 3. 用户切换时清理数据

```javascript
// 监听用户变化，清理上一个用户的数据
useEffect(() => {
  if (isAuthenticated && uid) {
    if (currentUserId !== uid) {
      setCurrentUserId(uid);
      setMessages([]); // 清空当前显示的消息
      loadMessages(uid);
    }
  } else {
    // 用户未登录，清空所有数据
    setMessages([]);
    setCurrentUserId(null);
  }
}, [uid, isAuthenticated]);
```

### 4. 登出时清理所有本地数据

```javascript
const clearUserData = async () => {
  // 清除认证数据
  await authStorage.clearAuthData();

  // 清除所有用户的聊天记录
  const allKeys = await AsyncStorage.getAllKeys();
  const chatKeys = allKeys.filter((key) => key.startsWith("@chat_messages_"));
  if (chatKeys.length > 0) {
    await AsyncStorage.multiRemove(chatKeys);
  }
};
```

### 5. 添加用户认证检查

```javascript
// 未登录用户显示登录提示
if (!isAuthenticated) {
  return (
    <View style={styles.container}>
      <View style={styles.loginPrompt}>
        <Text>请先登录以使用聊天功能</Text>
      </View>
    </View>
  );
}
```

## 修复的文件

### 前端修改

1. `elderdiet-frontend/app/(tabs)/chat.tsx`

   - 添加用户隔离的存储 key
   - 优先从后端 API 获取聊天历史
   - 用户切换时清理数据
   - 添加用户认证检查

2. `elderdiet-frontend/contexts/UserContext.tsx`
   - 登出时清理所有聊天记录

### 后端（已正确实现）

- `ChatMessageRepository` - 按用户 ID 查询消息
- `ChatService` - 用户专属的聊天逻辑
- `ChatController` - JWT 认证和用户隔离

## 测试方法

### 1. 自动化测试

运行提供的测试脚本：

```bash
node test-chat-isolation.js
```

### 2. 手动测试步骤

#### 步骤 1：准备测试账号

1. 注册/登录账号 A (例如：13800138000)
2. 注册/登录账号 B (例如：13800138001)

#### 步骤 2：测试数据隔离

1. 用账号 A 登录，发送消息："我是用户 A，我有糖尿病"
2. 退出登录
3. 用账号 B 登录，发送消息："我是用户 B，我有高血压"
4. 检查是否只能看到账号 B 的消息
5. 退出登录，重新用账号 A 登录
6. 检查是否只能看到账号 A 的消息

#### 步骤 3：测试清空功能

1. 用账号 A 登录
2. 点击清空聊天记录
3. 检查账号 A 的记录是否被清空
4. 切换到账号 B，检查账号 B 的记录是否不受影响

#### 步骤 4：测试登出清理

1. 用账号 A 登录并发送消息
2. 退出登录
3. 重新登录账号 A
4. 检查是否从后端正确加载了历史记录

## 预期结果

✅ **修复后的预期行为**：

- 每个用户只能看到自己的聊天记录
- 切换用户时，前一个用户的聊天记录不会显示
- 优先从后端获取聊天历史，确保数据一致性
- 登出时清理所有本地数据
- 未登录用户无法使用聊天功能

❌ **修复前的问题行为**：

- 用户 A 的聊天记录会被用户 B 看到
- 本地存储数据混乱
- 用户切换时数据不清理

## 技术要点

1. **数据隔离**：使用用户 ID 作为存储 key 的一部分
2. **双重保障**：本地存储 + 后端 API 双重数据源
3. **生命周期管理**：正确处理用户登录/登出的数据清理
4. **错误处理**：网络异常时的降级处理
5. **用户体验**：未登录状态的友好提示

## 安全性改进

1. **数据隔离**：确保用户数据完全隔离
2. **认证检查**：所有聊天操作都需要有效 token
3. **清理机制**：登出时彻底清理敏感数据
4. **错误处理**：避免因异常导致的数据泄露

这个修复确保了聊天功能的数据安全性和用户隐私保护。
