// MongoDB初始化脚本
// 在elderdiet数据库中创建应用用户

db = db.getSiblingDB('elderdiet');

// 创建应用用户
db.createUser({
  user: 'elderdiet_app',
  pwd: 'elderdiet_app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'elderdiet'
    }
  ]
});

// 创建基础集合和索引
try {
  // 用户集合
  db.createCollection('users');
  db.users.createIndex({ "phone": 1 }, { unique: true });
  db.users.createIndex({ "email": 1 }, { unique: true, sparse: true });

  // 用户配置集合
  db.createCollection('profiles');
  db.profiles.createIndex({ "userId": 1 }, { unique: true });

  print('✅ ElderDiet数据库初始化完成');
  print('📝 创建了用户: elderdiet_app');
  print('📁 创建了集合: users, profiles');
  print('🔍 创建了必要的索引');

} catch (error) {
  print('❌ 数据库初始化出错:', error);
} 