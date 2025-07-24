import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, SectionList, TouchableOpacity, Alert, StatusBar, ActivityIndicator, Dimensions, Image, RefreshControl } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { mealPlanAPI, MealPlan as APIMealPlan, Dish, profileAPI, checkProfileCompleteness as checkProfileCompletenessUtil, ProfileCompletenessResult, MealRecordResponse, mealRecordsAPI } from '@/services/api';
import { gamificationAPI } from '@/services/api';
import DishItem from '@/components/meal-plan/DishItem';
import PostCard from '@/components/family-sharing/PostCard';
import ProfileCompletenessAlert from '@/components/ProfileCompletenessAlert';
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
  today_water_count: number; // 新增字段：今日浇水次数
}

export default function MealPlanScreen() {
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [currentMealPlan, setCurrentMealPlan] = useState<APIMealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, isLoading: authLoading } = useAuth();
  const { role, uid } = useUser();

  // 新增树状态相关状态
  const [treeStatus, setTreeStatus] = useState<TreeStatusData | null>(null);
  const [isLoadingTreeStatus, setIsLoadingTreeStatus] = useState(false);

  // 健康档案完整性相关状态
  const [profileCompleteness, setProfileCompleteness] = useState<ProfileCompletenessResult | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // 家庭分享墙相关状态
  const [records, setRecords] = useState<MealRecordResponse[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isRefreshingRecords, setIsRefreshingRecords] = useState(false);
  const [isLoadingMoreRecords, setIsLoadingMoreRecords] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

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
  const handleDishChange = async (mealType: 'breakfast' | 'lunch' | 'dinner', dishIndex: number): Promise<void> => {
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
      throw error; // 重新抛出错误，让DishItem组件知道操作失败
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

  // 检查健康档案完整性
  const loadProfileCompleteness = async () => {
    if (!token || !uid) return;

    setIsLoadingProfile(true);

    try {
      const response = await profileAPI.getProfile(uid, token);
      const profile = response.success && response.data ? response.data : null;
      const completenessResult = checkProfileCompletenessUtil(profile);
      setProfileCompleteness(completenessResult);
    } catch (error) {
      console.error('Failed to load profile for completeness check:', error);
      // 如果获取档案失败，假设档案不完整
      setProfileCompleteness({
        isComplete: false,
        missingFields: ['健康档案信息'],
        completionPercentage: 0,
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // 家庭分享墙相关函数
  const loadFeed = useCallback(async (refresh = false) => {
    if (!token) return;

    try {
      setRecordsError(null);
      // loadFeed 始终加载第1页，用于初始加载和刷新
      const page = 1;
      const response = await mealRecordsAPI.getFeed(token, page, pageSize);

      if (response.success && response.data) {
        setRecords(response.data.records);
        setCurrentPage(1);
        setHasMore(response.data.has_more);
        setTotalRecords(response.data.total_records);
      } else {
        setRecords([]);
        setHasMore(false);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error('获取分享墙数据失败:', error);
      setRecordsError('获取分享墙数据失败');
      setRecords([]);
      setHasMore(false);
      setTotalRecords(0);
    }
  }, [token, pageSize]);

  const loadMoreFeed = useCallback(async () => {
    console.log('loadMoreFeed called, token:', !!token, 'hasMore:', hasMore, 'isLoading:', isLoadingMoreRecords, 'currentPage:', currentPage);
    if (!token || !hasMore || isLoadingMoreRecords) {
      console.log('loadMoreFeed early return');
      return;
    }

    try {
      setIsLoadingMoreRecords(true);
      const nextPage = currentPage + 1;
      console.log('Loading page:', nextPage);
      const response = await mealRecordsAPI.getFeed(token, nextPage, pageSize);

      if (response.success && response.data) {
        console.log('Loaded', response.data.records.length, 'records, hasMore:', response.data.has_more);
        setRecords(prevRecords => [...prevRecords, ...response.data!.records]);
        setCurrentPage(nextPage);
        setHasMore(response.data.has_more);
        setTotalRecords(response.data.total_records);
      }
    } catch (error) {
      console.error('加载更多数据失败:', error);
    } finally {
      setIsLoadingMoreRecords(false);
    }
  }, [token, currentPage, pageSize, hasMore, isLoadingMoreRecords]);

  const handleEndReached = useCallback(() => {
    console.log('onEndReached triggered, hasMore:', hasMore, 'isLoadingMoreRecords:', isLoadingMoreRecords);
    if (hasMore && !isLoadingMoreRecords) {
      loadMoreFeed();
    }
  }, [loadMoreFeed, hasMore, isLoadingMoreRecords]);

  const handleLikeToggle = useCallback((recordId: string) => {
    setRecords(prevRecords => 
      prevRecords.map(record => {
        if (record.id === recordId) {
          const newLikedState = !record.liked_by_current_user;
          return {
            ...record,
            liked_by_current_user: newLikedState,
            likes_count: newLikedState ? record.likes_count + 1 : record.likes_count - 1
          };
        }
        return record;
      })
    );
  }, []);

  const handleCommentAdded = useCallback((recordId: string, newComment: any) => {
    setRecords(prevRecords =>
      prevRecords.map(record => {
        if (record.id === recordId) {
          const apiComment = {
            id: newComment.id,
            user_id: newComment.user_id,
            text: newComment.text,
            created_at: newComment.created_at,
            username: newComment.username || '我',
            user_avatar: newComment.user_avatar
          };

          return {
            ...record,
            comments: [apiComment, ...record.comments] as any,
            comments_count: record.comments_count + 1
          };
        }
        return record;
      })
    );
  }, []);

  const handleVisibilityToggle = useCallback((recordId: string, newVisibility: 'PRIVATE' | 'FAMILY') => {
    setRecords(prevRecords =>
      prevRecords.map(record => {
        if (record.id === recordId) {
          return {
            ...record,
            visibility: newVisibility
          };
        }
        return record;
      })
    );
  }, []);

  const handleRecordUpdate = useCallback((recordId: string, updatedRecord: MealRecordResponse) => {
    setRecords(prevRecords =>
      prevRecords.map(record => {
        if (record.id === recordId) {
          return updatedRecord;
        }
        return record;
      })
    );
  }, []);

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
      loadProfileCompleteness();
      loadFeed().finally(() => setIsLoadingRecords(false));
    }
  }, [token, authLoading]);
  
  // 页面重新获取焦点时刷新树状态和健康档案完整性（从拍照打卡页面或编辑档案页面返回时）
  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadTreeStatus();
        loadProfileCompleteness();
        loadFeed();
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



  // 组织SectionList的数据结构
  const sectionData = [
    {
      key: 'mealPlan',
      data: ['content']
    },
    {
      key: 'familySharing',
      data: records
    }
  ];

  const handleRefresh = useCallback(async () => {
    setIsRefreshingRecords(true);
    await Promise.all([
      loadTodayMealPlan(),
      loadTreeStatus(),
      loadProfileCompleteness(),
      loadFeed(true)
    ]);
    setIsRefreshingRecords(false);
  }, [loadFeed]);

  const renderSectionItem = ({ item, section }: { item: any; section: any }) => {
    if (section.key === 'mealPlan') {
      return (
        <View>
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

          {/* 健康档案完整性提醒 */}
          {profileCompleteness && !profileCompleteness.isComplete && (
            <ProfileCompletenessAlert
              completenessResult={profileCompleteness}
            />
          )}

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
                <Text style={styles.emptySubtext}>点击上方"AI推荐"按钮生成今日膳食计划</Text>
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
                      {treeStatus.stage_description} • 已种植{treeStatus.completed_trees}棵大树
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
                  
                  {role !== 'CHILD' && (
                    <>
                      <TouchableOpacity 
                        style={styles.mealRecordButton}
                        onPress={handlePhotoCheckIn}
                      >
                        <View style={styles.buttonContent}>
                          <Ionicons name="camera" size={24} color="#fff" />
                          <Text style={styles.mealRecordButtonText}>
                            记录今日美食
                            {treeStatus.today_water_count === 0 ? " • 帮小树浇水" : 
                             treeStatus.today_water_count === 1 ? "" : ""}
                          </Text>
                        </View>
                        {treeStatus.today_water_count > 0 && (
                          <View style={styles.waterStatusBadge}>
                            {[0, 1].map((idx) => (
                              <Ionicons
                                key={idx}
                                name="water"
                                size={16}
                                color={treeStatus.today_water_count > idx ? '#339CFF' : '#aaaaaa'}
                                style={{ marginRight: idx === 0 ? 2 : 0 }}
                              />
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                      {/* 浇水间隔提示 */}
                      {treeStatus.today_water_count === 1 && (
                        <View style={styles.wateringTipContainer}>
                          <Ionicons name="time-outline" size={16} color="#28a745" style={{marginRight: 4}} />
                          <Text style={styles.wateringTipText}>当天首次浇水后3小时后可再次浇水</Text>
                        </View>
                      )}
                    </>
                  )}
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
          </View>
        </View>
      );
    } else if (section.key === 'familySharing') {
      return (
        <PostCard
          record={item}
          onLikeToggle={handleLikeToggle}
          onCommentAdded={handleCommentAdded}
          onVisibilityToggle={handleVisibilityToggle}
          onRecordUpdate={handleRecordUpdate}
        />
      );
    }
    return null;
  };

  const renderSectionHeader = ({ section }: { section: any }) => {
    if (section.key === 'familySharing') {
      return (
        <View style={styles.familySharingHeader}>
          <Text style={styles.familySharingTitle}>家庭味道墙</Text>
          <Text style={styles.familySharingSubtitle}>记录今天的温暖时刻</Text>
        </View>
      );
    }
    return null;
  };

  const renderListFooter = () => {
    if (isLoadingMoreRecords) {
      return (
        <View style={styles.loadMoreContainer}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.loadMoreText}>加载更多...</Text>
        </View>
      );
    }
    if (!hasMore && records.length > 0) {
      return (
        <View style={styles.loadMoreContainer}>
          <Text style={styles.noMoreText}>没有更多内容了</Text>
        </View>
      );
    }
    return null;
  };

  const renderListEmpty = () => {
    if (isLoadingRecords) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>正在加载分享墙...</Text>
        </View>
      );
    }
    if (recordsError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#dc3545" />
          <Text style={styles.errorTitle}>加载失败</Text>
          <Text style={styles.errorSubtitle}>{recordsError}</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="restaurant-outline" size={60} color="#ccc" />
        <Text style={styles.emptyTitle}>还没有分享记录</Text>
        <Text style={styles.emptySubtitle}>快来记录今天的美味时光吧！</Text>
      </View>
    );
  };

  // 如果正在加载认证信息，显示加载状态
  if (authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>正在加载...</Text>
        </View>
      </View>
    );
  }

  // 如果没有token，显示错误
  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>请先登录</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 固定Header */}
      <View style={[styles.header, { paddingTop: (StatusBar.currentHeight || 44) + 16 }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.currentDate}>{getCurrentDate()}</Text>
            <Text style={styles.title}>今日膳食</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.headerButton, styles.aiRecommendHeaderButton]}
              onPress={generateTodayMealPlan}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="sparkles" size={18} color="#fff" />
              )}
              <Text style={styles.headerButtonText}>
                {isGenerating ? '生成中' : 'AI推荐'}
              </Text>
            </TouchableOpacity>
            {currentMealPlan && (
              <TouchableOpacity 
                style={[styles.headerButton, styles.likeButton]}
                onPress={toggleLike}
              >
                <Ionicons 
                  name={currentMealPlan.liked ? 'heart' : 'heart-outline'} 
                  size={18} 
                  color={currentMealPlan.liked ? '#FF0000' : '#333'} 
                />
                <Text style={[styles.likeButtonText, {color: currentMealPlan.liked ? '#FF0000' : '#333'}]}>
                  {currentMealPlan.liked ? '喜欢' : '喜欢'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      
      <SectionList
        sections={sectionData}
        renderItem={renderSectionItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item, index) => {
          if (typeof item === 'string') return item;
          return item.id || `record-${index}`;
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingRecords}
            onRefresh={handleRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderListEmpty}
        contentContainerStyle={styles.sectionListContainer}
        stickySectionHeadersEnabled={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={100}
        initialNumToRender={10}
        windowSize={10}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  currentDate: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#212529',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  aiRecommendHeaderButton: {
    backgroundColor: '#007bff',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  likeButton: {
    backgroundColor: '#f0f0f0',
  },
  likeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
    marginTop: 20,
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
    backgroundColor: '#f8fff9',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  treeTitle: {
    fontSize: 20,
    backgroundColor: '#f8fff9',
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
    backgroundColor: '#f8fff9',
    borderRadius: 8, // 圆角矩形
    paddingHorizontal: 8, // 水平内边距
    height: 28, // 稍微高一点
    minWidth: 40, // 最小宽度
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  waterCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  wateringTipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  wateringTipText: {
    color: '#28a745',
    fontSize: 13,
    marginLeft: 2,
  },

  // AI推荐按钮 - 相关样式已合并至Header
  aiRecommendButton: {},
  aiRecommendButtonText: {},

  // SectionList 相关样式
  sectionListContainer: {
    paddingBottom: 20,
  },

  // 家庭分享墙头部样式
  familySharingHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  familySharingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  familySharingSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },

  // 加载更多相关样式
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
  },
  noMoreText: {
    fontSize: 14,
    color: '#adb5bd',
    fontStyle: 'italic',
  },

  // 错误和空状态样式
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 