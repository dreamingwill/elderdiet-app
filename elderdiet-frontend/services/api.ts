// API基础配置
import { API_BASE_URL, API_TIMEOUT } from '@/config/api.config';
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
    // 添加超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    console.error('API request failed:', error);
    throw error;
  }
}

// 带自定义超时的请求函数
async function requestWithTimeout<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUT
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
    // 使用自定义超时时间
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
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
  role: 'ELDER' | 'CHILD';
  phone: string;
}

export interface RegisterResponse {
  token: string;
  uid: string;
  role: 'ELDER' | 'CHILD';
  phone: string;
}

export interface UserInfo {
  uid: string;
  phone: string;
  role: 'ELDER' | 'CHILD';
  createdAt: string;
  updatedAt: string;
}

export interface ProfileData {
  _id?: string;
  user_id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  region: string;
  height: number;
  weight: number;
  chronic_conditions: string[];
  dietary_preferences: string[];
  notes?: string;
  bmi?: number;
  bmi_status?: string;
  bmi_status_label?: string;
  avatar_url?: string;
  tree_stage?: number;
  watering_progress?: number;
  completed_trees?: number;
  today_water_count?: number;
  last_water_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChronicConditionOption {
  value: string;
  label: string;
}

// 健康档案完整性检查结果
export interface ProfileCompletenessResult {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

// 健康档案完整性检查工具函数
export const checkProfileCompleteness = (profile: ProfileData | null): ProfileCompletenessResult => {
  if (!profile) {
    return {
      isComplete: false,
      missingFields: ['所有基本信息'],
      completionPercentage: 0,
    };
  }

  const missingFields: string[] = [];
  const requiredFields = [
    { key: 'name', label: '姓名' },
    { key: 'age', label: '年龄' },
    { key: 'gender', label: '性别' },
    { key: 'region', label: '居住地区' },
    { key: 'height', label: '身高' },
    { key: 'weight', label: '体重' },
  ];

  // 检查必填字段
  requiredFields.forEach(field => {
    const value = profile[field.key as keyof ProfileData];
    if (!value || value === '' || value === 0) {
      missingFields.push(field.label);
    }
  });

  // 计算完成度百分比
  const totalFields = requiredFields.length;
  const completedFields = totalFields - missingFields.length;
  const completionPercentage = Math.round((completedFields / totalFields) * 100);

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completionPercentage,
  };
};

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
    role: 'ELDER' | 'CHILD'
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

