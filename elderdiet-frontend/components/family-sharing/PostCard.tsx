import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { MealRecordResponse, mealRecordsAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import CommentModal from './CommentModal';
import UserAvatar from './UserAvatar';
import ImageViewer from './ImageViewer';

const { width } = Dimensions.get('window');

// Local comment interface to match API structure
interface CommentInfo {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  username?: string;
  user_avatar?: string | null;
}

interface PostCardProps {
  record: MealRecordResponse;
  onLikeToggle: (recordId: string) => void;
  onCommentAdded: (recordId: string, newComment: CommentInfo) => void;
  onVisibilityToggle?: (recordId: string, newVisibility: 'PRIVATE' | 'FAMILY') => void;
}

export default function PostCard({ record, onLikeToggle, onCommentAdded, onVisibilityToggle }: PostCardProps) {
  const { token, uid } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

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

  // 处理图片点击
  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageViewerVisible(true);
  };

  // 处理可见性切换
  const handleVisibilityToggle = async () => {
    if (!token || isUpdatingVisibility || !uid) return;

    // 只有记录的创建者可以修改可见性
    if (record.user_id !== uid) return;

    setIsUpdatingVisibility(true);
    try {
      const newVisibility = record.visibility === 'PRIVATE' ? 'FAMILY' : 'PRIVATE';
      await mealRecordsAPI.updateRecordVisibility(record.id, newVisibility, token);

      // 调用父组件的回调函数
      if (onVisibilityToggle) {
        onVisibilityToggle(record.id, newVisibility);
      }
    } catch (error) {
      console.error('切换可见性失败:', error);
      Alert.alert('错误', '切换可见性失败，请重试');
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  };

  // 计算图片网格布局
  const getImageGridLayout = (imageCount: number) => {
    const containerWidth = width - 32; // 减去左右padding
    const spacing = 8;
    
    if (imageCount === 1) {
      return {
        itemWidth: containerWidth,
        itemHeight: 200,
        columns: 1,
      };
    } else if (imageCount === 2) {
      return {
        itemWidth: (containerWidth - spacing) / 2,
        itemHeight: 150,
        columns: 2,
      };
    } else if (imageCount === 3) {
      return {
        itemWidth: (containerWidth - spacing) / 2,
        itemHeight: 120,
        columns: 2,
      };
    } else if (imageCount === 4) {
      return {
        itemWidth: (containerWidth - spacing) / 2,
        itemHeight: 120,
        columns: 2,
      };
    } else {
      return {
        itemWidth: (containerWidth - spacing * 2) / 3,
        itemHeight: 100,
        columns: 3,
      };
    }
  };

  // 渲染图片网格
  const renderImageGrid = () => {
    if (record.image_urls.length === 0) return null;
    
    const imageSize = 100; // 固定图片大小
    const spacing = 8;
    
    return (
      <View style={styles.imageGrid}>
        {record.image_urls.slice(0, 3).map((imageUrl, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.imageItem,
              {
                width: imageSize,
                height: imageSize,
                marginRight: index < 2 ? spacing : 0,
              }
            ]}
            onPress={() => handleImagePress(index)}
          >
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.gridImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.postCard}>
      {/* 用户信息头部 */}
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <UserAvatar 
            avatar={record.user_info?.avatar}
            name={record.user_info?.username || '用户'}
            size={44}
            showBorder={true}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{record.user_info?.username || '用户'}</Text>
            <Text style={styles.postTime}>{formatTime(record.created_at)}</Text>
          </View>
        </View>
        {/* 可见性切换按钮 - 只有记录创建者可以看到 */}
        {record.user_id === uid && (
          <TouchableOpacity
            style={[
              styles.visibilityBadge,
              record.visibility === 'FAMILY' ? styles.visibilityBadgeFamily : styles.visibilityBadgePrivate
            ]}
            onPress={handleVisibilityToggle}
            disabled={isUpdatingVisibility}
          >
            {isUpdatingVisibility ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={record.visibility === 'FAMILY' ? 'people' : 'lock-closed'}
                  size={12}
                  color="#fff"
                  style={styles.visibilityIcon}
                />
                <Text style={styles.visibilityBadgeText}>
                  {record.visibility === 'FAMILY' ? '家庭可见' : '仅自己'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 文字内容 */}
      {record.caption && (
        <View style={styles.contentSection}>
          <Text style={styles.captionText}>{record.caption}</Text>
        </View>
      )}

      {/* 图片网格 */}
      {renderImageGrid()}

      {/* 用户互动评论 */}
      {record.comments.length > 0 && (
        <View style={styles.commentsSection}>
          {record.comments.slice(0, 2).map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <View style={styles.commentHeader}>
                <UserAvatar 
                  avatar={comment.user_avatar}
                  name={comment.username || '用户'}
                  size={24}
                />
                <View style={styles.commentUserInfo}>
                  <Text style={styles.commentUserName}>{comment.username || '用户'}</Text>
                  <Text style={styles.commentTime}>{formatTime(comment.created_at)}</Text>
                </View>
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

      {/* 图片查看器 */}
      <ImageViewer
        visible={isImageViewerVisible}
        images={record.image_urls}
        initialIndex={selectedImageIndex}
        onClose={() => setIsImageViewerVisible(false)}
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
  userDetails: {
    flex: 1,
    marginLeft: 12,
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
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 70,
    justifyContent: 'center',
  },
  visibilityBadgeFamily: {
    backgroundColor: '#4CAF50',
  },
  visibilityBadgePrivate: {
    backgroundColor: '#FF9800',
  },
  visibilityIcon: {
    marginRight: 4,
  },
  visibilityBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
  imageGrid: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 10,  // 添加左边距
  },
  imageItem: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  moreImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserInfo: {
    marginLeft: 8,
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#6c757d',
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