# 菜品数据维护指南

## 数据结构说明

现在所有菜品数据都集中在 `data/dishes.ts` 文件中管理，方便维护和更新。

## 如何添加新菜品

### 1. 在 dishDatabase 中添加新菜品

```typescript
// 在 data/dishes.ts 文件的 dishDatabase 对象中添加
'new_dish_id': {
  id: 'new_dish_id',
  name: '新菜品名称',
  imageUrl: '图片URL',
  category: '主食' | '菜肴' | '汤品', // 选择其中一个
  description: '菜品描述（可选）'
}
```

### 2. 将新菜品添加到备选列表中

```typescript
// 在 alternativeDishIds 中添加到对应的餐次和分类
breakfast: {
  staple: ['b_staple_002', 'b_staple_003', 'new_breakfast_staple_id'], // 添加早餐主食
  dish: ['b_dish_003', 'b_dish_004', 'new_breakfast_dish_id'] // 添加早餐菜肴
}
```

## 实际操作示例

### 添加一个新的早餐菜品："小笼包"

1. **在 dishDatabase 中添加：**

```typescript
'b_dish_005': {
  id: 'b_dish_005',
  name: '小笼包',
  imageUrl: 'https://example.com/xiaolongbao.jpg',
  category: '菜肴',
  description: '传统上海小笼包，汤汁鲜美'
}
```

2. **在备选列表中添加：**

```typescript
breakfast: {
  staple: ['b_staple_002', 'b_staple_003'],
  dish: ['b_dish_003', 'b_dish_004', 'b_dish_005'] // 添加新的小笼包
}
```

### 修改现有菜品的图片

只需要在 `dishDatabase` 中找到对应的菜品 ID，修改 `imageUrl` 字段即可：

```typescript
'b_dish_001': {
  id: 'b_dish_001',
  name: '牛奶燕麦粥',
  imageUrl: '新的图片URL', // 修改这里
  category: '菜肴',
  description: '香浓的牛奶燕麦粥'
}
```

## 菜品 ID 命名规范

- 早餐：`b_` 开头（breakfast）
- 午餐：`l_` 开头（lunch）
- 晚餐：`d_` 开头（dinner）
- 主食：`staple_` + 编号
- 菜肴：`dish_` + 编号
- 汤品：`soup_` + 编号

例如：

- `b_staple_001`：早餐主食 001
- `l_dish_002`：午餐菜肴 002
- `d_soup_001`：晚餐汤品 001

## 注意事项

1. **唯一性**：每个菜品的 `id` 必须是唯一的
2. **图片 URL**：确保图片 URL 可以正常访问
3. **分类匹配**：菜品的 `category` 必须与备选列表中的分类对应
4. **一致性**：修改菜品信息时，确保在所有引用的地方都保持一致

## 测试新添加的菜品

添加新菜品后，可以通过以下方式测试：

1. 在应用中切换到对应的餐次
2. 点击菜品的"更换"按钮
3. 点击"AI 膳食推荐"按钮
4. 检查新菜品是否出现在推荐中

这样的数据管理方式让菜品的维护变得更加简单和集中化。