  // 修改密码
  changePassword: async (
    currentPassword: string,
    newPassword: string,
    token: string
  ): Promise<ApiResponse<void>> => {
    return request('/auth/change-password', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
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
  createProfile: async (profileData: Omit<ProfileData, '_id' | 'user_id' | 'bmi' | 'bmi_status' | 'bmi_status_label' | 'created_at' | 'updated_at' | 'tree_stage' | 'watering_progress' | 'completed_trees' | 'today_water_count' | 'last_water_time'>, token: string): Promise<ApiResponse<ProfileData>> => {
    return request('/profiles', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  },

  // 更新健康档案
  updateProfile: async (userId: string, profileData: Omit<ProfileData, '_id' | 'user_id' | 'bmi' | 'bmi_status' | 'bmi_status_label' | 'created_at' | 'updated_at' | 'tree_stage' | 'watering_progress' | 'completed_trees' | 'today_water_count' | 'last_water_time'>, token: string): Promise<ApiResponse<ProfileData>> => {
    return request(`/profiles/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  },
  
  // 上传用户头像
  uploadAvatar: async (imageUri: string, token: string): Promise<ApiResponse<ProfileData>> => {
    const formData = new FormData();
    
    // 构建文件对象
    const fileName = imageUri.split('/').pop() || 'avatar.jpg';
    const fileType = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = fileType === 'png' ? 'image/png' : 
                     fileType === 'gif' ? 'image/gif' : 
                     fileType === 'webp' ? 'image/webp' : 
                     'image/jpeg';
    
    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as any);
    
    return request('/profiles/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData as any,
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
// 膳食计划相关类型定义
export interface Dish {
  name: string;
  recommendation_reason: string;
}

export interface MealInfo {
  meal_type: string;
  dishes: Dish[];
  nutrition_summary: string;
  dish_count: number;
  meal_type_label: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  plan_date: string;
  breakfast: MealInfo;
  lunch: MealInfo;
  dinner: MealInfo;
  generated_reason: string;
  status: string;
  liked: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealPlanGenerateRequest {
  plan_date: string;
  preferred_ingredients?: string[];
  avoid_ingredients?: string[];
  special_requirements?: string;
}

export interface ReplaceDishRequest {
  meal_plan_id: string;
  meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  dish_index: number;
}

export interface LikeMealPlanRequest {
  meal_plan_id: string;
  liked: boolean;
}

export interface MealPlanStatsResponse {
  total: number;
  liked: number;
}

export interface HealthArticle {
  id: string;
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
  getChatHistory: async (token: string, sinceTimestamp?: number): Promise<ApiResponse<ChatMessage[]>> => {
    const params = new URLSearchParams();
    if (sinceTimestamp) {
      params.append('since_timestamp', sinceTimestamp.toString());
    }
    
    const queryString = params.toString();
    const endpoint = `/chat/history${queryString ? `?${queryString}` : ''}`;
    
    return request(endpoint, {
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

// 膳食计划相关API
export const mealPlanAPI = {
  // 获取今日最新膳食计划
  getTodayMealPlan: async (token: string): Promise<ApiResponse<MealPlan>> => {
    return request('/meal-plans/today', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 生成今日膳食计划 - 使用更长的超时时间
  generateTodayMealPlan: async (token: string): Promise<ApiResponse<MealPlan>> => {
    return requestWithTimeout('/meal-plans/generate-today', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }, 60000); // 60秒超时，专门用于AI生成
  },

  // 生成指定日期的膳食计划 - 使用更长的超时时间
  generateMealPlan: async (requestData: MealPlanGenerateRequest, token: string): Promise<ApiResponse<MealPlan>> => {
    return requestWithTimeout('/meal-plans', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    }, 60000); // 60秒超时，专门用于AI生成
  },

  // 获取指定日期的最新膳食计划
  getLatestMealPlan: async (planDate: string, token: string): Promise<ApiResponse<MealPlan>> => {
    return request(`/meal-plans/latest?plan_date=${planDate}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 获取指定日期的所有膳食计划
  getMealPlansByDate: async (planDate: string, token: string): Promise<ApiResponse<MealPlan[]>> => {
    return request(`/meal-plans/by-date?plan_date=${planDate}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 获取膳食计划历史记录
  getMealPlanHistory: async (token: string): Promise<ApiResponse<MealPlan[]>> => {
    return request('/meal-plans/history', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 获取指定日期范围的膳食计划
  getMealPlansByRange: async (startDate: string, endDate: string, token: string): Promise<ApiResponse<MealPlan[]>> => {
    return request(`/meal-plans/range?start_date=${startDate}&end_date=${endDate}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 获取收藏的膳食计划
  getLikedMealPlans: async (token: string): Promise<ApiResponse<MealPlan[]>> => {
    return request('/meal-plans/liked', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 获取膳食计划统计信息
  getMealPlanStats: async (token: string): Promise<ApiResponse<MealPlanStatsResponse>> => {
    return request('/meal-plans/stats', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 更换菜品
  replaceDish: async (requestData: ReplaceDishRequest, token: string): Promise<ApiResponse<MealPlan>> => {
    return request('/meal-plans/replace-dish', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
  },

  // 设置膳食计划喜欢状态
  likeMealPlan: async (requestData: LikeMealPlanRequest, token: string): Promise<ApiResponse<MealPlan>> => {
    return request('/meal-plans/like', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
  },

  // 切换膳食计划喜欢状态
  toggleLikeMealPlan: async (mealPlanId: string, token: string): Promise<ApiResponse<MealPlan>> => {
    return request(`/meal-plans/${mealPlanId}/toggle-like`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 归档膳食计划
  archiveMealPlan: async (mealPlanId: string, token: string): Promise<ApiResponse<MealPlan>> => {
    return request(`/meal-plans/${mealPlanId}/archive`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 删除膳食计划
  deleteMealPlan: async (mealPlanId: string, token: string): Promise<ApiResponse<void>> => {
    return request(`/meal-plans/${mealPlanId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// 家庭分享墙相关类型定义
export interface MealRecord {
  id: string;
  user_id: string;
  caption: string;
  image_urls: string[];
  visibility: 'PRIVATE' | 'FAMILY';
  share_with_nutritionist?: boolean; // 是否分享给营养师
  nutritionist_comment?: string; // 营养师评论
  nutritionist_comment_at?: string; // 营养师评论时间
  created_at: string;
  updated_at: string;
}

export interface MealRecordResponse {
  id: string;
  user_id: string;
  caption: string;
  image_urls: string[];
  visibility: 'PRIVATE' | 'FAMILY';
  share_with_nutritionist?: boolean; // 是否分享给营养师
  nutritionist_comment?: string; // 营养师评论
  nutritionist_comment_at?: string; // 营养师评论时间
  created_at: string;
  updated_at: string;
  user_info: {
    user_id: string;
    username: string;
    avatar?: string | null;
    nickname: string;
  };
  likes_count: number;
  comments_count: number;
  liked_by_current_user: boolean;
  comments: CommentInfo[];
}

export interface LikeInfo {
  id: string;
  user_id: string;
  user: {
    uid: string;
    name: string;
    avatar?: string;
  };
  created_at: string;
}

export interface CommentInfo {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  username: string;
  user_avatar?: string | null;
}

export interface RecordComment {
  id: string;
  record_id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
  username: string;
  user_avatar?: string | null;
}

export interface FamilyLink {
  id: string;
  parent_id: string;
  child_id: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  user_id: string;
  phone: string;
  role: 'ELDER' | 'CHILD';
  name: string;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  region: string;
  avatar_url: string | null;
  relationship_type: 'parent' | 'child';
  created_at: string;
}

export interface TreeStatus {
  current_stage: number;
  watering_count: number;
  next_stage_threshold: number;
  description: string;
}

export interface CreateMealRecordRequest {
  caption: string;
  visibility: 'PRIVATE' | 'FAMILY';
  shareWithNutritionist?: boolean; // 是否分享给营养师
}

export interface CreateCommentRequest {
  text: string;
}

export interface LinkFamilyRequest {
  child_phone: string;
}

export interface LinkElderRequest {
  elder_phone: string;
}

// 分享墙分页响应数据结构
export interface FeedResponse {
  records: MealRecordResponse[];
  current_page: number;
  total_pages: number;
  total_records: number;
  has_more: boolean;
}

// 家庭分享墙相关API
export const mealRecordsAPI = {
  // 获取分享墙时间线
  getFeed: async (token: string, page?: number, limit?: number): Promise<ApiResponse<FeedResponse>> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const endpoint = `/meal-records/feed${queryString ? `?${queryString}` : ''}`;

    return request(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 创建膳食记录
  createMealRecord: async (
    requestData: CreateMealRecordRequest,
    imageUris: string[],
    token: string
  ): Promise<ApiResponse<MealRecord>> => {
    const formData = new FormData();
    formData.append('request', JSON.stringify(requestData));
    
    imageUris.forEach((uri, index) => {
      const fileName = uri.split('/').pop() || `image_${index}.jpg`;
      const fileType = fileName.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = fileType === 'png' ? 'image/png' : 
                       fileType === 'gif' ? 'image/gif' : 
                       fileType === 'webp' ? 'image/webp' : 
                       'image/jpeg';

      formData.append('images', {
        uri: uri,
        name: fileName,
        type: mimeType,
      } as any);
    });

    return request('/meal-records', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData as any,
    });
  },

  // 切换点赞状态
  toggleLike: async (recordId: string, token: string): Promise<ApiResponse<void>> => {
    return request(`/meal-records/${recordId}/toggle-like`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 添加评论
  addComment: async (
    recordId: string,
    requestData: CreateCommentRequest,
    token: string
  ): Promise<ApiResponse<RecordComment>> => {
    return request(`/meal-records/${recordId}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
  },

  // 获取评论列表
  getComments: async (recordId: string, token: string): Promise<ApiResponse<CommentInfo[]>> => {
    return request(`/meal-records/${recordId}/comments`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 更新膳食记录可见性
  updateRecordVisibility: async (
    recordId: string,
    visibility: 'PRIVATE' | 'FAMILY',
    token: string
  ): Promise<ApiResponse<MealRecord>> => {
    return request(`/meal-records/${recordId}/visibility`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ visibility }),
    });
  },

  // 生成营养师评论
  generateNutritionistComment: async (
    recordId: string,
    token: string
  ): Promise<ApiResponse<string>> => {
    return request(`/meal-records/${recordId}/nutritionist-comment`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// 家庭关系相关API
export const familyAPI = {
  // 链接家庭成员
  linkFamily: async (
    requestData: LinkFamilyRequest,
    token: string
  ): Promise<ApiResponse<FamilyLink>> => {
    return request('/family/link', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
  },

  // 链接到老人账号
  linkToElder: async (
    requestData: LinkElderRequest,
    token: string
  ): Promise<ApiResponse<FamilyLink>> => {
    return request('/family/link2elder', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
  },

  // 获取家庭成员列表
  getFamilyMembers: async (token: string): Promise<ApiResponse<FamilyMember[]>> => {
    return request('/family/members', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// 游戏化相关API
export const gamificationAPI = {
  // 获取小树状态
  getTreeStatus: async (token: string): Promise<ApiResponse<TreeStatus>> => {
    return request('/profiles/tree-status', {
      method: 'GET',
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
  mealPlanAPI,
  mealRecordsAPI,
  familyAPI,
  gamificationAPI,
}; 