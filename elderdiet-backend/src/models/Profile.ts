import { Schema, model, Document, Types, Model } from 'mongoose';

// 慢性疾病枚举
export const CHRONIC_CONDITIONS = [
  'hypertension',      // 高血压
  'diabetes',          // 糖尿病
  'heart_disease',     // 心脏病
  'asthma',           // 哮喘
  'arthritis',        // 关节炎
  'hyperlipidemia',   // 高血脂
  'others'            // 其他
] as const;

export type ChronicCondition = typeof CHRONIC_CONDITIONS[number];

// 性别枚举
export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = typeof GENDERS[number];

export interface IProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;           // 关联用户ID
  name: string;                     // 姓名
  age: number;                      // 年龄 0-120
  gender: Gender;                   // 性别
  region: string;                   // 居住地区
  height: number;                   // 身高 cm
  weight: number;                   // 体重 kg
  chronicConditions: ChronicCondition[];  // 慢性疾病
  dietaryPreferences: string[];     // 饮食偏好
  notes?: string;                   // 备注
  createdAt: Date;
  updatedAt: Date;

  // 虚拟字段
  bmi: number;

  // 实例方法
  getBMIStatus(): string;
}

export interface IProfileModel extends Model<IProfile> {
  // 静态方法
  findByUserId(userId: string | Types.ObjectId): Promise<IProfile | null>;
  createOrUpdate(
    userId: string | Types.ObjectId,
    profileData: Partial<IProfile>
  ): Promise<IProfile>;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '用户ID不能为空'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, '姓名不能为空'],
      trim: true,
      maxlength: [50, '姓名长度不能超过50字符'],
    },
    age: {
      type: Number,
      required: [true, '年龄不能为空'],
      min: [0, '年龄不能小于0'],
      max: [120, '年龄不能大于120'],
    },
    gender: {
      type: String,
      required: [true, '性别不能为空'],
      enum: {
        values: GENDERS,
        message: '性别必须是 male、female 或 other',
      },
    },
    region: {
      type: String,
      required: [true, '居住地区不能为空'],
      trim: true,
      maxlength: [100, '地区名称不能超过100字符'],
    },
    height: {
      type: Number,
      required: [true, '身高不能为空'],
      min: [80, '身高不能小于80cm'],
      max: [250, '身高不能大于250cm'],
    },
    weight: {
      type: Number,
      required: [true, '体重不能为空'],
      min: [30, '体重不能小于30kg'],
      max: [200, '体重不能大于200kg'],
    },
    chronicConditions: {
      type: [String],
      validate: {
        validator: function(conditions: string[]) {
          return conditions.every(condition => 
            CHRONIC_CONDITIONS.includes(condition as ChronicCondition)
          );
        },
        message: '慢性疾病包含无效选项',
      },
      default: [],
    },
    dietaryPreferences: {
      type: [String],
      validate: {
        validator: function(preferences: string[]) {
          return preferences.every(pref => 
            typeof pref === 'string' && pref.trim().length > 0
          );
        },
        message: '饮食偏好不能为空字符串',
      },
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, '备注不能超过500字符'],
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 创建复合索引
profileSchema.index({ userId: 1 }, { unique: true });

// 虚拟字段：BMI计算
profileSchema.virtual('bmi').get(function() {
  const heightInM = this.height / 100;
  return Math.round((this.weight / (heightInM * heightInM)) * 10) / 10;
});

// 实例方法：获取BMI状态
profileSchema.methods.getBMIStatus = function(): string {
  const bmi = this.bmi;
  if (bmi < 18.5) return 'underweight';      // 偏瘦
  if (bmi < 24) return 'normal';             // 正常
  if (bmi < 28) return 'overweight';         // 超重
  return 'obese';                            // 肥胖
};

// 静态方法：根据用户ID查找档案
profileSchema.statics.findByUserId = function(userId: string | Types.ObjectId) {
  return this.findOne({ userId });
};

// 静态方法：创建或更新档案
profileSchema.statics.createOrUpdate = async function(
  userId: string | Types.ObjectId,
  profileData: Partial<IProfile>
) {
  return this.findOneAndUpdate(
    { userId },
    { ...profileData, userId },
    { 
      new: true, 
      upsert: true,
      runValidators: true 
    }
  );
};

export const Profile = model<IProfile, IProfileModel>('Profile', profileSchema); 