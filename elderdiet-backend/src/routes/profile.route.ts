import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { Profile, CHRONIC_CONDITIONS, GENDERS } from '../models/Profile';
import { jwtAuth } from '../middleware/jwtAuth';
import { Types } from 'mongoose';

const router = Router();

// 健康档案创建/更新的验证Schema
const profileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(50)
    .required()
    .messages({
      'string.empty': '姓名不能为空',
      'string.max': '姓名长度不能超过50字符',
      'any.required': '姓名不能为空',
    }),
  age: Joi.number()
    .integer()
    .min(0)
    .max(120)
    .required()
    .messages({
      'number.base': '年龄必须是数字',
      'number.integer': '年龄必须是整数',
      'number.min': '年龄不能小于0',
      'number.max': '年龄不能大于120',
      'any.required': '年龄不能为空',
    }),
  gender: Joi.string()
    .valid(...GENDERS)
    .required()
    .messages({
      'any.only': '性别必须是 male、female 或 other',
      'any.required': '性别不能为空',
    }),
  region: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.empty': '居住地区不能为空',
      'string.max': '地区名称不能超过100字符',
      'any.required': '居住地区不能为空',
    }),
  height: Joi.number()
    .min(80)
    .max(250)
    .required()
    .messages({
      'number.base': '身高必须是数字',
      'number.min': '身高不能小于80cm',
      'number.max': '身高不能大于250cm',
      'any.required': '身高不能为空',
    }),
  weight: Joi.number()
    .min(30)
    .max(200)
    .required()
    .messages({
      'number.base': '体重必须是数字',
      'number.min': '体重不能小于30kg',
      'number.max': '体重不能大于200kg',
      'any.required': '体重不能为空',
    }),
  chronicConditions: Joi.array()
    .items(Joi.string().valid(...CHRONIC_CONDITIONS))
    .default([])
    .messages({
      'array.includesRequiredUnknowns': '慢性疾病包含无效选项',
    }),
  dietaryPreferences: Joi.array()
    .items(Joi.string().trim().min(1))
    .default([])
    .messages({
      'string.min': '饮食偏好不能为空字符串',
    }),
  notes: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .default('')
    .messages({
      'string.max': '备注不能超过500字符',
    }),
});

// 权限验证：只能操作自己的档案
const checkProfilePermission = (req: Request, res: Response, next: any) => {
  const requestedUserId = req.params.userId;
  const currentUserId = req.user?.uid;

  if (!requestedUserId || !currentUserId) {
    return res.status(400).json({
      success: false,
      message: '缺少必要参数',
    });
  }

  if (requestedUserId !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: '无权访问其他用户的健康档案',
    });
  }

  next();
};

/**
 * 获取用户健康档案
 * GET /api/v1/profiles/:userId
 */
router.get('/:userId', jwtAuth, checkProfilePermission, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // 验证ObjectId格式
    if (!Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: '无效的用户ID格式',
      });
      return;
    }

    const profile = await Profile.findByUserId(userId);
    
    if (!profile) {
      res.status(404).json({
        success: false,
        message: '健康档案不存在',
      });
      return;
    }

    // 返回档案信息（包含BMI等计算字段）
    const profileData = profile.toObject({ virtuals: true });
    
    res.status(200).json({
      success: true,
      message: '获取健康档案成功',
      data: {
        ...profileData,
        bmi: profile.bmi,
        bmiStatus: profile.getBMIStatus(),
      },
    });
  } catch (error) {
    console.error('获取健康档案失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 创建健康档案
 * POST /api/v1/profiles
 */
router.post('/', jwtAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    // 验证请求数据
    const { error, value } = profileSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
      return;
    }

    const userId = req.user!.uid;

    // 检查是否已存在档案
    const existingProfile = await Profile.findByUserId(userId);
    if (existingProfile) {
      res.status(409).json({
        success: false,
        message: '健康档案已存在，请使用更新接口',
      });
      return;
    }

    // 创建新档案
    const newProfile = new Profile({
      ...value,
      userId,
    });

    await newProfile.save();

    res.status(201).json({
      success: true,
      message: '创建健康档案成功',
      data: {
        ...newProfile.toObject({ virtuals: true }),
        bmi: newProfile.bmi,
        bmiStatus: newProfile.getBMIStatus(),
      },
    });
  } catch (error) {
    console.error('创建健康档案失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 更新健康档案
 * PUT /api/v1/profiles/:userId
 */
router.put('/:userId', jwtAuth, checkProfilePermission, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // 验证ObjectId格式
    if (!Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: '无效的用户ID格式',
      });
      return;
    }

    // 验证请求数据
    const { error, value } = profileSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
      return;
    }

    // 更新档案
    const updatedProfile = await Profile.findOneAndUpdate(
      { userId },
      value,
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!updatedProfile) {
      res.status(404).json({
        success: false,
        message: '健康档案不存在',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: '更新健康档案成功',
      data: {
        ...updatedProfile.toObject({ virtuals: true }),
        bmi: updatedProfile.bmi,
        bmiStatus: updatedProfile.getBMIStatus(),
      },
    });
  } catch (error) {
    console.error('更新健康档案失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 删除健康档案
 * DELETE /api/v1/profiles/:userId
 */
router.delete('/:userId', jwtAuth, checkProfilePermission, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // 验证ObjectId格式
    if (!Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: '无效的用户ID格式',
      });
      return;
    }

    const deletedProfile = await Profile.findOneAndDelete({ userId });

    if (!deletedProfile) {
      res.status(404).json({
        success: false,
        message: '健康档案不存在',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: '删除健康档案成功',
    });
  } catch (error) {
    console.error('删除健康档案失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 获取慢性疾病选项
 * GET /api/v1/profiles/options/chronic-conditions
 */
router.get('/options/chronic-conditions', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: '获取慢性疾病选项成功',
    data: CHRONIC_CONDITIONS.map(condition => ({
      value: condition,
      label: getChronicConditionLabel(condition),
    })),
  });
});

// 慢性疾病中文标签映射
function getChronicConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    hypertension: '高血压',
    diabetes: '糖尿病',
    heart_disease: '心脏病',
    asthma: '哮喘',
    arthritis: '关节炎',
    hyperlipidemia: '高血脂',
    others: '其他',
  };
  return labels[condition] || condition;
}

export default router; 