// API基础配置
const API_BASE_URL = 'http://localhost:3001/api/v1';

// 请求配置
const defaultHeaders = {
  'Content-Type': 'application/json',
};

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginResponse {
  token: string;
  uid: string;
  role: 'elder' | 'child';
  phone: string;
}

export interface RegisterResponse {
  token: string;
  uid: string;
  role: 'elder' | 'child';
  phone: string;
}

export interface UserInfo {
  uid: string;
  phone: string;
  role: 'elder' | 'child';
  createdAt: string;
  updatedAt: string;
}

export interface ProfileData {
  _id?: string;
  userId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  region: string;
  height: number;
  weight: number;
  chronicConditions: string[];
  dietaryPreferences: string[];
  notes?: string;
  bmi?: number;
  bmiStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChronicConditionOption {
  value: string;
  label: string;
}

// 认证相关API
export const authAPI = {
  // 用户注册
  register: async (
    phone: string, 
    password: string, 
    role: 'elder' | 'child'
  ): Promise<ApiResponse<RegisterResponse>> => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone, password, role }),
    });
  },

  // 用户登录
  login: async (phone: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  },

  // 获取当前用户信息
  me: async (token: string): Promise<ApiResponse<UserInfo>> => {
    return request('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 退出登录
  logout: async (token: string): Promise<ApiResponse> => {
    return request('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// 健康档案相关API
export const profileAPI = {
  // 获取用户健康档案
  getProfile: async (userId: string, token: string): Promise<ApiResponse<ProfileData>> => {
    return request(`/profiles/${userId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 创建健康档案
  createProfile: async (profileData: Omit<ProfileData, '_id' | 'userId' | 'bmi' | 'bmiStatus' | 'createdAt' | 'updatedAt'>, token: string): Promise<ApiResponse<ProfileData>> => {
    return request('/profiles', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  },

  // 更新健康档案
  updateProfile: async (userId: string, profileData: Omit<ProfileData, '_id' | 'userId' | 'bmi' | 'bmiStatus' | 'createdAt' | 'updatedAt'>, token: string): Promise<ApiResponse<ProfileData>> => {
    return request(`/profiles/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  },

  // 删除健康档案
  deleteProfile: async (userId: string, token: string): Promise<ApiResponse> => {
    return request(`/profiles/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 获取慢性疾病选项
  getChronicConditions: async (): Promise<ApiResponse<ChronicConditionOption[]>> => {
    return request('/profiles/options/chronic-conditions', {
      method: 'GET',
    });
  },
};

// 健康检查API
export const healthAPI = {
  check: async (): Promise<ApiResponse> => {
    // 使用统一的API版本路径
    return request('/health', { method: 'GET' });
  },
};

export default {
  authAPI,
  profileAPI,
  healthAPI,
}; 