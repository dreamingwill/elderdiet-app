import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  ImageBackground
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Carousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window');

// 轮播图数据
const carouselData = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80',
    title: '营养知识知多少？'
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80',
    title: '健康饮食小贴士'
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1494390248081-4e521a5940db?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80',
    title: '夏季养生必读'
  }
];

// 季节分类
const seasonCategories = [
  { id: '1', title: '春季适合\n吃什么', icon: 'leaf-outline' },
  { id: '2', title: '夏季适合\n吃什么', icon: 'sunny-outline' },
  { id: '3', title: '秋季适合\n吃什么', icon: 'moon-outline' },
  { id: '4', title: '冬季适合\n吃什么', icon: 'snow-outline' }
];

// 文章数据
const articles = [
  {
    id: '1',
    title: '为什么晚上不能吃姜？',
    content: [
      '1. 阴阳理论：中医认为白天属阳，姜也属阳，生姜的升阳散寒特性在早餐或午餐时服用可能干扰阴阳平衡，导致晚上无法入睡。',
      '2. 体质差异：对于阴虚火旺者（如易口干、潮热）或湿热体质者，晚上吃姜可能加重不适，但体质虚寒（如手脚冰凉）的人群，适量食用反而有助于改善。'
    ],
    isFavorite: false
  },
  {
    id: '2',
    title: '为什么晚上不能吃姜？',
    content: [
      '1. 阴阳理论：中医认为白天属阳，姜也属阳，生姜的升阳散寒特性在早餐或午餐时服用可能干扰阴阳平衡，导致晚上无法入睡。',
      '2. 体质差异：对于阴虚火旺者（如易口干、潮热）或湿热体质者，晚上吃姜可能加重不适，但体质虚寒（如手脚冰凉）的人群，适量食用反而有助于改善。'
    ],
    isFavorite: false
  }
];

interface CarouselItem {
  id: string;
  image: string;
  title: string;
}

interface SeasonItem {
  id: string;
  title: string;
  icon: string;
}

interface ArticleItem {
  id: string;
  title: string;
  content: string[];
  isFavorite: boolean;
}

export default function DiscoveryScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(item => item !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  // 渲染轮播图项
  const renderCarouselItem = ({ item }: { item: CarouselItem }) => {
    return (
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.carouselItem}
        imageStyle={{ borderRadius: 12 }}
      >
        <View style={styles.carouselOverlay}>
          <Text style={styles.carouselTitle}>{item.title}</Text>
        </View>
      </ImageBackground>
    );
  };

  // 渲染季节分类项
  const renderSeasonItem = ({ item }: { item: SeasonItem }) => {
    return (
      <TouchableOpacity style={styles.seasonItem}>
        <View style={styles.seasonIconContainer}>
          <Ionicons name={item.icon as any} size={24} color="#666" />
        </View>
        <Text style={styles.seasonTitle}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  // 渲染文章项
  const renderArticleItem = ({ item }: { item: ArticleItem }) => {
    const isFavorite = favorites.includes(item.id) || item.isFavorite;
    
    return (
      <View style={styles.articleItem}>
        <View style={styles.articleHeader}>
          <Text style={styles.articleTitle}>{item.title}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
            <Ionicons 
              name={isFavorite ? "star" : "star-outline"} 
              size={24} 
              color={isFavorite ? "#FFD700" : "#999"} 
            />
          </TouchableOpacity>
        </View>
        
        {item.content.map((paragraph: string, index: number) => (
          <Text key={index} style={styles.articleParagraph}>
            {paragraph}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* <View style={styles.header}>
        <Text style={styles.title}>发现</Text>
      </View> */}

      {/* 轮播图 */}
      <View style={styles.carouselContainer}>
        <Carousel
          loop
          width={width - 32}
          height={180}
          autoPlay={true}
          data={carouselData}
          scrollAnimationDuration={1000}
          autoPlayInterval={3000}
          renderItem={renderCarouselItem}
          onSnapToItem={(index) => setActiveSlide(index)}
        />
        
        {/* 轮播图指示器 */}
        <View style={styles.paginationContainer}>
          {carouselData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeSlide && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
      </View>

      {/* 季节分类 */}
      {/* <View style={styles.seasonsContainer}>
        <FlatList
          data={seasonCategories}
          renderItem={renderSeasonItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seasonsList}
        />
      </View> */}

      {/* 问题标题
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>为什么晚上不能吃姜？</Text>
      </View> */}

      {/* 文章列表 */}
      <FlatList
        data={articles}
        renderItem={renderArticleItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.articlesList}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  articleItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  articleParagraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    marginBottom: 8,
  },
}); 