import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { MealRecordResponse, mealRecordsAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import PostCard from './PostCard';
import { router, useFocusEffect } from 'expo-router';

// Local comment interface to match API structure
interface CommentInfo {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  username?: string;
  user_avatar?: string | null;
}

interface FamilySharingWallProps {
  onCreatePost?: () => void;
}

export default function FamilySharingWall({ onCreatePost }: FamilySharingWallProps) {
  const { token, isLoading: authLoading } = useAuth();
  const [records, setRecords] = useState<MealRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  // 获取分享墙数据（首次加载或刷新）
  const loadFeed = useCallback(async (refresh = false) => {
    if (!token) return;

    try {
      setError(null);
      const page = refresh ? 1 : currentPage;
      const response = await mealRecordsAPI.getFeed(token, page, pageSize);

      if (response.success && response.data) {
        if (refresh) {
          // 刷新时替换所有数据
          setRecords(response.data.records);
          setCurrentPage(1);
        } else {
          // 首次加载时设置数据
          setRecords(response.data.records);
        }

        setHasMore(response.data.hasMore);
        setTotalRecords(response.data.totalRecords);
      } else {
        setRecords([]);
        setHasMore(false);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error('获取分享墙数据失败:', error);
      setError('获取分享墙数据失败');
      setRecords([]);
      setHasMore(false);
      setTotalRecords(0);
    }
  }, [token, currentPage, pageSize]);

  // 加载更多数据
  const loadMoreFeed = useCallback(async () => {
    if (!token || !hasMore || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const response = await mealRecordsAPI.getFeed(token, nextPage, pageSize);

      if (response.success && response.data) {
        // 追加新数据到现有数据
        setRecords(prevRecords => [...prevRecords, ...response.data!.records]);
        setCurrentPage(nextPage);
        setHasMore(response.data.hasMore);
        setTotalRecords(response.data.totalRecords);
      }
    } catch (error) {
      console.error('加载更多数据失败:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [token, currentPage, pageSize, hasMore, isLoadingMore]);

  // 初始加载
  useEffect(() => {
    if (!authLoading && token) {
      loadFeed().finally(() => setIsLoading(false));
    }
  }, [token, authLoading, loadFeed]);

  // 页面获得焦点时自动刷新
  useFocusEffect(
    useCallback(() => {
      if (!authLoading && token) {
        loadFeed();
      }
    }, [authLoading, token, loadFeed])
  );

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadFeed(true); // 传入refresh=true
    setIsRefreshing(false);
  }, [loadFeed]);

  // 处理点赞状态变化
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

  // 处理评论添加
  const handleCommentAdded = useCallback((recordId: string, newComment: CommentInfo) => {
    setRecords(prevRecords =>
      prevRecords.map(record => {
        if (record.id === recordId) {
          // Convert to API format
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
            comments: [apiComment, ...record.comments] as any, // Type cast to avoid TypeScript errors
            comments_count: record.comments_count + 1
          };
        }
        return record;
      })
    );
  }, []);

  // 处理可见性切换
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

  // 处理记录更新（营养师评论等）
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

  // 处理创建新分享
  const handleCreatePost = useCallback(() => {
    if (onCreatePost) {
      onCreatePost();
    } else {
      router.push('/create-post');
    }
  }, [onCreatePost]);

  // 渲染单条记录
  const renderRecord = ({ item }: { item: MealRecordResponse }) => (
    <PostCard
      record={item}
      onLikeToggle={handleLikeToggle}
      onCommentAdded={handleCommentAdded}
      onVisibilityToggle={handleVisibilityToggle}
      onRecordUpdate={handleRecordUpdate}
    />
  );

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="restaurant-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>还没有分享记录</Text>
      <Text style={styles.emptySubtitle}>
        快来记录今天的美味时光吧！
      </Text>
    </View>
  );

  // 渲染错误状态
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={60} color="#dc3545" />
      <Text style={styles.errorTitle}>加载失败</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
    </View>
  );

  // 如果正在加载认证信息
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>正在加载...</Text>
      </View>
    );
  }

  // 如果没有token
  if (!token) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={60} color="#dc3545" />
        <Text style={styles.errorTitle}>请先登录</Text>
        <Text style={styles.errorSubtitle}>登录后可以查看家庭分享墙</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 标题头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>家庭味道墙</Text>
        <Text style={styles.headerSubtitle}>记录今天的温暖时刻</Text>
      </View>

      {/* 分享列表 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>正在加载分享墙...</Text>
        </View>
      ) : error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={records}
          renderItem={renderRecord}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContainer,
            records.length === 0 && styles.emptyListContainer
          ]}
          // 无限滚动配置
          onEndReached={loadMoreFeed}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() => {
            if (isLoadingMore) {
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
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
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
});