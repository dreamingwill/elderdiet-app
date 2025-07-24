import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { profileAPI, ProfileData, ChronicConditionOption } from '../services/api';

export interface UseProfileResult {
  profile: ProfileData | null;
  chronicConditionsOptions: ChronicConditionOption[];
  isLoading: boolean;
  isFirstTime: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  createProfile: (data: Omit<ProfileData, '_id' | 'user_id' | 'bmi' | 'bmi_status' | 'bmi_status_label' | 'created_at' | 'updated_at' | 'tree_stage' | 'watering_progress' | 'completed_trees' | 'today_water_count' | 'last_water_time'>) => Promise<void>;
  updateProfile: (data: Omit<ProfileData, '_id' | 'user_id' | 'bmi' | 'bmi_status' | 'bmi_status_label' | 'created_at' | 'updated_at' | 'tree_stage' | 'watering_progress' | 'completed_trees' | 'today_water_count' | 'last_water_time'>) => Promise<void>;
}

export const useProfile = (): UseProfileResult => {
  const { uid, token } = useUser();
  
  // 状态管理
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [chronicConditionsOptions, setChronicConditionsOptions] = useState<ChronicConditionOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取Profile数据
  const refreshProfile = useCallback(async () => {
    if (!uid || !token) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // 并行加载档案数据和慢性疾病选项
      const [profileResult, optionsResult] = await Promise.allSettled([
        profileAPI.getProfile(uid, token),
        profileAPI.getChronicConditions(),
      ]);

      // 处理慢性疾病选项
      if (optionsResult.status === 'fulfilled') {
        setChronicConditionsOptions(optionsResult.value.data || []);
      }

      // 处理档案数据
      if (profileResult.status === 'fulfilled') {
        const profileData = profileResult.value.data;
        if (profileData) {
          setProfile(profileData);
          setIsFirstTime(false);
        } else {
          setProfile(null);
          setIsFirstTime(true);
        }
      } else {
        // 档案不存在（404）或其他错误
        setProfile(null);
        setIsFirstTime(true);
        
        // 如果不是404错误，显示错误信息
        if (profileResult.reason?.message && !profileResult.reason.message.includes('404') && !profileResult.reason.message.includes('不存在')) {
          setError(profileResult.reason.message);
        }
      }
    } catch (err) {
      console.error('加载Profile数据失败:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [uid, token]);

  // 创建Profile
  const createProfile = useCallback(async (data: Omit<ProfileData, '_id' | 'user_id' | 'bmi' | 'bmi_status' | 'bmi_status_label' | 'created_at' | 'updated_at' | 'tree_stage' | 'watering_progress' | 'completed_trees' | 'today_water_count' | 'last_water_time'>) => {
    if (!token) {
      throw new Error('用户未登录');
    }

    try {
      const result = await profileAPI.createProfile(data, token);
      setProfile(result.data || null);
      setIsFirstTime(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建失败';
      setError(errorMessage);
      throw err;
    }
  }, [token]);

  // 更新Profile
  const updateProfile = useCallback(async (data: Omit<ProfileData, '_id' | 'user_id' | 'bmi' | 'bmi_status' | 'bmi_status_label' | 'created_at' | 'updated_at' | 'tree_stage' | 'watering_progress' | 'completed_trees' | 'today_water_count' | 'last_water_time'>) => {
    if (!uid || !token) {
      throw new Error('用户未登录');
    }

    try {
      const result = await profileAPI.updateProfile(uid, data, token);
      setProfile(result.data || null);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新失败';
      setError(errorMessage);
      throw err;
    }
  }, [uid, token]);

  // 初始化加载
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return {
    profile,
    chronicConditionsOptions,
    isLoading,
    isFirstTime,
    error,
    refreshProfile,
    createProfile,
    updateProfile,
  };
}; 