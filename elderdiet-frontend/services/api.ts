// API基础配置
const API_BASE_URL = 'http://localhost:3001/api/v1'; // 本地开发
//const API_BASE_URL = 'http://30.71.181.219:3001/api/v1'; // 云服务器地址
//const API_BASE_URL = 'http://8.153.204.247:3001/api/v1'; // 云服务器地址
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

// 聊天相关类型定义
export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  type: 'text' | 'image';
  content?: string;
  imageUrls?: string[];
  timestamp: number;
}

export interface ChatRequest {
  type: 'text' | 'image';
  content?: string;
  image_urls?: string[];
}

export interface ChatResponse {
  response: string;
  messageId: string;
  timestamp: number;
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

// 养生文章相关类型定义
export interface HealthArticle {
  _id: string;
  title: string;
  subtitle?: string;
  category: string;
  content: {
    paragraphs: Array<{
      type: 'text' | 'image';
      content?: string;
      url?: string;
      caption?: string;
      alt_text?: string;
      order: number;
    }>;
  };
  read_time: number;
  tags: string[];
  cover_image?: string;
  status: number;
  is_featured: number;
  is_carousel: number;
  carousel_order: number;
  created_at: string;
  updated_at: string;
}

export interface HealthArticlesResponse {
  articles: HealthArticle[];
  total: number;
  page: number;
  limit: number;
}

// 健康检查API
export const healthAPI = {
  check: async (): Promise<ApiResponse> => {
    // 使用统一的API版本路径
    return request('/health', { method: 'GET' });
  },
};

// 养生文章API
export const healthArticlesAPI = {
  // 获取文章列表
  getArticles: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    is_featured?: number;
    is_carousel?: number;
  }): Promise<ApiResponse<HealthArticlesResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString());
    if (params?.is_carousel !== undefined) queryParams.append('is_carousel', params.is_carousel.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/health-articles${queryString ? `?${queryString}` : ''}`;
    
    return request(endpoint, {
      method: 'GET',
    });
  },

  // 获取单篇文章详情
  getArticle: async (articleId: string): Promise<ApiResponse<HealthArticle>> => {
    return request(`/health-articles/${articleId}`, {
      method: 'GET',
    });
  },

  // 获取轮播图文章
  getCarouselArticles: async (): Promise<ApiResponse<HealthArticle[]>> => {
    return request('/health-articles/carousel', {
      method: 'GET',
    });
  },

  // 获取推荐文章
  getFeaturedArticles: async (limit?: number): Promise<ApiResponse<HealthArticle[]>> => {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/health-articles/featured${queryString ? `?${queryString}` : ''}`;
    
    return request(endpoint, {
      method: 'GET',
    });
  },

  // 获取文章分类
  getCategories: async (): Promise<ApiResponse<string[]>> => {
    return request('/health-articles/categories', {
      method: 'GET',
    });
  },
};


// 聊天相关API
export const chatAPI = {
  // 发送聊天消息
  sendMessage: async (chatRequest: ChatRequest, token: string): Promise<ApiResponse<ChatResponse>> => {
    return request('/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(chatRequest),
    });
  },

  // 获取聊天历史记录
  getChatHistory: async (token: string): Promise<ApiResponse<ChatMessage[]>> => {
    return request('/chat/history', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 清空聊天历史记录
  clearChatHistory: async (token: string): Promise<ApiResponse<void>> => {
    return request('/chat/history', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

export default {
  authAPI,
  profileAPI,
  healthAPI,
  healthArticlesAPI,
  chatAPI,
}; 