import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { healthArticlesAPI, HealthArticle } from '@/services/api';
import { trackingService } from '@/services/trackingService';

const { width } = Dimensions.get('window');

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<HealthArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // 获取文章详情
  const fetchArticle = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await healthArticlesAPI.getArticle(id);
      if (response.success && response.data) {
        setArticle(response.data);
      } else {
        setError('文章加载失败');
      }
    } catch (err) {
      console.error('获取文章详情失败:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [id]);

  // 页面访问追踪
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔥 ArticleDetail useFocusEffect触发');
      try {
        console.log('🔥 开始文章详情页面访问追踪...');
        trackingService.startPageVisit('article-detail', '文章详情', `/article/${id}`);
        console.log('✅ 文章详情页面访问追踪调用完成');
      } catch (error) {
        console.error('❌ 文章详情页面访问追踪失败:', error);
      }
      
      return () => {
        console.log('🔥 文章详情页面离开，结束访问追踪');
        try {
          trackingService.endPageVisit('navigation');
        } catch (error) {
          console.error('❌ 结束文章详情页面访问追踪失败:', error);
        }
      };
    }, [id])
  );

  const toggleFavorite = () => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    // 追踪文章收藏事件
    trackingService.trackInteractionEvent('article_bookmark', {
      action: newFavoriteState ? 'add' : 'remove',
      articleId: id,
    });
    
    // TODO: 实现收藏功能的API调用
  };

  const handleShare = () => {
    // TODO: 实现分享功能
    Alert.alert('分享', '分享功能即将上线');
  };

  const renderParagraph = (paragraph: any, index: number) => {
    if (paragraph.type === 'text' && paragraph.content) {
      return (
        <Text key={`text-${index}`} style={styles.contentText}>
          {paragraph.content}
        </Text>
      );
    } else if (paragraph.type === 'image' && paragraph.url) {
      return (
        <View key={`image-${index}`} style={styles.imageContainer}>
          <Image
            source={{ uri: paragraph.url }}
            style={styles.contentImage}
            resizeMode="cover"
          />
          {/* {paragraph.caption && (
            <Text style={styles.imageCaption}>{paragraph.caption}</Text>
          )} */}
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>{error || '文章不存在'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchArticle}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 自定义头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>文章详情</Text>
        <View style={styles.headerActions}>
          {/* <TouchableOpacity onPress={toggleFavorite} style={styles.actionButton}>
            <Ionicons 
              name={isFavorite ? "star" : "star-outline"} 
              size={24} 
              color={isFavorite ? "#FFD700" : "#666"} 
            />
          </TouchableOpacity> */}
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 封面图片 */}
        {/* {article.cover_image && (
          <Image
            source={{ uri: article.cover_image }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        )} */}

        <View style={styles.articleContent}>
          {/* 文章标题 */}
          <Text style={styles.title}>{article.title}</Text>
          
          {/* 文章副标题 */}
          {article.subtitle && (
            <Text style={styles.subtitle}>{article.subtitle}</Text>
          )}

          {/* 文章元信息 */}
          <View style={styles.metaInfo}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{article.category}</Text>
            </View>
            <Text style={styles.readTime}>📖 {article.read_time}分钟阅读</Text>
          </View>

          {/* 标签 */}
          <View style={styles.tagsContainer}>
            {article.tags.map((tag, index) => (
              <View key={`${article.id}-tag-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* 文章内容 */}
          <View style={styles.contentContainer}>
            {article.content.paragraphs
              .sort((a, b) => a.order - b.order)
              .map((paragraph, index) => renderParagraph(paragraph, index))}
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  coverImage: {
    width: width,
    height: 200,
  },
  articleContent: {
    padding: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTag: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  readTime: {
    fontSize: 16,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  contentContainer: {
    marginBottom: 32,
  },
  contentText: {
    fontSize: 22,
    lineHeight: 28,
    color: '#333',
    marginBottom: 16,
  },
  imageContainer: {
    marginBottom: 20,
  },
  contentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  imageCaption: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
