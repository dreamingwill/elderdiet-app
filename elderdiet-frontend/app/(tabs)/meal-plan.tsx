import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, FlatList, StatusBar, ActivityIndicator, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';
import { mealPlanAPI, MealPlan as APIMealPlan, Dish } from '@/services/api';
import DishItem from '@/components/meal-plan/DishItem';

const { width } = Dimensions.get('window');

// 打卡记录数据类型
interface CheckInRecord {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  type: 'quick' | 'photo';
  photo?: string;
  timestamp: number;
  likes: Array<{
    id: string;
    user: string;
    avatar: string;
    timestamp: number;
  }>;
  comments: Array<{
    id: string;
    user: string;
    avatar: string;
    message: string;
    timestamp: number;
  }>;
}

export default function MealPlanScreen() {
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [selectedDay, setSelectedDay] = useState(30); // 默认选中今天
  const [currentMealPlan, setCurrentMealPlan] = useState<APIMealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, isLoading: authLoading } = useAuth();
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([
    // 保留原有的打卡记录数据
    {
      id: 'checkin_today_breakfast',
      date: new Date().toISOString().split('T')[0],
      mealType: 'breakfast',
      type: 'photo',
      photo: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60',
      timestamp: Date.now() - 3600000,
      likes: [
        { id: 'like_today_1', user: '女儿', avatar: '👧', timestamp: Date.now() - 3000000 }
      ],
      comments: [
        { id: 'comm_today_1', user: '女儿', avatar: '👧', message: '早餐很丰富呢!', timestamp: Date.now() - 2500000 }
      ]
    },
    {
      id: 'checkin_today_lunch',
      date: new Date().toISOString().split('T')[0],
      mealType: 'lunch',
      type: 'quick',
      timestamp: Date.now() - 7200000,
      likes: [],
      comments: []
    },
    // 其他打卡记录...
  ]);

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

  // 拍照打卡功能
  const handlePhotoCheckIn = async () => {
    // 模拟拍照上传
    const mockPhotoUrl = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60';
    
    const today = new Date().toISOString().split('T')[0];
    const newCheckIn: CheckInRecord = {
      id: `checkin_${Date.now()}`,
      date: today,
      mealType: selectedMealType,
      type: 'photo',
      photo: mockPhotoUrl,
      timestamp: Date.now(),
      likes: [],
      comments: []
    };

    setCheckInRecords(prev => [newCheckIn, ...prev]);
    
    // 保存到本地存储
    try {
      const updatedRecords = [newCheckIn, ...checkInRecords];
      await AsyncStorage.setItem('@check_in_records', JSON.stringify(updatedRecords));
      Alert.alert('成功', `${selectedMealType === 'breakfast' ? '早餐' : selectedMealType === 'lunch' ? '午餐' : '晚餐'} 拍照打卡成功！`);
    } catch (error) {
      console.error('打卡保存失败:', error);
    }
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
              <Text style={styles.likeIcon}>
                {currentMealPlan.liked ? '🧡' : '🤍'}
              </Text>
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
                <Text style={styles.healthLabel}>【膳食提示】</Text>
                <Text style={styles.recommendationText}>
                  {getCurrentMealTips()}
                </Text>
                {currentMealPlan.health_tips && (
                  <>
                    <Text style={styles.wellnessLabel}>【健康建议】</Text>
                    <Text style={styles.recommendationText}>
                      {currentMealPlan.health_tips}
                    </Text>
                  </>
                )}
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

        {/* 健康打卡日历 - 保持原有的打卡日历功能 */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>健康打卡日历</Text>
            <Text style={styles.calendarSubtitle}>
              本月已坚持健康饮食 {checkInRecords.length} 天，继续加油！
            </Text>
          </View>
          
          {/* 月份显示 */}
          <View style={styles.monthHeader}>
            <Text style={styles.monthText}>
              {new Date().getFullYear()}年{new Date().getMonth() + 1}月
            </Text>
          </View>
          
          {/* 日历滑动窗口 */}
          <FlatList
            data={Array.from({ length: 21 }, (_, i) => {
              const todayDate = new Date();
              const targetDate = new Date(todayDate);
              targetDate.setDate(todayDate.getDate() - 10 + i);
              return targetDate;
            })}
            renderItem={({ item: targetDate }) => {
              const day = targetDate.getDate();
              const weekDay = ['日', '一', '二', '三', '四', '五', '六'][targetDate.getDay()];
              const checkDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayCheckIns = checkInRecords.filter(record => record.date === checkDate);
              const isToday = targetDate.toDateString() === new Date().toDateString();
              
              return (
                <TouchableOpacity
                  style={[
                    styles.calendarDayCard,
                    dayCheckIns.length > 0 && styles.calendarDayWithRecord,
                    selectedDay === day && styles.calendarDaySelected,
                    isToday && styles.calendarDayToday
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[
                    styles.weekDayText,
                    selectedDay === day && styles.calendarDayTextSelected,
                    isToday && styles.calendarDayTextToday
                  ]}>
                    {weekDay}
                  </Text>
                  <Text style={[
                    styles.calendarDayText,
                    dayCheckIns.length > 0 && styles.calendarDayTextWithRecord,
                    selectedDay === day && styles.calendarDayTextSelected,
                    isToday && styles.calendarDayTextToday
                  ]}>
                    {day}
                  </Text>
                  {dayCheckIns.length > 0 && (
                    <View style={styles.checkInBadge}>
                      <Ionicons name="checkmark" size={14} color="#28a745" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.getTime().toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarScrollContainer}
            initialScrollIndex={10}
            getItemLayout={(data, index) => ({
              length: 80,
              offset: 80 * index,
              index,
            })}
          />

          {/* 打卡记录详情 - 保持原有的打卡记录显示逻辑 */}
          {(() => {
            const todayDate = new Date();
            const selectedDate = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
            const selectedDayRecords = checkInRecords.filter(record => record.date === selectedDate);
            
            if (selectedDayRecords.length === 0) {
              return (
                <View style={styles.noRecordsContainer}>
                  <Text style={styles.noRecordsText}>
                    {selectedDay}日 还没有打卡记录，开始今天的健康饮食吧！
                  </Text>
                </View>
              );
            }

            return (
              <View style={styles.checkInRecordsContainer}>
                <Text style={styles.recordsTitle}>
                  {selectedDay}日 的打卡记录 ({selectedDayRecords.length}条)
                </Text>
                
                {/* 横向滑动的打卡记录 */}
                <FlatList
                  data={selectedDayRecords}
                  renderItem={({ item: record }) => (
                    <View style={styles.checkInRecordCard}>
                      {/* 打卡信息头部 */}
                      <View style={styles.recordHeader}>
                        <Text style={styles.recordMealType}>
                          {record.mealType === 'breakfast' ? '🌅 早餐' : 
                           record.mealType === 'lunch' ? '☀️ 午餐' : '🌙 晚餐'}
                        </Text>
                        <Text style={styles.recordType}>
                          {record.type === 'quick' ? '快速打卡' : '📷 拍照打卡'}
                        </Text>
                        <Text style={styles.recordTime}>
                          {new Date(record.timestamp).toLocaleTimeString('zh-CN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                      </View>

                      {/* 打卡照片 */}
                      {record.photo && (
                        <View style={styles.recordPhotoContainer}>
                          <Image source={{ uri: record.photo }} style={styles.recordPhoto} />
                        </View>
                      )}

                      {/* 家庭互动 */}
                      <View style={styles.familyInteractionContainer}>
                        <View style={styles.interactionSummary}>
                          {record.likes.length > 0 && (
                            <View style={styles.interactionItem}>
                              <Ionicons name="heart" size={14} color="#ff6b6b" />
                              <Text style={styles.interactionText}>{record.likes.length}</Text>
                            </View>
                          )}
                          {record.comments.length > 0 && (
                            <View style={styles.interactionItem}>
                              <Ionicons name="chatbubble-outline" size={14} color="#28a745" />
                              <Text style={styles.interactionText}>{record.comments.length}</Text>
                            </View>
                          )}
                        </View>
                        
                        {/* 最新评论 */}
                        {record.comments.length > 0 && (
                          <Text style={styles.latestComment}>
                            {record.comments[0].user}: {record.comments[0].message}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recordsScrollContainer}
                />
              </View>
            );
          })()}
        </View>
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
    padding: 8,
  },
  likeIcon: {
    fontSize: 32,
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
    marginTop: 20,
  },

  // 打卡按钮容器
  checkInButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 16,
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
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  nutritionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 8,
  },
  healthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17a2b8',
    marginTop: 16,
    marginBottom: 8,
  },
  wellnessLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fd7e14',
    marginTop: 16,
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#495057',
    marginBottom: 4,
  },

  // 日历相关样式 - 保持原有样式
  calendarContainer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginBottom: 80,
  },
  calendarHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  calendarSubtitle: {
    fontSize: 18,
    color: '#28a745',
    fontWeight: '600',
  },
  monthHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
  },
  calendarScrollContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  calendarDayCard: {
    width: 70,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  weekDayText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 2,
  },
  calendarDayWithRecord: {
    backgroundColor: '#f0f9ff',
    borderColor: '#28a745',
    borderWidth: 3,
  },
  calendarDaySelected: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  calendarDayText: {
    fontSize: 18,
    color: '#495057',
    fontWeight: '600',
  },
  calendarDayTextWithRecord: {
    color: '#2196f3',
    fontWeight: '700',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarDayToday: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 3,
  },
  calendarDayTextToday: {
    color: '#856404',
    fontWeight: 'bold',
  },
  checkInBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#28a745',
  },

  // 打卡记录详情样式
  noRecordsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  noRecordsText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 26,
  },
  checkInRecordsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  recordsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  checkInRecordCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    width: 200,
    minHeight: 160,
  },
  recordHeader: {
    marginBottom: 8,
  },
  recordsScrollContainer: {
    paddingHorizontal: 4,
  },
  recordMealType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  recordType: {
    fontSize: 12,
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  recordTime: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  recordPhotoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  recordPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  interactionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  interactionText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  latestComment: {
    fontSize: 11,
    color: '#495057',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  familyInteractionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 8,
  },
}); 