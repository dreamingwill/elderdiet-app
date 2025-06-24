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
    title: '长寿老人的饮食秘诀',
    subtitle: '科学搭配，营养均衡'
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80',
    title: '中医药膳养生指南',
    subtitle: '食疗胜过药疗'
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1494390248081-4e521a5940db?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80',
    title: '四季养生饮食宝典',
    subtitle: '顺应自然，健康长寿'
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1080&q=80',
    title: '慢性病饮食调理',
    subtitle: '三高人群的营养管理'
  }
];

// 营养分类
const nutritionCategories = [
  { id: '1', title: '血糖管理', icon: 'pulse-outline', color: '#FF6B6B', bgColor: '#FFE8E8' },
  { id: '2', title: '心血管保护', icon: 'heart-outline', color: '#4ECDC4', bgColor: '#E8F8F7' },
  { id: '3', title: '骨骼健康', icon: 'fitness-outline', color: '#45B7D1', bgColor: '#E8F4FD' },
  { id: '4', title: '消化养胃', icon: 'restaurant-outline', color: '#96CEB4', bgColor: '#F0F8F4' },
  { id: '5', title: '免疫增强', icon: 'shield-outline', color: '#FECA57', bgColor: '#FFF8E1' },
  { id: '6', title: '睡眠改善', icon: 'moon-outline', color: '#A55EEA', bgColor: '#F3E8FF' }
];

