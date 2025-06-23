import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// 膳食方案数据
const dietData = {
  breakfast: {
    mealType: '早餐',
    dishes: [
      { id: 'b_staple_001', name: '全麦面包', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '主食' },
      { id: 'b_dish_001', name: '牛奶燕麦粥', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '菜肴' },
      { id: 'b_dish_002', name: '水煮蛋', imageUrl: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '菜肴' }
    ],
    recommendation: {
      title: "开启元气满满的一天",
      details: {
        nutrition: "提供均衡的碳水化合物、优质蛋白质和膳食纤维，确保血糖平稳上升，为大脑和身体提供持久能量。",
        healthBenefit: "燕麦中的β-葡聚糖有助于降低胆固醇，全麦面包富含纤维，促进肠道健康。鸡蛋是优质蛋白质的绝佳来源，有助维持肌肉量。",
        wellness: "温热的燕麦粥有暖胃效果，易于消化，非常适合作为一天的开始，为脾胃提供温和的滋养。"
      }
    }
  },
  lunch: {
    mealType: '午餐',
    dishes: [
      { id: 'l_staple_001', name: '糙米饭', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '主食' },
      { id: 'l_dish_001', name: '西芹炒虾仁', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '菜肴' },
      { id: 'l_soup_001', name: '冬瓜排骨汤', imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '汤品' }
    ],
    recommendation: {
      title: "活力满满的控压午餐",
      details: {
        nutrition: "本方案通过糙米饭提供优质复合碳水和B族维生素；虾仁富含优质蛋白质和锌元素，西芹则补充了膳食纤维和钾，共同维持肌肉与神经功能。这是一套高蛋白、高纤维、低脂肪的组合。",
        healthBenefit: "西芹和冬瓜均有利尿、降血压的食疗效果，适合血压偏高的长者。虾仁中的虾青素是强大的抗氧化剂，有助于延缓衰老。整体搭配清淡少油，易于消化，能有效减轻肠胃负担。",
        wellness: "冬瓜性凉，可清热解暑；排骨汤补气养血。此搭配在补充营养的同时，兼顾了清热与滋养的平衡，适合夏季或体内有虚热的长者。"
      }
    }
  },
  dinner: {
    mealType: '晚餐',
    dishes: [
      { id: 'd_staple_001', name: '小米粥', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '主食' },
      { id: 'd_dish_001', name: '清蒸鲈鱼', imageUrl: 'https://images.unsplash.com/photo-1544943150-4c4c5c853c9b?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '菜肴' },
      { id: 'd_dish_002', name: '凉拌黄瓜', imageUrl: 'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '菜肴' }
    ],
    recommendation: {
      title: "安神助眠的轻盈晚餐",
      details: {
        nutrition: "以易消化的小米粥作为主食，搭配富含Omega-3的鲈鱼和清爽的黄瓜。此组合热量较低，蛋白质优质，不会给夜间休息带来负担。",
        healthBenefit: "鲈鱼中的DHA对大脑健康有益，且易于消化吸收。小米含有色氨酸，能在体内转化为褪黑素，有助改善睡眠质量。黄瓜补充水分和维生素。",
        wellness: "小米有安神健胃的功效，是中医推荐的晚间食疗佳品。清蒸的烹饪方式保留了食材原味，避免了油腻，符合夜间阳气内收的养生之道。"
      }
    }
  }
};

// 备选菜品数据
const alternativeDishes = {
  breakfast: {
    staple: [
      { id: 'b_staple_002', name: '燕麦粥', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '主食' },
      { id: 'b_staple_003', name: '紫薯', imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '主食' }
    ],
    dish: [
      { id: 'b_dish_003', name: '蒸蛋羹', imageUrl: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '菜肴' },
      { id: 'b_dish_004', name: '豆浆', imageUrl: 'https://images.unsplash.com/photo-1423483641154-5411ec9c0ddf?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '菜肴' }
    ]
  },
  lunch: {
    staple: [
      { id: 'l_staple_002', name: '五谷杂粮饭', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '主食' },
      { id: 'l_staple_003', name: '玉米', imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '主食' }
    ],
    dish: [
      { id: 'l_dish_002', name: '清炒菠菜', imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '菜肴' },
      { id: 'l_dish_003', name: '蒸蛋', imageUrl: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '菜肴' }
    ],
    soup: [
      { id: 'l_soup_002', name: '紫菜蛋花汤', imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '汤品' },
      { id: 'l_soup_003', name: '银耳莲子汤', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '汤品' }
    ]
  },
  dinner: {
    staple: [
      { id: 'd_staple_002', name: '山药粥', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '主食' },
      { id: 'd_staple_003', name: '白粥', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '主食' }
    ],
    dish: [
      { id: 'd_dish_003', name: '蒸蛋羹', imageUrl: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '菜肴' },
      { id: 'd_dish_004', name: '清炒时蔬', imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60', category: '菜肴' }
    ]
  }
};

// 日历数据
const calendarData = [
  { day: 26, date: new Date(2023, 4, 26), meals: ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'] },
  { day: 27, date: new Date(2023, 4, 27), meals: ['https://images.unsplash.com/photo-1505576399279-565b52d4ac71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'] },
  { 
    day: 28, 
    date: new Date(2023, 4, 28), 
    meals: [
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    ] 
  },
  { day: 29, date: new Date(2023, 4, 29), meals: [] },
  { 
    day: 30, 
    date: new Date(2023, 4, 30), 
    meals: [
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    ],
    isToday: true
  },
  { day: 31, date: new Date(2023, 4, 31), meals: [] },
  { day: 1, date: new Date(2023, 5, 1), meals: [] },
];

// 健康记录数据
const healthRecords = [
  {
    id: '1',
    date: '5月28日',
    time: '21:12',
    user: '儿子',
    action: '为您的健康饮食点赞并留言',
    message: '丰盛又健康的晚餐！太棒啦!',
    highlighted: false
  },
  {
    id: '2',
    date: '5月28日',
    time: '22:11',
    user: '女儿',
    action: '为您的健康饮食点赞',
    message: '',
    highlighted: false
  },
  {
    id: '3',
    date: '5月26日',
    time: '20:16',
    user: '女儿',
    action: '为您的健康饮食点赞并留言',
    message: '坚持就是胜利!',
    highlighted: false
  }
];

// 打卡记录数据类型
interface CheckInRecord {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  type: 'quick' | 'photo';
  photo?: string;
  timestamp: number;
  likes: Array<{
    id: string;
    user: string;
    avatar: string;
    timestamp: number;
  }>;
  comments: Array<{
    id: string;
    user: string;
    avatar: string;
    message: string;
    timestamp: number;
  }>;
}

export default function MealPlanScreen() {
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [selectedDay, setSelectedDay] = useState(30); // 默认选中今天
  const [mealRecords, setMealRecords] = useState<any[]>([]);
  const [currentDishes, setCurrentDishes] = useState(dietData); // 当前选中的膳食方案
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([
    // 今天的打卡记录
    {
      id: 'checkin_today_breakfast',
      date: new Date().toISOString().split('T')[0],
      mealType: 'breakfast',
      type: 'photo',
      photo: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60',
      timestamp: Date.now() - 3600000,
      likes: [
        { id: 'like_today_1', user: '女儿', avatar: '👧', timestamp: Date.now() - 3000000 }
      ],
      comments: [
        { id: 'comm_today_1', user: '女儿', avatar: '👧', message: '早餐很丰富呢!', timestamp: Date.now() - 2500000 }
      ]
    },
    {
      id: 'checkin_today_lunch',
      date: new Date().toISOString().split('T')[0],
      mealType: 'lunch',
      type: 'quick',
      timestamp: Date.now() - 7200000,
      likes: [],
      comments: []
    },
    // 昨天的打卡记录
    {
      id: 'checkin_yesterday_1',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      mealType: 'breakfast',
      type: 'photo',
      photo: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60',
      timestamp: Date.now() - 86400000 - 3600000,
      likes: [
        { id: 'like_y1', user: '儿子', avatar: '👦', timestamp: Date.now() - 86400000 }
      ],
      comments: []
    },
    {
      id: 'checkin_yesterday_2',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      mealType: 'dinner',
      type: 'photo',
      photo: 'https://images.unsplash.com/photo-1544943150-4c4c5c853c9b?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60',
      timestamp: Date.now() - 86400000 - 7200000,
      likes: [
        { id: 'like_y2', user: '女儿', avatar: '👧', timestamp: Date.now() - 85000000 },
        { id: 'like_y3', user: '儿子', avatar: '👦', timestamp: Date.now() - 84000000 }
      ],
      comments: [
        { id: 'comm_y1', user: '女儿', avatar: '👧', message: '清蒸鱼很不错，营养又健康', timestamp: Date.now() - 83000000 }
      ]
    },
    // 前天的打卡记录
    {
      id: 'checkin_2days_1',
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      mealType: 'lunch',
      type: 'quick',
      timestamp: Date.now() - 172800000,
      likes: [],
      comments: []
    },
    // 3天前的打卡记录
    {
      id: 'checkin_3days_1',
      date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
      mealType: 'breakfast',
      type: 'photo',
      photo: 'https://images.unsplash.com/photo-1423483641154-5411ec9c0ddf?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60',
      timestamp: Date.now() - 259200000,
      likes: [
        { id: 'like_3d1', user: '女儿', avatar: '👧', timestamp: Date.now() - 250000000 }
      ],
      comments: []
    },
    {
      id: 'checkin_3days_2',
      date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
      mealType: 'dinner',
      type: 'photo',
      photo: 'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60',
      timestamp: Date.now() - 259200000 - 3600000,
      likes: [],
      comments: [
        { id: 'comm_3d1', user: '儿子', avatar: '👦', message: '黄瓜很爽口!', timestamp: Date.now() - 240000000 }
      ]
    }
  ]); // 打卡记录

  // 模拟加载用户饮食记录
  useEffect(() => {
    const loadMealRecords = async () => {
      try {
        const records = await AsyncStorage.getItem('@meal_records');
        if (records) {
          setMealRecords(JSON.parse(records));
        }
      } catch (error) {
        console.error('Failed to load meal records:', error);
      }
    };
    
    loadMealRecords();
  }, []);

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

  // 更换菜品函数
  const handleDishChange = (mealType: 'breakfast' | 'lunch' | 'dinner', dishIndex: number, category: string) => {
    const alternatives = alternativeDishes[mealType];
    if (!alternatives || !alternatives[category as keyof typeof alternatives]) return;
    
    const categoryAlternatives = alternatives[category as keyof typeof alternatives];
    if (!categoryAlternatives || categoryAlternatives.length === 0) return;
    
    // 随机选择一个备选菜品
    const randomIndex = Math.floor(Math.random() * categoryAlternatives.length);
    const newDish = {...categoryAlternatives[randomIndex]};
    
    // 为新菜品生成唯一的ID，避免key重复
    newDish.id = `${newDish.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setCurrentDishes(prev => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        dishes: prev[mealType].dishes.map((dish, index) => 
          index === dishIndex ? newDish : dish
        )
      }
    }));
  };

  // 一键打卡功能
  const handleQuickCheckIn = async () => {
    const today = new Date().toISOString().split('T')[0];
    const newCheckIn: CheckInRecord = {
      id: `checkin_${Date.now()}`,
      date: today,
      mealType: selectedMealType,
      type: 'quick',
      timestamp: Date.now(),
      likes: [],
      comments: []
    };

    setCheckInRecords(prev => [newCheckIn, ...prev]);
    
    // 保存到本地存储
    try {
      const updatedRecords = [newCheckIn, ...checkInRecords];
      await AsyncStorage.setItem('@check_in_records', JSON.stringify(updatedRecords));
      console.log(`${selectedMealType} 打卡成功！`);
    } catch (error) {
      console.error('打卡保存失败:', error);
    }
  };

  // 拍照打卡功能
  const handlePhotoCheckIn = async () => {
    // 模拟拍照上传
    const mockPhotoUrl = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=60';
    
    const today = new Date().toISOString().split('T')[0];
    const newCheckIn: CheckInRecord = {
      id: `checkin_${Date.now()}`,
      date: today,
      mealType: selectedMealType,
      type: 'photo',
      photo: mockPhotoUrl,
      timestamp: Date.now(),
      likes: [],
      comments: []
    };

    setCheckInRecords(prev => [newCheckIn, ...prev]);
    
    // 保存到本地存储
    try {
      const updatedRecords = [newCheckIn, ...checkInRecords];
      await AsyncStorage.setItem('@check_in_records', JSON.stringify(updatedRecords));
      console.log(`${selectedMealType} 拍照打卡成功！`);
    } catch (error) {
      console.error('打卡保存失败:', error);
    }
  };

  // 渲染日历天数 (该函数已被新的日历滑动替代，保留以防需要)
  const renderCalendarDay = ({ item }: { item: any }) => {
    const isSelected = selectedDay === item.day;
    return (
      <TouchableOpacity 
        style={[
          styles.calendarDayCard,
          isSelected && styles.calendarDaySelected
        ]}
        onPress={() => setSelectedDay(item.day)}
      >
        <Text style={[
          styles.calendarDayText,
          isSelected && styles.calendarDayTextSelected
        ]}>
          {item.day}
        </Text>
      </TouchableOpacity>
    );
  };

  // 渲染日历下方的膳食记录
  const renderMealRecord = ({ item }: { item: any }) => {
    return (
      <Image 
        source={{ uri: item }} 
        style={styles.mealRecordImage}
        resizeMode="cover"
      />
    );
  };

  // 渲染健康记录列表项
  const renderHealthRecord = ({ item }: { item: any }) => {
    return (
      <View style={[
        styles.healthRecordItem,
        item.highlighted && styles.highlightedRecord
      ]}>
        <View style={styles.healthRecordHeader}>
          <Text style={styles.healthRecordDate}>{item.date}</Text>
          <Text style={styles.healthRecordUser}>{item.user}为您的健康饮食点赞</Text>
          {item.message ? <Text style={styles.healthRecordAction}>并留言</Text> : null}
          <Text style={styles.healthRecordTime}>{item.time}</Text>
        </View>
        
        {item.message ? (
          <View style={styles.healthRecordMessageContainer}>
            <Text style={styles.healthRecordMessage}>{item.message}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  // 渲染单个菜品
  const renderDish = (dish: any, index: number, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const getCategoryColor = (category: string) => {
      switch (category) {
        case '主食': return '#F3EADF';
        case '菜肴': return '#E6F9F0';
        case '汤品': return '#EBF5FF';
        default: return '#F5F5F5';
      }
    };

    const getCategoryKey = (category: string) => {
      switch (category) {
        case '主食': return 'staple';
        case '汤品': return 'soup';
        default: return 'dish';
      }
    };

    return (
      <View key={`${mealType}_${dish.id}_${index}`} style={styles.dishItem}>
        <View style={[styles.dishImageContainer, { backgroundColor: getCategoryColor(dish.category) }]}>
          <Image source={{ uri: dish.imageUrl }} style={styles.dishImage} />
          <Text style={styles.dishCategory}>{dish.category}</Text>
        </View>
        <View style={styles.dishInfo}>
          <Text style={styles.dishName}>{dish.name}</Text>
          <TouchableOpacity 
            style={styles.changeButton}
            onPress={() => handleDishChange(mealType, index, getCategoryKey(dish.category))}
          >
            <Ionicons name="refresh" size={16} color="#666" />
            <Text style={styles.changeButtonText}>更换</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleRecordMeal = () => {
    // 导航到餐食记录页面
    console.log('Navigate to meal record page');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.currentDate}>{getCurrentDate()}</Text>
        <Text style={styles.title}>今日膳食</Text>
      </View>

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

      {/* 膳食方案内容 */}
      <View style={styles.mealPlanContainer}>
        {/* 菜品列表 */}
        <View style={styles.dishesContainer}>
          {currentDishes[selectedMealType].dishes.map((dish, index) => 
            renderDish(dish, index, selectedMealType)
          )}
        </View>

        {/* 打卡按钮 */}
        <View style={styles.checkInButtonsContainer}>
          <TouchableOpacity 
            style={[styles.checkInButton, styles.quickCheckInButton]}
            onPress={handleQuickCheckIn}
          >
            <Ionicons name="sparkles" size={24} color="#fff" />
            <Text style={styles.checkInButtonText}>AI膳食推荐</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.checkInButton, styles.photoCheckInButton]}
            onPress={handlePhotoCheckIn}
          >
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.checkInButtonText}>拍照打卡</Text>
          </TouchableOpacity>
        </View>

        {/* 推荐说明 */}
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationTitle}>
            {currentDishes[selectedMealType].recommendation.title}
          </Text>
          <Text style={styles.nutritionLabel}>【营养均衡】</Text>
          <Text style={styles.recommendationText}>
            {currentDishes[selectedMealType].recommendation.details.nutrition}
          </Text>
          <Text style={styles.healthLabel}>【健康益处】</Text>
          <Text style={styles.recommendationText}>
            {currentDishes[selectedMealType].recommendation.details.healthBenefit}
          </Text>
          <Text style={styles.wellnessLabel}>【中医养生】</Text>
          <Text style={styles.recommendationText}>
            {currentDishes[selectedMealType].recommendation.details.wellness}
          </Text>
        </View>
      </View>

      {/* 健康打卡日历 */}
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarTitle}>健康打卡日历</Text>
          <Text style={styles.calendarSubtitle}>
            本月已坚持健康饮食 {checkInRecords.length} 天，继续加油！
          </Text>
        </View>
        
        {/* 月份显示 */}
        <View style={styles.monthHeader}>
          <Text style={styles.monthText}>
            {new Date().getFullYear()}年{new Date().getMonth() + 1}月
          </Text>
        </View>
        
        {/* 日历滑动窗口 */}
        <FlatList
          data={Array.from({ length: 21 }, (_, i) => {
            const todayDate = new Date();
            const targetDate = new Date(todayDate);
            targetDate.setDate(todayDate.getDate() - 10 + i); // 显示过去10天到未来10天，共21天
            return targetDate;
          })}
          renderItem={({ item: targetDate }) => {
            const day = targetDate.getDate();
            const weekDay = ['日', '一', '二', '三', '四', '五', '六'][targetDate.getDay()];
            const checkDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayCheckIns = checkInRecords.filter(record => record.date === checkDate);
            const isToday = targetDate.toDateString() === new Date().toDateString();
            
            return (
              <TouchableOpacity
                style={[
                  styles.calendarDayCard,
                  dayCheckIns.length > 0 && styles.calendarDayWithRecord,
                  selectedDay === day && styles.calendarDaySelected,
                  isToday && styles.calendarDayToday
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[
                  styles.weekDayText,
                  selectedDay === day && styles.calendarDayTextSelected,
                  isToday && styles.calendarDayTextToday
                ]}>
                  {weekDay}
                </Text>
                <Text style={[
                  styles.calendarDayText,
                  dayCheckIns.length > 0 && styles.calendarDayTextWithRecord,
                  selectedDay === day && styles.calendarDayTextSelected,
                  isToday && styles.calendarDayTextToday
                ]}>
                  {day}
                </Text>
                {dayCheckIns.length > 0 && (
                  <View style={styles.checkInBadge}>
                    <Ionicons name="checkmark" size={14} color="#28a745" />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.getTime().toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarScrollContainer}
          initialScrollIndex={10} // 滚动到今天的位置
          getItemLayout={(data, index) => ({
            length: 80,
            offset: 80 * index,
            index,
          })}
        />

        {/* 选中日期的打卡记录详情 */}
        {(() => {
          const todayDate = new Date();
          const selectedDate = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
          const selectedDayRecords = checkInRecords.filter(record => record.date === selectedDate);
          
          if (selectedDayRecords.length === 0) {
            return (
              <View style={styles.noRecordsContainer}>
                <Text style={styles.noRecordsText}>
                  {selectedDay}日 还没有打卡记录，开始今天的健康饮食吧！
                </Text>
              </View>
            );
          }

          return (
            <View style={styles.checkInRecordsContainer}>
              <Text style={styles.recordsTitle}>
                {selectedDay}日 的打卡记录 ({selectedDayRecords.length}条)
              </Text>
              
              {/* 横向滑动的打卡记录 */}
              <FlatList
                data={selectedDayRecords}
                renderItem={({ item: record }) => (
                  <View style={styles.checkInRecordCard}>
                    {/* 打卡信息头部 */}
                    <View style={styles.recordHeader}>
                      <Text style={styles.recordMealType}>
                        {record.mealType === 'breakfast' ? '🌅 早餐' : 
                         record.mealType === 'lunch' ? '☀️ 午餐' : '🌙 晚餐'}
                      </Text>
                      <Text style={styles.recordType}>
                        {record.type === 'quick' ? '快速打卡' : '📷 拍照打卡'}
                      </Text>
                      <Text style={styles.recordTime}>
                        {new Date(record.timestamp).toLocaleTimeString('zh-CN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>

                    {/* 打卡照片 */}
                    {record.photo && (
                      <View style={styles.recordPhotoContainer}>
                        <Image source={{ uri: record.photo }} style={styles.recordPhoto} />
                      </View>
                    )}

                    {/* 家庭互动 - 简化版 */}
                    <View style={styles.familyInteractionContainer}>
                      {/* 点赞和评论合并显示 */}
                      <View style={styles.interactionSummary}>
                        {record.likes.length > 0 && (
                          <View style={styles.interactionItem}>
                            <Ionicons name="heart" size={14} color="#ff6b6b" />
                            <Text style={styles.interactionText}>{record.likes.length}</Text>
                          </View>
                        )}
                        {record.comments.length > 0 && (
                          <View style={styles.interactionItem}>
                            <Ionicons name="chatbubble-outline" size={14} color="#28a745" />
                            <Text style={styles.interactionText}>{record.comments.length}</Text>
                          </View>
                        )}
                      </View>
                      
                      {/* 最新评论 */}
                      {record.comments.length > 0 && (
                        <Text style={styles.latestComment}>
                          {record.comments[0].user}: {record.comments[0].message}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recordsScrollContainer}
              />
            </View>
          );
        })()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  currentDate: {
    fontSize: 20,
    color: '#6c757d',
    marginBottom: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#212529',
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
    marginTop: 20,
  },
  dishItem: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  dishImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  dishCategory: {
    position: 'absolute',
    bottom: 2,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dishInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  changeButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },

  // 打卡按钮容器
  checkInButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkInButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickCheckInButton: {
    backgroundColor: '#28a745',
    marginRight: 8,
  },
  photoCheckInButton: {
    backgroundColor: '#007bff',
    marginLeft: 8,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },

  // 推荐说明卡片
  recommendationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  recommendationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
    textAlign: 'center',
  },
  nutritionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
    marginTop: 16,
    marginBottom: 8,
  },
  healthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17a2b8',
    marginTop: 16,
    marginBottom: 8,
  },
  wellnessLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fd7e14',
    marginTop: 16,
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#495057',
    marginBottom: 4,
  },
  teaRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 10,
  },
  teaImageContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teaImage: {
    width: 40,
    height: 40,
    backgroundColor: '#999',
    borderRadius: 8,
  },
  teaTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  teaText: {
    fontSize: 16,
    fontWeight: '500',
  },
  mealTypesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: 'white',
  },
  mealTypeButton: {
    alignItems: 'center',
    padding: 10,
  },
  activeMealType: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  mealTypeText: {
    marginTop: 5,
    fontSize: 14,
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
  },
  mealItem: {
    width: width / 3 - 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  mealImage: {
    width: width / 3 - 20,
    height: width / 3 - 20,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },
  mealName: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
  },
  recommendationContainer: {
    padding: 15,
    backgroundColor: 'white',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#f5f5f5',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  calendarContainer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginBottom: 80,
  },
  calendarHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  calendarSubtitle: {
    fontSize: 18,
    color: '#28a745',
    fontWeight: '600',
  },
  monthHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
  },
  calendarScrollContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  calendarDayCard: {
    width: 70,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  weekDayText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 2,
  },
  calendarDayWithRecord: {
    backgroundColor: '#f0f9ff',
    borderColor: '#28a745',
    borderWidth: 3,
  },
  calendarDaySelected: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  calendarDayText: {
    fontSize: 18,
    color: '#495057',
    fontWeight: '600',
  },
  calendarDayTextWithRecord: {
    color: '#2196f3',
    fontWeight: '700',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarDayToday: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 3,
  },
  calendarDayTextToday: {
    color: '#856404',
    fontWeight: 'bold',
  },
  checkInBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#28a745',
  },

  // 打卡记录详情样式
  noRecordsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  noRecordsText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 26,
  },
  checkInRecordsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  recordsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  checkInRecordCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    width: 200,
    minHeight: 160,
  },
  recordHeader: {
    marginBottom: 8,
  },
  recordsScrollContainer: {
    paddingHorizontal: 4,
  },
  recordMealType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  recordType: {
    fontSize: 12,
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  recordTime: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  recordPhotoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  recordPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  interactionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  interactionText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  latestComment: {
    fontSize: 11,
    color: '#495057',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  familyInteractionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 8,
  },
  likesContainer: {
    marginBottom: 6,
  },
  likesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  likesCount: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600',
    marginLeft: 4,
  },
  likesUsers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  likeUser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 3,
  },
  likeUserAvatar: {
    fontSize: 12,
    marginRight: 3,
  },
  likeUserName: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  commentsContainer: {
    marginBottom: 4,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  commentAvatar: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  commentMessage: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 18,
  },
  noInteractionText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 8,
  },
  dayMealRecordsContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  mealRecords: {
    height: 80,
  },
  mealRecordsContent: {
    paddingHorizontal: 5,
  },
  mealRecordImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginHorizontal: 5,
    backgroundColor: '#ddd',
  },
  healthRecordsList: {
    marginTop: 10,
  },
  healthRecordsContent: {
    paddingBottom: 10,
  },
  healthRecordItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  highlightedRecord: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  healthRecordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  healthRecordDate: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 5,
  },
  healthRecordUser: {
    fontSize: 14,
  },
  healthRecordAction: {
    fontSize: 14,
  },
  healthRecordTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
  healthRecordMessageContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  healthRecordMessage: {
    fontSize: 14,
    color: '#666',
  },
}); 