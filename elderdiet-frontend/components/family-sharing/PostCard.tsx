import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Dimensions, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { MealRecordResponse, mealRecordsAPI, CommentInfo } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import CommentModal from './CommentModal';

const { width } = Dimensions.get('window');

interface PostCardProps {
  record: MealRecordResponse;
  onLikeToggle: (recordId: string) => void;
  onCommentAdded: (recordId: string, newComment: CommentInfo) => void;
}

export default function PostCard({ record, onLikeToggle, onCommentAdded }: PostCardProps) {
  const { token } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);

  // 处理点赞
  const handleLike = async () => {
    if (!token || isLiking) return;
    
    setIsLiking(true);
    try {
      await mealRecordsAPI.toggleLike(record.id, token);
      onLikeToggle(record.id);
    } catch (error) {
      console.error('点赞失败:', error);
      Alert.alert('错误', '点赞失败，请重试');
    } finally {
      setIsLiking(false);
    }
  };

  // 处理评论
  const handleComment = () => {
    setIsCommentModalVisible(true);
  };

  // 处理评论添加
  const handleCommentAdded = (newComment: CommentInfo) => {
    onCommentAdded(record.id, newComment);
    setIsCommentModalVisible(false);
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else {
      return '刚刚';
    }
  };

  // 渲染图片
  const renderImage = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.imageContainer}>
      <Image 
        source={{ uri: item }} 
        style={styles.postImage}
        resizeMode="cover"
      />
    </View>
  );

  return (
    <View style={styles.postCard}>
      {/* 用户信息头部 */}
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(record.user_info?.nickname ?? '用户').charAt(0)}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{record.user_info?.nickname || '用户'}</Text>
            <Text style={styles.postTime}>{formatTime(record.created_at)}</Text>
          </View>
        </View>
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      </View>

      {/* 图片轮播 */}
      {record.image_urls.length > 0 && (
        <View style={styles.imageSection}>
          <FlatList
            data={record.image_urls}
            renderItem={renderImage}
            keyExtractor={(item, index) => `${record.id}_image_${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              setImageIndex(newIndex);
            }}
            style={styles.imageList}
          />
          
          {/* 图片指示器 */}
          {record.image_urls.length > 1 && (
            <View style={styles.imageIndicator}>
              {record.image_urls.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicatorDot,
                    index === imageIndex && styles.indicatorDotActive
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* 文字内容 */}
      <View style={styles.contentSection}>
        <Text style={styles.captionText}>{record.caption}</Text>
      </View>

      {/* 用户互动评论 */}
      {record.comments.length > 0 && (
        <View style={styles.commentsSection}>
          {record.comments.slice(0, 2).map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <View style={styles.commentUser}>
                <Text style={styles.commentUserText}>{comment.user_info?.nickname || '用户'}留言：</Text>
              </View>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))}
          {record.comments.length > 2 && (
            <TouchableOpacity onPress={handleComment}>
              <Text style={styles.moreComments}>
                查看更多评论 ({record.comments_count}条)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 底部互动按钮 */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleLike}
          disabled={isLiking}
        >
          {isLiking ? (
            <ActivityIndicator size="small" color="#ff6b6b" />
          ) : (
            <Ionicons 
              name={record.liked_by_current_user ? "heart" : "heart-outline"} 
              size={24} 
              color={record.liked_by_current_user ? "#ff6b6b" : "#666"}
            />
          )}
          <Text style={[
            styles.actionText,
            record.liked_by_current_user && styles.actionTextActive
          ]}>
            {record.likes_count > 0 ? record.likes_count : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleComment}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#666" />
          <Text style={styles.actionText}>
            {record.comments_count > 0 ? record.comments_count : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 评论模态框 */}
      <CommentModal
        visible={isCommentModalVisible}
        recordId={record.id}
        onClose={() => setIsCommentModalVisible(false)}
        onCommentAdded={handleCommentAdded}
        initialComments={record.comments}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  newBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  imageSection: {
    marginBottom: 12,
  },
  imageList: {
    width: '100%',
  },
  imageContainer: {
    width: width,
    height: 200,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  indicatorDotActive: {
    backgroundColor: '#4CAF50',
  },
  contentSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  captionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#212529',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
    paddingTop: 12,
  },
  commentItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  commentUser: {
    marginBottom: 4,
  },
  commentUserText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#495057',
  },
  moreComments: {
    fontSize: 14,
    color: '#007bff',
    textAlign: 'center',
    marginTop: 4,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    minWidth: 80,
    justifyContent: 'center',
  },
  actionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  actionTextActive: {
    color: '#ff6b6b',
  },
}); 