// 文章数据
const articles = [
  {
    id: '1',
    title: '为什么晚上不能吃姜？',
    category: '中医养生',
    readTime: '3分钟',
    tags: ['生姜', '阴阳理论', '体质调理'],
    content: [
      '前几天朋友问我，她妈妈习惯晚上喝姜茶暖胃，但听说"夜不食姜"，到底有没有道理？',
      '其实这个说法确实有根据。中医认为生姜性温味辛，有温中散寒的作用。白天人体阳气旺盛，这时吃点姜能帮助阳气升发，特别适合脾胃虚寒的人。',
      '但到了晚上就不一样了。夜晚本该是阴气内敛、阳气收藏的时候，如果这时候还吃温热的生姜，就像是在该睡觉的时候喝咖啡，容易让人兴奋，影响睡眠。',
      '不过也要看个人体质。如果你本身就是寒性体质，手脚冰凉，那晚上适量吃点姜反而有好处。但如果平时容易上火、口干舌燥，那就真的要避免夜间食姜了。',
      '我的建议是，想吃姜的话最好安排在上午，特别是早餐时间，既能暖胃又不会影响晚上休息。'
    ],
    isFavorite: false
  },
  {
    id: '2',
    title: '老年人补钙，别只知道喝牛奶',
    category: '营养科学',
    readTime: '5分钟',
    tags: ['补钙', '骨质疏松', '维生素D'],
    content: [
      '我妈今年65岁，前段时间体检发现骨密度偏低，医生建议补钙。她第一反应就是"那我多喝点牛奶吧"。',
      '牛奶确实是很好的钙源，100毫升大概含100毫克钙，吸收率也不错。但光靠牛奶是不够的，老年人每天需要1000-1200毫克钙，相当于要喝1升牛奶，显然不现实。',
      '其实补钙的食物选择很多。深绿色蔬菜像小白菜、芥蓝，钙含量一点不比牛奶少。豆制品也很棒，一块老豆腐的钙含量就相当于半杯牛奶。还有芝麻酱、小鱼干这些，都是补钙好手。',
      '但这里有个关键点：光吃钙还不行，还得能吸收。维生素D就像钙的"搬运工"，没有它，吃再多钙也白搭。所以老年人最好每天晒晒太阳，15-30分钟就够了。',
      '另外提醒一点，钙片别一次吃太多，分几次吃效果更好。最好是饭后半小时吃，这时胃酸分泌充足，有利于钙的吸收。'
    ],
    isFavorite: false
  },
  {
    id: '3',
    title: '三高人群这样吃，血管更健康',
    category: '慢病管理',
    readTime: '8分钟',
    tags: ['三高', '血糖', '血压', '血脂'],
    content: [
      '我爸今年刚确诊糖尿病，加上之前就有的高血压，现在是妥妥的"二高"人群。全家人都在学习怎么调整饮食。',
      '控血糖这块，我们发现选对主食很重要。白米饭、白面条这些精制碳水升糖快，现在都换成了燕麦、荞麦、糙米。我妈还学会了看食物的升糖指数，低于55的才考虑。',
      '降血压主要是控盐。以前炒菜习惯放很多盐，现在严格控制在每天6克以内。多用葱姜蒜、柠檬汁调味，味道其实也不错。还有就是多吃富含钾的食物，像香蕉、土豆、菠菜，能帮助排出多余的钠。',
      '血脂方面，我们减少了红肉和动物内脏，增加了深海鱼类。每周至少吃两次鱼，三文鱼、带鱼都不错。坚果也是好东西，核桃、杏仁，每天一小把。',
      '现在我们家的标准三餐是这样的：早餐燕麦粥配水煮蛋，午餐糙米饭、清蒸鱼、绿叶菜，晚餐小米粥、蒸蛋羹、凉拌黄瓜。血糖血压都控制得不错。'
    ],
    isFavorite: false
  },
  {
    id: '4',
    title: '入秋了，这样进补不上火',
    category: '季节养生',
    readTime: '6分钟',
    tags: ['秋冬进补', '滋阴润燥', '温阳散寒'],
    content: [
      '最近天气转凉，婆婆开始琢磨着要进补了。但她去年冬天补过头，结果上火长口疮，今年想换个思路。',
      '秋天其实不适合大补，这个季节燥气当令，容易伤肺。我们应该先润燥，再考虑进补。像百合、银耳、梨这些白色食物就很好，能润肺止咳。',
      '我给婆婆推荐了几个简单的方子：银耳莲子汤，既润燥又不会太凉；川贝炖梨，对秋燥咳嗽特别有效；还有百合粥，清甜润燥，老人家都爱喝。',
      '等到了真正的冬天，才是进补的好时候。那时候可以考虑一些温补的食材，像当归生姜羊肉汤、山药枸杞粥这些。但也要看个人体质，如果平时就容易上火，还是以平补为主。',
      '记住一个原则：进补不是越多越好，关键是要适合自己。最好的进补时间是三九天，那时候人体阳气内藏，最容易吸收补品的营养。'
    ],
    isFavorite: false
  },
  {
    id: '5',
    title: '老妈失眠，食疗比安眠药管用',
    category: '睡眠健康',
    readTime: '4分钟',
    tags: ['失眠', '安神', '食疗'],
    content: [
      '我妈最近总是失眠，晚上翻来覆去睡不着，白天没精神。去医院检查身体没问题，医生说可能是更年期后的睡眠障碍。',
      '不想让她依赖安眠药，我们决定试试食疗的方法。中医说老年人失眠多半是心肾不交，简单说就是心火上炎，肾水不足。',
      '我查了很多资料，发现酸枣仁是个好东西，有养心安神的作用。现在每天晚上给妈妈泡酸枣仁茶，睡前一小时喝，确实有效果。',
      '还有就是调整晚餐。以前妈妈晚上吃得比较丰盛，现在改成清淡的小米粥配点蒸蛋羹。小米含有色氨酸，能帮助大脑产生褪黑素，有助睡眠。',
      '另外我们还做银耳百合汤，既润燥又安神。桂圆莲子羹也不错，但不能天天吃，桂圆比较温热，吃多了容易上火。',
      '现在妈妈的睡眠明显改善了，基本不用安眠药就能睡个好觉。看来食疗虽然慢一点，但副作用小，更适合长期调理。'
    ],
    isFavorite: false
  },
  {
    id: '6',
    title: '肠道不好，人就老得快',
    category: '消化健康',
    readTime: '7分钟',
    tags: ['肠道菌群', '益生菌', '膳食纤维'],
    content: [
      '前段时间看到一个说法，说肠道是人体的"第二大脑"，肠道健康直接影响免疫力和衰老速度。仔细想想还真有道理。',
      '我奶奶今年85岁，身体硬朗，很少生病。问她有什么秘诀，她说就是肠胃好，每天都能正常排便，从不便秘。',
      '现在科学研究也证实了，肠道里有上千种细菌，重量能达到1-2公斤。这些细菌不仅帮助消化，还能产生维生素，调节免疫系统。',
      '想要肠道健康，首先要喂好这些有益菌。它们最爱吃的是膳食纤维，所以要多吃蔬菜水果、粗粮杂豆。像洋葱、大蒜、香蕉这些，含有丰富的益生元，能促进有益菌繁殖。',
      '发酵食品也很重要，酸奶、泡菜、纳豆这些都含有活性益生菌。我现在每天都会喝一杯酸奶，选那种含有双歧杆菌的。',
      '还有就是要保证充足的水分，每天至少1500毫升，这样才能保持肠道润滑，预防便秘。适量运动也很重要，能促进肠道蠕动。',
      '说到底，肠道健康需要综合调理，不能指望吃个什么保健品就立竿见影。但坚持下去，你会发现不仅消化好了，整个人的精神状态都会改善。'
    ],
    isFavorite: false
  }
];

