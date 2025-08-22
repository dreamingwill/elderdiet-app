import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mealRecordsAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import UserAvatar from './UserAvatar';
import { trackingService } from '@/services/trackingService';

const { height } = Dimensions.get('window');

// 更新评论接口以匹配API返回格式
interface CommentInfo {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  username?: string;
  user_avatar?: string | null;
}

interface CommentModalProps {
  visible: boolean;
  recordId: string;
  onClose: () => void;
  onCommentAdded: (newComment: CommentInfo) => void;
  initialComments?: CommentInfo[];
}

export default function CommentModal({ 
  visible, 
  recordId, 
  onClose, 
  onCommentAdded,
  initialComments = []
}: CommentModalProps) {
  const { token } = useAuth();
  const [comments, setComments] = useState<CommentInfo[]>(initialComments);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取评论列表
  const loadComments = useCallback(async () => {
    if (!token || !recordId) return;
    
    setIsLoading(true);
    try {
      const response = await mealRecordsAPI.getComments(recordId, token);
      if (response.success && response.data) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('获取评论失败:', error);
      Alert.alert('错误', '获取评论失败');
    } finally {
      setIsLoading(false);
    }
  }, [token, recordId]);

  // 发表评论
  const handleSubmitComment = useCallback(async () => {
    if (!token || !commentText.trim()) return;
    
    const trimmedText = commentText.trim();
    
    setIsSubmitting(true);
    try {
      const response = await mealRecordsAPI.addComment(
        recordId, 
        { text: trimmedText }, 
        token
      );
      
      if (response.success && response.data) {
        // 创建新评论对象，使用API返回的格式
        const newComment: CommentInfo = {
          id: response.data.id,
          user_id: response.data.user_id,
          text: response.data.text,
          created_at: response.data.created_at,
          // 使用当前用户信息（实际应用中可能需要从应用状态获取）
          username: response.data.username, // 临时显示当前用户为"我"
          user_avatar: response.data.user_avatar
        };
        
        setComments(prev => [newComment, ...prev]);
        setCommentText('');
        onCommentAdded(newComment);
        
        // 追踪评论成功事件
        trackingService.trackFeatureSuccess('add_comment', {
          recordId,
          commentLength: trimmedText.length,
          previousCommentCount: comments.length,
        });
        
        Alert.alert('成功', '评论发表成功！');
      }
    } catch (error) {
      console.error('发表评论失败:', error);
      
      // 追踪评论失败事件
      trackingService.trackFeatureFailure('add_comment', error instanceof Error ? error : '发表评论失败', {
        recordId,
        commentLength: trimmedText.length,
        previousCommentCount: comments.length,
      });
      
      Alert.alert('错误', '发表评论失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [token, recordId, commentText, onCommentAdded, comments.length]);

  // 当模态框打开时加载评论
  useEffect(() => {
    if (visible && recordId) {
      loadComments();
    }
  }, [visible, recordId, loadComments]);

  // 重置状态
  useEffect(() => {
    if (!visible) {
      setCommentText('');
      setComments(initialComments);
    }
  }, [visible, initialComments]);

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

  // 渲染单条评论
  const renderComment = ({ item }: { item: CommentInfo }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <UserAvatar 
          avatar={item.user_avatar}
          name={item.username || '用户'}
          size={36}
          showBorder={false}
        />
        <View style={styles.commentDetails}>
          <Text style={styles.commentUser}>{item.username || '用户'}</Text>
          <Text style={styles.commentTime}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
      <Text style={styles.commentText}>{item.text}</Text>
    </View>
  );

  // 渲染空状态
  const renderEmptyComments = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
      <Text style={styles.emptyText}>还没有评论</Text>
      <Text style={styles.emptySubtext}>快来发表第一条评论吧！</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* 拖拽指示器 */}
            <View style={styles.dragIndicator} />

            {/* 头部 */}
            <View style={styles.header}>
          <Text style={styles.title}>评论</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 评论列表 */}
        <View style={styles.commentsContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>正在加载评论...</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyComments}
              contentContainerStyle={[
                styles.commentsList,
                comments.length === 0 && styles.emptyList
              ]}
            />
          )}
        </View>

        {/* 评论输入框 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="写下你的评论..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled
            ]}
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.75, // 占据屏幕3/4高度
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 20, // 减少顶部间距
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  closeButton: {
    padding: 4,
  },
  commentsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  commentsList: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F7F8FA',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  commentItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentDetails: {
    flex: 1,
    marginLeft: 12,
  },
  commentUser: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 13,
    color: '#6c757d',
  },
  commentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#495057',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#F7F8FA',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
}); 