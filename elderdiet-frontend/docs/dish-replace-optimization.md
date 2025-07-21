# 菜品更换按钮优化

## 问题描述
用户在点击"更换"按钮后，由于没有明显的反馈，可能会重复点击，导致多次API调用。

## 解决方案
为"更换"按钮添加了加载状态和防重复点击机制：

### 1. 加载状态显示
- 点击按钮后显示加载指示器（ActivityIndicator）
- 按钮变为禁用状态，视觉上变暗
- 替换刷新图标为加载动画

### 2. 防重复点击
- 使用 `isReplacing` 状态控制按钮可用性
- 在异步操作进行中禁用按钮点击
- 操作完成后自动恢复按钮状态

### 3. 错误处理
- 即使操作失败，也会正确恢复按钮状态
- 确保用户可以重新尝试操作

## 代码变更

### DishItem.tsx
```typescript
// 添加加载状态
const [isReplacing, setIsReplacing] = useState(false);

// 异步处理更换操作
const handleReplace = async () => {
  if (isReplacing) return; // 防止重复点击
  
  setIsReplacing(true);
  try {
    await onReplace(mealType, index);
  } finally {
    setIsReplacing(false);
  }
};

// 按钮UI更新
<TouchableOpacity
  style={[
    styles.changeButton,
    isReplacing && styles.changeButtonDisabled
  ]}
  onPress={handleReplace}
  disabled={isReplacing}
>
  {isReplacing ? (
    <ActivityIndicator size="small" color="#666" />
  ) : (
    <Ionicons name="refresh" size={18} color="#666" />
  )}
</TouchableOpacity>
```

### meal-plan.tsx
```typescript
// 更新函数签名返回Promise
const handleDishChange = async (
  mealType: 'breakfast' | 'lunch' | 'dinner', 
  dishIndex: number
): Promise<void> => {
  // ... 现有逻辑
  throw error; // 重新抛出错误让子组件知道操作状态
};
```

## 用户体验改进
1. **即时反馈**：点击后立即显示加载状态
2. **防误操作**：避免用户重复点击造成的问题
3. **状态清晰**：用户明确知道操作正在进行中
4. **错误恢复**：操作失败后可以重新尝试

## 测试建议
1. 点击更换按钮，验证加载状态显示
2. 在加载期间尝试再次点击，确认被忽略
3. 网络较慢时测试用户体验
4. 测试操作失败后的状态恢复
