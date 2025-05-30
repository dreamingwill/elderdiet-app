import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'elderdiet-development-secret';

export interface JWTPayload {
  uid: string;
  phone: string;
  role: 'elder' | 'child';
  iat?: number;
  exp?: number;
}

/**
 * 生成JWT token
 */
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const options: SignOptions = {
    expiresIn: '7d',
    algorithm: 'HS256' as const,
  };
  
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * 验证JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * 解码JWT token（不验证签名）
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
}; 