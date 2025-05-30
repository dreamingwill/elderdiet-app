import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { User, IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();

// 请求验证schema
const registerSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^1[3-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': '请输入正确的手机号格式',
      'any.required': '手机号不能为空',
    }),
  password: Joi.string()
    .min(6)
    .max(20)
    .required()
    .messages({
      'string.min': '密码长度不能少于6位',
      'string.max': '密码长度不能超过20位',
      'any.required': '密码不能为空',
    }),
  role: Joi.string()
    .valid('elder', 'child')
    .required()
    .messages({
      'any.only': '用户角色必须是elder或child',
      'any.required': '用户角色不能为空',
    }),
});

const loginSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^1[3-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': '请输入正确的手机号格式',
      'any.required': '手机号不能为空',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': '密码不能为空',
    }),
});

/**
 * 用户注册
 * POST /api/v1/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    // 验证请求参数
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
      return;
    }

    const { phone, password, role } = value;

    // 检查用户是否已存在
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: '该手机号已注册',
      });
      return;
    }

    // 创建新用户
    const newUser = await User.createUser({ phone, password, role });

    // 生成JWT token
    const token = generateToken({
      uid: newUser._id.toString(),
      phone: newUser.phone,
      role: newUser.role,
    });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        uid: newUser._id.toString(),
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 用户登录
 * POST /api/v1/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // 验证请求参数
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
      return;
    }

    const { phone, password } = value;

    // 查找用户
    const user = await User.findOne({ phone });
    if (!user) {
      res.status(401).json({
        success: false,
        message: '手机号或密码错误',
      });
      return;
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '手机号或密码错误',
      });
      return;
    }

    // 生成JWT token
    const token = generateToken({
      uid: user._id.toString(),
      phone: user.phone,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        token,
        uid: user._id.toString(),
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 获取当前用户信息 (需要认证)
 * GET /api/v1/auth/me
 */
router.get('/me', jwtAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.uid).select('-passwordHash');
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: '获取用户信息成功',
      data: {
        uid: user._id.toString(),
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 用户退出登录 (需要认证)
 * POST /api/v1/auth/logout
 */
router.post('/logout', jwtAuth, (req: Request, res: Response): void => {
  // JWT是无状态的，实际的token撤销需要在客户端处理
  // 这里只是提供一个标准的logout端点
  res.status(200).json({
    success: true,
    message: '退出登录成功',
  });
});

export default router; 