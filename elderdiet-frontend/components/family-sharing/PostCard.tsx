import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { MealRecordResponse, mealRecordsAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import CommentModal from './CommentModal';
import UserAvatar from './UserAvatar';
import ImageViewer from './ImageViewer';

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
  onRecordUpdate?: (recordId: string, updatedRecord: MealRecordResponse) => void;
}

export default function PostCard({ record, onLikeToggle, onCommentAdded, onVisibilityToggle, onRecordUpdate }: PostCardProps) {
  const { token, uid } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isCheckingComment, setIsCheckingComment] = useState(false);
  const [localRecord, setLocalRecord] = useState(record);

  // 检查营养师评论是否生成
  useEffect(() => {
    // 如果记录分享给了营养师但还没有评论，定期检查
    if (localRecord.share_with_nutritionist && !localRecord.nutritionist_comment && token) {
      const checkComment = async () => {
        setIsCheckingComment(true);
        try {
          // 重新获取feed来检查评论是否生成
          const response = await mealRecordsAPI.getFeed(token, 1, 30);
          if (response.success && response.data) {
            const updatedRecord = response.data.records.find((r: any) => r.id === localRecord.id);
            if (updatedRecord && updatedRecord.nutritionist_comment) {
              setLocalRecord(updatedRecord);
              if (onRecordUpdate) {
                onRecordUpdate(localRecord.id, updatedRecord);
              }
            }
          }
        } catch (error) {
          console.error('检查营养师评论失败:', error);
        } finally {
          setIsCheckingComment(false);
        }
      };

      // 立即检查一次
      checkComment();

      // 每10秒检查一次，最多检查6次（1分钟）
      let checkCount = 0;
      const interval = setInterval(() => {
        checkCount++;
        if (checkCount >= 6) {
          clearInterval(interval);
          return;
        }
        checkComment();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [localRecord.share_with_nutritionist, localRecord.nutritionist_comment, localRecord.id, token, onRecordUpdate]);

  // 更新本地记录当props变化时
  useEffect(() => {
    setLocalRecord(record);
  }, [record]);

  // 处理点赞
  const handleLike = async () => {
    if (!token || isLiking) return;
    
    setIsLiking(true);
    try {
      await mealRecordsAPI.toggleLike(localRecord.id, token);
      onLikeToggle(localRecord.id);
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
    onCommentAdded(localRecord.id, newComment);
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
    if (localRecord.user_id !== uid) return;

    setIsUpdatingVisibility(true);
    try {
      const newVisibility = localRecord.visibility === 'PRIVATE' ? 'FAMILY' : 'PRIVATE';
      await mealRecordsAPI.updateRecordVisibility(localRecord.id, newVisibility, token);

      // 调用父组件的回调函数
      if (onVisibilityToggle) {
        onVisibilityToggle(localRecord.id, newVisibility);
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



  // 渲染图片网格
  const renderImageGrid = () => {
    if (localRecord.image_urls.length === 0) return null;
    
    const imageSize = 100; // 固定图片大小
    const spacing = 8;
    
    return (
      <View style={styles.imageGrid}>
        {localRecord.image_urls.slice(0, 3).map((imageUrl, index) => (
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
            avatar={localRecord.user_info?.avatar}
            name={localRecord.user_info?.username || '用户'}
            size={44}
            showBorder={true}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{localRecord.user_info?.username || '用户'}</Text>
            <Text style={styles.postTime}>{formatTime(localRecord.created_at)}</Text>
          </View>
        </View>
        {/* 可见性切换按钮 - 只有记录创建者可以看到 */}
        {localRecord.user_id === uid && (
          <TouchableOpacity
            style={[
              styles.visibilityBadge,
              localRecord.visibility === 'FAMILY' ? styles.visibilityBadgeFamily : styles.visibilityBadgePrivate
            ]}
            onPress={handleVisibilityToggle}
            disabled={isUpdatingVisibility}
          >
            {isUpdatingVisibility ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={localRecord.visibility === 'FAMILY' ? 'people' : 'lock-closed'}
                  size={12}
                  color="#fff"
                  style={styles.visibilityIcon}
                />
                <Text style={styles.visibilityBadgeText}>
                  {localRecord.visibility === 'FAMILY' ? '家庭可见' : '仅自己'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 文字内容 */}
      {localRecord.caption && (
        <View style={styles.contentSection}>
          <Text style={styles.captionText}>{localRecord.caption}</Text>
        </View>
      )}

      {/* 图片网格 */}
      {renderImageGrid()}

      {/* 营养师评论 */}
      {localRecord.share_with_nutritionist && (
        <View style={styles.nutritionistSection}>
          <View style={styles.nutritionistHeader}>
            <Ionicons name="medical" size={16} color="#28a745" />
            <Text style={styles.nutritionistTitle}>AI营养师评价</Text>
            {isCheckingComment && !localRecord.nutritionist_comment && (
              <ActivityIndicator size="small" color="#28a745" style={styles.loadingIndicator} />
            )}
          </View>

          {localRecord.nutritionist_comment ? (
            <View style={styles.nutritionistCommentContainer}>
              <Text style={styles.nutritionistComment}>
                {localRecord.nutritionist_comment}
              </Text>
              {localRecord.nutritionist_comment_at && (
                <Text style={styles.nutritionistTime}>
                  {formatTime(localRecord.nutritionist_comment_at)}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.nutritionistPending}>
              <Text style={styles.nutritionistPendingText}>
                {isCheckingComment ? '营养师正在分析中...' : '等待营养师评价'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 用户互动评论 */}
      {localRecord.comments.length > 0 && (
        <View style={styles.commentsSection}>
          {localRecord.comments.slice(0, 2).map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <View style={styles.commentHeader}>
                <UserAvatar
                  avatar={comment.user_avatar}
                  name={comment.username || '用户'}
                  size={30}
                />
                <View style={styles.commentUserInfo}>
                  <Text style={styles.commentUserName}>{comment.username || '用户'}</Text>
                  <Text style={styles.commentTime}>{formatTime(comment.created_at)}</Text>
                </View>
              </View>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))}
          {localRecord.comments.length > 2 && (
            <TouchableOpacity onPress={handleComment}>
              <Text style={styles.moreComments}>
                查看更多评论 ({localRecord.comments_count}条)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 底部互动按钮 - 紧凑布局 */}
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
              name={localRecord.liked_by_current_user ? "heart" : "heart-outline"}
              size={20}
              color={localRecord.liked_by_current_user ? "#ff6b6b" : "#999"}
            />
          )}
          {localRecord.likes_count > 0 && (
            <Text style={[
              styles.actionText,
              localRecord.liked_by_current_user && styles.actionTextActive
            ]}>
              {localRecord.likes_count}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleComment}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#999" />
          {localRecord.comments_count > 0 && (
            <Text style={styles.actionText}>
              {localRecord.comments_count}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 评论模态框 */}
      <CommentModal
        visible={isCommentModalVisible}
        recordId={localRecord.id}
        onClose={() => setIsCommentModalVisible(false)}
        onCommentAdded={handleCommentAdded}
        initialComments={localRecord.comments}
      />

      {/* 图片查看器 */}
      <ImageViewer
        visible={isImageViewerVisible}
        images={localRecord.image_urls}
        initialIndex={selectedImageIndex}
        onClose={() => setIsImageViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#F7F8FA',
    marginTop:12,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal:8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  userHeader: {
    backgroundColor: '#F7F8FA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    backgroundColor: '#F7F8FA',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    backgroundColor: '#F7F8FA',
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  contentSection: {
    backgroundColor: '#F7F8FA',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  captionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#212529',
  },
  imageGrid: {
    backgroundColor: '#F7F8FA',
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
    backgroundColor: '#F7F8FA',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8f8f8ff',
    marginTop: 6,
    paddingTop: 8,
  },
  commentItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#73d478ff',
  },
  commentHeader: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUserInfo: {
    backgroundColor: '#ffffff',
    marginLeft: 6,
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 1,
  },
  commentTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#495057',
  },
  moreComments: {
    fontSize: 14,
    color: '#007bff',
    textAlign: 'center',
    marginTop: 2,
  },
  actionSection: {
    backgroundColor: '#F7F8FA',
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#ff6b6b',
  },
  nutritionistSection: {
    backgroundColor: '#f8fff8',
    marginHorizontal: 8,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  nutritionistHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fff8',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionistTitle: {
    fontSize: 14,
    backgroundColor: '#f8fff8',
    fontWeight: '600',
    color: '#28a745',
    marginLeft: 6,
    flex: 1,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  nutritionistCommentContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#28a745',
  },
  nutritionistComment: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2d5a2d',
    fontWeight: '500',
  },
  nutritionistTime: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 6,
    textAlign: 'right',
  },
  nutritionistPending: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8f5e8',
    borderStyle: 'dashed',
  },
  nutritionistPendingText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});