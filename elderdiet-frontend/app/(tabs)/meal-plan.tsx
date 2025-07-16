import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, ActivityIndicator, Dimensions, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { mealPlanAPI, MealPlan as APIMealPlan, Dish } from '@/services/api';
import { gamificationAPI } from '@/services/api';
import DishItem from '@/components/meal-plan/DishItem';
import FamilySharingWall from '@/components/family-sharing/FamilySharingWall';
import { router, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

// 定义树的状态接口
interface TreeStatusData {
  tree_stage: number;
  watering_progress: number;
  completed_trees: number;
  progress_to_next_stage: number;
  is_max_stage: boolean;
  stage_description: string;
}

export default function MealPlanScreen() {
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [currentMealPlan, setCurrentMealPlan] = useState<APIMealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, isLoading: authLoading } = useAuth();
  
  // 新增树状态相关状态
  const [treeStatus, setTreeStatus] = useState<TreeStatusData | null>(null);
  const [isLoadingTreeStatus, setIsLoadingTreeStatus] = useState(false);

  // 获取今日膳食计划
  const loadTodayMealPlan = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mealPlanAPI.getTodayMealPlan(token);
      if (response.success && response.data) {
        setCurrentMealPlan(response.data);
      } else {
        setCurrentMealPlan(null);
      }
    } catch (error) {
      console.error('Failed to load today meal plan:', error);
      setError('加载膳食计划失败');
      setCurrentMealPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 生成今日膳食计划
  const generateTodayMealPlan = async () => {
    if (!token) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await mealPlanAPI.generateTodayMealPlan(token);
      if (response.success && response.data) {
        setCurrentMealPlan(response.data);
        Alert.alert('成功', '今日膳食计划已生成！');
      } else {
        throw new Error(response.message || '生成膳食计划失败');
      }
    } catch (error) {
      console.error('Failed to generate today meal plan:', error);
      setError('生成膳食计划失败');
      Alert.alert('错误', '生成膳食计划失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 更换菜品
  const handleDishChange = async (mealType: 'breakfast' | 'lunch' | 'dinner', dishIndex: number) => {
    if (!token || !currentMealPlan) return;
    
    try {
      // 将前端的mealType转换为后端需要的格式
      const backendMealType = mealType.toUpperCase() as 'BREAKFAST' | 'LUNCH' | 'DINNER';
      
      const response = await mealPlanAPI.replaceDish({
        meal_plan_id: currentMealPlan.id,
        meal_type: backendMealType,
        dish_index: dishIndex,
      }, token);
      
      if (response.success && response.data) {
        setCurrentMealPlan(response.data);
        Alert.alert('成功', '菜品已更换！');
      } else {
        throw new Error(response.message || '更换菜品失败');
      }
    } catch (error) {
      console.error('Failed to replace dish:', error);
      Alert.alert('错误', '更换菜品失败，请重试');
    }
  };

  // 切换喜欢状态
  const toggleLike = async () => {
    if (!token || !currentMealPlan) return;
    
    try {
      const response = await mealPlanAPI.toggleLikeMealPlan(currentMealPlan.id, token);
      if (response.success && response.data) {
        setCurrentMealPlan(response.data);
      } else {
        throw new Error(response.message || '操作失败');
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      Alert.alert('错误', '操作失败，请重试');
    }
  };

  // 拍照打卡功能 - 跳转到创建分享页面
  const handlePhotoCheckIn = () => {
    router.push('/create-post' as any);
  };

  // 获取树的状态
  const loadTreeStatus = async () => {
    if (!token) return;
    
    setIsLoadingTreeStatus(true);
    
    try {
      const response = await gamificationAPI.getTreeStatus(token);
      if (response.success && response.data) {
        setTreeStatus(response.data as unknown as TreeStatusData);
      }
    } catch (error) {
      console.error('Failed to load tree status:', error);
    } finally {
      setIsLoadingTreeStatus(false);
    }
  };

  // 获取树图片的URL
  const getTreeImageUrl = () => {
    if (!treeStatus) return '';
    // 根据树的阶段选择对应的图片
    // 图片编号从14到26对应树的13个不同阶段
    const imageNumber = 14 + treeStatus.tree_stage*2 + treeStatus.watering_progress;
    return `https://elder-diet.oss-cn-shanghai.aliyuncs.com/tree-images/${imageNumber}%402x.png`;
  };

  // 初始化
  useEffect(() => {
    if (!authLoading && token) {
      loadTodayMealPlan();
      loadTreeStatus();
    }
  }, [token, authLoading]);
  
  // 页面重新获取焦点时刷新树状态（从拍照打卡页面返回时）
  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadTreeStatus();
      }
    }, [token])
  );

  // 获取当前日期
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[now.getDay()];
    return `${year}年${month}月${day}日 ${weekday}`;
  };

  // 获取当前餐次的菜品
  const getCurrentMealDishes = (): Dish[] => {
    if (!currentMealPlan) return [];
    
    switch (selectedMealType) {
      case 'breakfast':
        return currentMealPlan.breakfast.dishes;
      case 'lunch':
        return currentMealPlan.lunch.dishes;
      case 'dinner':
        return currentMealPlan.dinner.dishes;
      default:
        return [];
    }
  };

  // 获取当前餐次的营养总结
  const getCurrentMealSummary = (): string => {
    if (!currentMealPlan) return '';
    
    switch (selectedMealType) {
      case 'breakfast':
        return currentMealPlan.breakfast.nutrition_summary;
      case 'lunch':
        return currentMealPlan.lunch.nutrition_summary;
      case 'dinner':
        return currentMealPlan.dinner.nutrition_summary;
      default:
        return '';
    }
  };

  // 获取当前餐次的提示
  const getCurrentMealTips = (): string => {
    if (!currentMealPlan) return '';
    
    switch (selectedMealType) {
      case 'breakfast':
        return currentMealPlan.breakfast.meal_tips;
      case 'lunch':
        return currentMealPlan.lunch.meal_tips;
      case 'dinner':
        return currentMealPlan.dinner.meal_tips;
      default:
        return '';
    }
  };

  // 如果正在加载认证信息，显示加载状态
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>正在加载...</Text>
      </View>
    );
  }

  // 如果没有token，显示错误
  if (!token) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>请先登录</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 固定Header */}
      <View style={[styles.header, { paddingTop: (StatusBar.currentHeight || 44) + 16 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.currentDate}>{getCurrentDate()}</Text>
            <Text style={styles.title}>今日膳食</Text>
          </View>
          {currentMealPlan && (
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={toggleLike}
            >
              <Ionicons 
                 name={currentMealPlan.liked ? 'heart' : 'heart-outline'} 
                 size={28} 
                 color={currentMealPlan.liked ? '#FF0000' : '#ccc'} 
               />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {/* 三餐导航 */}
        <View style={styles.mealTabs}>
          <TouchableOpacity 
            style={[styles.mealTab, selectedMealType === 'breakfast' && styles.activeTab]} 
            onPress={() => setSelectedMealType('breakfast')}
          >
            <Text style={[styles.mealTabText, selectedMealType === 'breakfast' && styles.activeTabText]}>早餐</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.mealTab, selectedMealType === 'lunch' && styles.activeTab]} 
            onPress={() => setSelectedMealType('lunch')}
          >
            <Text style={[styles.mealTabText, selectedMealType === 'lunch' && styles.activeTabText]}>午餐</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.mealTab, selectedMealType === 'dinner' && styles.activeTab]} 
            onPress={() => setSelectedMealType('dinner')}
          >
            <Text style={[styles.mealTabText, selectedMealType === 'dinner' && styles.activeTabText]}>晚餐</Text>
          </TouchableOpacity>
        </View>
        
        {/* AI膳食推荐按钮 - 移动到三餐导航下方 */}
        <TouchableOpacity 
          style={styles.aiRecommendButton}
          onPress={generateTodayMealPlan}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="sparkles" size={24} color="#fff" />
          )}
          <Text style={styles.aiRecommendButtonText}>
            {isGenerating ? '生成中...' : 'AI膳食推荐'}
          </Text>
        </TouchableOpacity>

        {/* 膳食方案内容 */}
        <View style={styles.mealPlanContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>正在加载膳食计划...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={loadTodayMealPlan}
              >
                <Text style={styles.retryButtonText}>重试</Text>
              </TouchableOpacity>
            </View>
          ) : !currentMealPlan ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>今日还没有膳食计划</Text>
              <Text style={styles.emptySubtext}>点击上方"AI膳食推荐"按钮生成今日膳食计划</Text>
            </View>
          ) : (
            <>
              {/* 菜品列表 */}
              <View style={styles.dishesContainer}>
                {getCurrentMealDishes().map((dish, index) => (
                  <DishItem
                    key={`${selectedMealType}_${index}`}
                    dish={dish}
                    index={index}
                    mealType={selectedMealType}
                    onReplace={handleDishChange}
                  />
                ))}
              </View>

              {/* 营养总结和提示 */}
              <View style={styles.recommendationCard}>
                <Text style={styles.nutritionLabel}>【营养均衡】</Text>
                <Text style={styles.recommendationText}>
                  {getCurrentMealSummary()}
                </Text>
              </View>
            </>
          )}

          {/* 小树浇水 */}
          <View style={styles.treeContainer}>
            <View style={styles.treeHeader}>
              <Text style={styles.treeTitle}>健康小树</Text>
              {treeStatus && (
                <View style={styles.treeInfoBadge}>
                  <Ionicons name="leaf" size={16} color="#28a745" />
                  <Text style={styles.treeInfoText}>
                    {treeStatus.stage_description} • 已完成{treeStatus.completed_trees}棵大树
                  </Text>
                </View>
              )}
            </View>
            
            {isLoadingTreeStatus ? (
              <View style={styles.treeLoadingContainer}>
                <ActivityIndicator size="small" color="#28a745" />
                <Text style={styles.treeLoadingText}>正在加载小树状态...</Text>
              </View>
            ) : treeStatus ? (
              <>
                <View style={styles.treeContentContainer}>
                  <Image 
                    source={{ uri: getTreeImageUrl() }}
                    style={styles.treeImage}
                    resizeMode="contain"
                  />
                </View>
                
                <TouchableOpacity 
                  style={styles.mealRecordButton}
                  onPress={handlePhotoCheckIn}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name="camera" size={24} color="#fff" />
                    <Text style={styles.mealRecordButtonText}>记录今日美食{treeStatus.watering_progress === 0 ? " • 帮小树浇水" : ""}</Text>
                  </View>
                  {treeStatus.watering_progress === 1 && (
                    <View style={styles.waterStatusBadge}>
                      <Ionicons name="water" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.treeErrorContainer}>
                <Text style={styles.treeErrorText}>无法加载小树状态</Text>
                <TouchableOpacity 
                  style={styles.treeRetryButton}
                  onPress={loadTreeStatus}
                >
                  <Text style={styles.treeRetryButtonText}>重试</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* 删除这里的AI膳食推荐按钮，已移至上方 */}
        </View>

        {/* 家庭分享墙 - 替换原有的健康打卡日历 */}
        <FamilySharingWall onCreatePost={handlePhotoCheckIn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  currentDate: {
    fontSize: 20,
    color: '#6c757d',
    marginBottom: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#212529',
  },
  likeButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // 三餐导航样式
  mealTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  mealTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007bff',
  },
  mealTabText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
  },
  activeTabText: {
    color: '#212529',
  },

  // 膳食方案容器
  mealPlanContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // 菜品列表样式
  dishesContainer: {
    marginTop: 16,
  },

  // 推荐说明卡片
  recommendationCard: {
    backgroundColor: '#f8fffe',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nutritionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 8,
  },
  healthLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#17a2b8',
    marginTop: 12,
    marginBottom: 6,
  },
  wellnessLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fd7e14',
    marginTop: 12,
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#495057',
    marginBottom: 6,
  },

  // 小树浇水相关样式
  treeContainer: {
    marginBottom: 20,
    backgroundColor: '#f8fff9',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  treeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  treeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#28a745',
  },
  treeInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  treeInfoText: {
    fontSize: 14,
    color: '#28a745',
    marginLeft: 4,
  },
  treeContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  treeImage: {
    width: width * 0.6,
    height: width * 0.6,
  },
  treeLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  treeLoadingText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
  },
  treeErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  treeErrorText: {
    fontSize: 14,
    color: '#dc3545',
    marginBottom: 8,
  },
  treeRetryButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  treeRetryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // 集成打卡按钮到树浇水组件
  mealRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // 确保背景是透明的
  },
  mealRecordButtonText: {
    color: '#fff', // 确保文字是白色
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    backgroundColor: 'transparent', // 确保背景是透明的
  },
  waterStatusBadge: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // AI推荐按钮 - 更新样式
  aiRecommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 24, // add horizontal padding for a pill shape
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center', // center the button horizontally
    marginTop: 16,
    marginBottom: 16,
    // remove marginHorizontal so it doesn't stretch
  },
  aiRecommendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 