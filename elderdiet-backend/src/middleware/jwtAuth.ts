import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';

// 扩展Request类型，添加user字段
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * JWT认证中间件
 */
export const jwtAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: '缺少认证令牌',
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '认证令牌格式错误',
      });
      return;
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: '认证令牌不能为空',
      });
      return;
    }

    // 验证token
    const decoded = verifyToken(token);
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('JWT验证失败:', error);
    res.status(401).json({
      success: false,
      message: '认证令牌无效或已过期',
    });
  }
};

/**
 * 可选的JWT认证中间件（token可能不存在）
 */
export const optionalJwtAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token) {
        const decoded = verifyToken(token);
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    console.warn('可选JWT验证失败:', error);
    next();
  }
}; 