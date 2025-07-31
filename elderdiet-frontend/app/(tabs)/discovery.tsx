import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  ImageBackground,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Carousel from 'react-native-reanimated-carousel';
import { useRouter } from 'expo-router';
import { healthArticlesAPI, HealthArticle } from '@/services/api';

const { width } = Dimensions.get('window');



// 营养分类
const nutritionCategories = [
  { id: '1', title: '血糖管理', icon: 'pulse-outline', color: '#FF6B6B', bgColor: '#FFE8E8' },
  { id: '2', title: '心血管保护', icon: 'heart-outline', color: '#4ECDC4', bgColor: '#E8F8F7' },
  { id: '3', title: '骨骼健康', icon: 'fitness-outline', color: '#45B7D1', bgColor: '#E8F4FD' },
  { id: '4', title: '消化养胃', icon: 'restaurant-outline', color: '#96CEB4', bgColor: '#F0F8F4' },
  { id: '5', title: '免疫增强', icon: 'shield-outline', color: '#FECA57', bgColor: '#FFF8E1' },
  { id: '6', title: '睡眠改善', icon: 'moon-outline', color: '#A55EEA', bgColor: '#F3E8FF' }
];



interface NutritionItem {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
}

export default function DiscoveryScreen() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('nutrition');
  const [expandedArticles, setExpandedArticles] = useState<string[]>([]);
  
  // 新增：API数据状态
  const [carouselArticles, setCarouselArticles] = useState<HealthArticle[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<HealthArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取轮播图数据
  const fetchCarouselArticles = async () => {
    try {
      const response = await healthArticlesAPI.getCarouselArticles();
      if (response.success && response.data) {
        setCarouselArticles(response.data);
      }
    } catch (err) {
      console.error('获取轮播图数据失败:', err);
      // 轮播图失败不影响整体页面，所以不设置error状态
    }
  };

  // 获取推荐文章数据
  const fetchFeaturedArticles = async () => {
    try {
      const response = await healthArticlesAPI.getFeaturedArticles(10);
      if (response.success && response.data) {
        setFeaturedArticles(response.data);
        setError(null); // 清除之前的错误状态
      } else {
        setError('获取推荐文章失败');
      }
    } catch (err) {
      console.error('获取推荐文章失败:', err);
      setError('网络连接失败，请检查网络后重试');
    }
  };

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchCarouselArticles(),
        fetchFeaturedArticles()
      ]);
    } catch (err) {
      setError('数据加载失败，请稍后重试');
      console.error('数据加载失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      // 可以在这里添加成功提示，比如使用Toast
      console.log('刷新成功');
    } catch (err) {
      console.error('刷新失败:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadData();
  }, []);

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(item => item !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const toggleArticleExpansion = (id: string) => {
    if (expandedArticles.includes(id)) {
      setExpandedArticles(expandedArticles.filter(item => item !== id));
    } else {
      setExpandedArticles([...expandedArticles, id]);
    }
  };

  const navigateToArticle = (articleId: string) => {
    router.push(`/article/${articleId}`);
  };

  // 渲染轮播图项
  const renderCarouselItem = ({ item }: { item: HealthArticle }) => {
    return (
      <TouchableOpacity onPress={() => navigateToArticle(item.id)}>
        <ImageBackground
          source={{ uri: item.cover_image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400' }}
          style={styles.carouselItem}
          imageStyle={{ borderRadius: 12 }}
        >
          <View style={styles.carouselOverlay}>
            <Text style={styles.carouselTitle}>{item.title}</Text>
            <Text style={styles.carouselSubtitle}>{item.subtitle || ''}</Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  // 渲染营养分类项
  const renderNutritionItem = ({ item }: { item: NutritionItem }) => {
    return (
      <TouchableOpacity style={[styles.nutritionItem, { backgroundColor: item.bgColor }]}>
        <View style={[styles.nutritionIconContainer, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon as any} size={20} color={item.color} />
        </View>
        <Text style={[styles.nutritionTitle, { color: item.color }]}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  // 渲染文章项
  const renderArticleItem = ({ item }: { item: HealthArticle }) => {
    const isFavorite = favorites.includes(item.id);
    const isExpanded = expandedArticles.includes(item.id);
    
    // 获取文本段落
    const textParagraphs = item.content.paragraphs
      .filter(p => p.type === 'text' && p.content)
      .map(p => p.content!);
    
    const previewContent = textParagraphs.slice(0, 2); // 只显示前两段
    const displayContent = isExpanded ? textParagraphs : previewContent;
    
    return (
      <TouchableOpacity
        style={styles.articleItem}
        onPress={() => navigateToArticle(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.articleHeader}>
          <View style={styles.articleTitleContainer}>
            <Text style={styles.articleTitle}>{item.title}</Text>
            <View style={styles.articleMeta}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <Text style={styles.readTime}>📖 {item.read_time}分钟</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
          >
            <Ionicons 
              name={isFavorite ? "star" : "star-outline"} 
              size={24} 
              color={isFavorite ? "#FFD700" : "#999"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* 标签 */}
        <View style={styles.tagsContainer}>
          {item.tags.map((tag, index) => (
            <View key={`${item.id}-tag-${index}`} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        {/* 内容 */}
        {displayContent.map((paragraph: string, index: number) => (
          <Text key={`${paragraph}-${index}`} style={styles.articleParagraph}>
            {paragraph}
          </Text>
        ))}
        
        {/* 展开/收起按钮 */}
        {textParagraphs.length > 2 && (
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleArticleExpansion(item.id);
            }}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? '收起' : '展开全文'}
            </Text>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#4CAF50" 
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 固定顶部导航栏 */}
      <View style={styles.fixedHeader}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'nutrition' && styles.activeTab]}
            onPress={() => setActiveTab('nutrition')}
          >
            <Text style={[styles.tabText, activeTab === 'nutrition' && styles.activeTabText]}>
              营养知识
            </Text>
          </TouchableOpacity>
          
          {/* <TouchableOpacity 
            style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
            onPress={() => setActiveTab('nearby')}
          >
            <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText]}>
              附近
            </Text>
          </TouchableOpacity> */}
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
            title="下拉刷新"
            titleColor="#666"
          />
        }
      >
        {/* 营养知识内容 */}
        {activeTab === 'nutrition' && (
          <View>
            {/* 轮播图 */}
            {carouselArticles.length > 0 && (
              <View style={styles.carouselContainer}>
                <Carousel
                  loop
                  width={width - 32}
                  height={180}
                  autoPlay={true}
                  data={carouselArticles}
                  scrollAnimationDuration={1000}
                  autoPlayInterval={3000}
                  renderItem={renderCarouselItem}
                  onSnapToItem={(index) => setActiveSlide(index)}
                />
                
                {/* 轮播图指示器 */}
                <View style={styles.paginationContainer}>
                  {carouselArticles.map((item, index) => (
                    <View
                      key={item.id || index}
                      style={[
                        styles.paginationDot,
                        index === activeSlide && styles.paginationDotActive
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* 营养分类 */}
            {/* <View style={styles.nutritionCategoriesContainer}>
              <Text style={styles.sectionTitle}>健康专题</Text>
              <FlatList
                data={nutritionCategories}
                renderItem={renderNutritionItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.nutritionCategoriesList}
              />
            </View> */}

            {/* 文章列表 */}
            <View style={styles.articlesSection}>
              <Text style={styles.sectionTitle}>精选文章</Text>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.loadingText}>加载中...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                    <Text style={styles.retryButtonText}>重试</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={featuredArticles}
                  renderItem={renderArticleItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.articlesList}
                />
              )}
            </View>
          </View>
        )}

        {/* 附近的分享内容 */}
        {activeTab === 'nearby' && (
          <View style={styles.nearbyContainer}>
            <View style={styles.comingSoonContainer}>
              <Ionicons name="location-outline" size={64} color="#ccc" />
              <Text style={styles.comingSoonTitle}>附近的分享</Text>
              <Text style={styles.comingSoonText}>即将上线，敬请期待...</Text>
            </View>
          </View>
        )}
             </ScrollView>
     </View>
   );
 }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  // 新增：固定顶部导航栏样式
  fixedHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 44, // 为状态栏留出空间
    paddingBottom: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  // 新增：内容容器样式
  contentContainer: {
    flex: 1,
  },
  // 新增：附近分享页面样式
  nearbyContainer: {
    flex: 1,
    paddingTop: 50,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  
  // 营养分类样式
  nutritionCategoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  nutritionCategoriesList: {
    paddingHorizontal: 4,
  },
  nutritionItem: {
    width: 100,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nutritionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  nutritionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // 文章区域样式
  articlesSection: {
    paddingHorizontal: 16,
  },
  articleTitleContainer: {
    backgroundColor: '#F7F8FA',
    flex: 1,
    marginRight: 12,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryTag: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  readTime: {
    fontSize: 12,
    color: '#666',
  },
  tagsContainer: {
    backgroundColor: '#F7F8FA',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignSelf: 'center',
  },
  expandButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 4,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  carouselContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  carouselItem: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  carouselOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  carouselTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  carouselSubtitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#4CAF50',
  },
  seasonsContainer: {
    marginBottom: 20,
  },
  seasonsList: {
    paddingHorizontal: 10,
  },
  seasonItem: {
    width: 80,
    height: 80,
    backgroundColor: '#e0e0e0',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  seasonIconContainer: {
    marginBottom: 5,
  },
  seasonTitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  questionContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  articlesList: {
    paddingBottom: 20,
  },
  articleItem: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  articleHeader: {
    backgroundColor: '#F7F8FA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  articleTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    flex: 1,
  },
  articleParagraph: {
    fontSize: 17,
    lineHeight: 22,
    color: '#666',
    marginBottom: 8,
  },
  // 新增：加载和错误状态样式
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
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
    padding: 20,
    backgroundColor: '#F7F8FA',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
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