interface CarouselItem {
  id: string;
  image: string;
  title: string;
  subtitle: string;
}

interface NutritionItem {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
}

interface ArticleItem {
  id: string;
  title: string;
  category: string;
  readTime: string;
  tags: string[];
  content: string[];
  isFavorite: boolean;
}

export default function DiscoveryScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('nutrition'); // 新增：当前选中的tab
  const [expandedArticles, setExpandedArticles] = useState<string[]>([]); // 新增：展开的文章ID列表

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
          <Text style={styles.carouselSubtitle}>{item.subtitle}</Text>
        </View>
      </ImageBackground>
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
  const renderArticleItem = ({ item }: { item: ArticleItem }) => {
    const isFavorite = favorites.includes(item.id) || item.isFavorite;
    const isExpanded = expandedArticles.includes(item.id);
    const previewContent = item.content.slice(0, 2); // 只显示前两段
    const displayContent = isExpanded ? item.content : previewContent;
    
    return (
      <View style={styles.articleItem}>
        <View style={styles.articleHeader}>
          <View style={styles.articleTitleContainer}>
            <Text style={styles.articleTitle}>{item.title}</Text>
            <View style={styles.articleMeta}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <Text style={styles.readTime}>📖 {item.readTime}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
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
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        {/* 内容 */}
        {displayContent.map((paragraph: string, index: number) => (
          <Text key={index} style={styles.articleParagraph}>
            {paragraph}
          </Text>
        ))}
        
        {/* 展开/收起按钮 */}
        {item.content.length > 2 && (
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => toggleArticleExpansion(item.id)}
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
      </View>
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
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
            onPress={() => setActiveTab('nearby')}
          >
            <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText]}>
              附近
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* 营养知识内容 */}
        {activeTab === 'nutrition' && (
          <View>
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

            {/* 营养分类 */}
            <View style={styles.nutritionCategoriesContainer}>
              <Text style={styles.sectionTitle}>健康专题</Text>
              <FlatList
                data={nutritionCategories}
                renderItem={renderNutritionItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.nutritionCategoriesList}
              />
            </View>

            {/* 文章列表 */}
            <View style={styles.articlesSection}>
              <Text style={styles.sectionTitle}>精选文章</Text>
              <FlatList
                data={articles}
                renderItem={renderArticleItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.articlesList}
              />
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
    backgroundColor: '#f5f5f5',
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
    fontSize: 20,
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