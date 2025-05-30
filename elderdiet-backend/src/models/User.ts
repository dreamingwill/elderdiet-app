import { Schema, model, Document, Model, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  phone: string;
  passwordHash: string;
  role: 'elder' | 'child';
  createdAt: Date;
  updatedAt: Date;
  
  // 实例方法
  comparePassword(password: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUser> {
  // 静态方法
  createUser(userData: {
    phone: string;
    password: string;
    role: 'elder' | 'child';
  }): Promise<IUser>;
}

const userSchema = new Schema<IUser>(
  {
    phone: {
      type: String,
      required: [true, '手机号不能为空'],
      unique: true,
      validate: {
        validator: function (v: string) {
          return /^1[3-9]\d{9}$/.test(v);
        },
        message: '请输入正确的手机号格式',
      },
    },
    passwordHash: {
      type: String,
      required: [true, '密码不能为空'],
    },
    role: {
      type: String,
      enum: ['elder', 'child'],
      required: [true, '用户角色不能为空'],
    },
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt
    versionKey: false, // 移除 __v 字段
  }
);

// 创建索引
userSchema.index({ phone: 1 }, { unique: true });

// 实例方法：检查密码
userSchema.methods.comparePassword = function (password: string): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, this.passwordHash);
};

// 静态方法：创建用户
userSchema.statics.createUser = async function (userData: {
  phone: string;
  password: string;
  role: 'elder' | 'child';
}): Promise<IUser> {
  const bcrypt = require('bcryptjs');
  const saltRounds = 12;
  
  const passwordHash = await bcrypt.hash(userData.password, saltRounds);
  
  return this.create({
    phone: userData.phone,
    passwordHash,
    role: userData.role,
  });
};

export const User = model<IUser, IUserModel>('User', userSchema); 