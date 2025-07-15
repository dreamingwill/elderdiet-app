import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, ActivityIndicator, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { mealPlanAPI, MealPlan as APIMealPlan, Dish } from '@/services/api';
import DishItem from '@/components/meal-plan/DishItem';
import FamilySharingWall from '@/components/family-sharing/FamilySharingWall';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');



export default function MealPlanScreen() {
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [currentMealPlan, setCurrentMealPlan] = useState<APIMealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, isLoading: authLoading } = useAuth();

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

  // 初始化
  useEffect(() => {
    if (!authLoading && token) {
      loadTodayMealPlan();
    }
  }, [token, authLoading]);

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
              <Text style={styles.emptySubtext}>点击下方"AI膳食推荐"按钮生成今日膳食计划</Text>
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
                {/* <Text style={styles.healthLabel}>【膳食提示】</Text>
                <Text style={styles.recommendationText}>
                  {getCurrentMealTips()}
                </Text> */}
                {/* {currentMealPlan.health_tips && (
                  <>
                    <Text style={styles.wellnessLabel}>【健康建议】</Text>
                    <Text style={styles.recommendationText}>
                      {currentMealPlan.health_tips}
                    </Text>
                  </>
                )} */}
              </View>
            </>
          )}

          {/* AI膳食推荐和拍照打卡按钮 */}
          <View style={styles.checkInButtonsContainer}>
            <TouchableOpacity 
              style={[styles.checkInButton, styles.quickCheckInButton]}
              onPress={generateTodayMealPlan}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="sparkles" size={24} color="#fff" />
              )}
              <Text style={styles.checkInButtonText}>
                {isGenerating ? '生成中...' : 'AI膳食推荐'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.checkInButton, styles.photoCheckInButton]}
              onPress={handlePhotoCheckIn}
            >
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.checkInButtonText}>拍照打卡</Text>
            </TouchableOpacity>
          </View>
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

  // 打卡按钮容器
  checkInButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  checkInButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickCheckInButton: {
    backgroundColor: '#28a745',
    marginRight: 8,
  },
  photoCheckInButton: {
    backgroundColor: '#007bff',
    marginLeft: 8,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
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


}); 