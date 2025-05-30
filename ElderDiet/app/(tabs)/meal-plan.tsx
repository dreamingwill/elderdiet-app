import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// 模拟数据
const mealData = {
  breakfast: {
    name: '水煮蛋',
    image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    reason: '水煮蛋富含蛋白质，xxxxx\n考虑到血糖控制建议xxxxxxxxxxxxxx'
  },
  lunch: {
    name: '小米粥',
    image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    reason: '小米粥易于消化，适合老年人'
  },
  dinner: {
    name: '蔬菜包',
    image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    reason: '富含膳食纤维，有助于肠道健康'
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

export default function MealPlanScreen() {
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast');
  const [selectedDay, setSelectedDay] = useState(30); // 默认选中今天
  const [mealRecords, setMealRecords] = useState<any[]>([]);

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

  // 渲染日历天数
  const renderCalendarDay = ({ item }: { item: any }) => {
    const isSelected = selectedDay === item.day;
    return (
      <TouchableOpacity 
        style={[
          styles.calendarDay,
          isSelected && styles.selectedCalendarDay
        ]}
        onPress={() => setSelectedDay(item.day)}
      >
        <Text style={[
          styles.calendarDayText,
          isSelected && styles.selectedCalendarDayText
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

  const handleRecordMeal = () => {
    router.push('/meal-record');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {/* <Text style={styles.title}>今日膳食</Text> */}
        <Text style={styles.subtitle}>5月30日星期五</Text>
      </View>

      {/* 夏天适合喝的茶推荐
      <TouchableOpacity style={styles.teaRecommendation}>
        <View style={styles.teaImageContainer}>
          <View style={styles.teaImage} />
        </View>
        <View style={styles.teaTextContainer}>
          <Text style={styles.teaText}>盘点夏天适合喝的茶</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </TouchableOpacity> */}

      {/* 三餐选择器 */}
      <View style={styles.mealTypesContainer}>
        <TouchableOpacity 
          style={[styles.mealTypeButton, selectedMealType === 'breakfast' && styles.activeMealType]} 
          onPress={() => setSelectedMealType('breakfast')}
        >
          <Ionicons name="cafe-outline" size={24} color={selectedMealType === 'breakfast' ? '#000' : '#999'} />
          <Text style={styles.mealTypeText}>早餐</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.mealTypeButton, selectedMealType === 'lunch' && styles.activeMealType]} 
          onPress={() => setSelectedMealType('lunch')}
        >
          <Ionicons name="restaurant-outline" size={24} color={selectedMealType === 'lunch' ? '#000' : '#999'} />
          <Text style={styles.mealTypeText}>午餐</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.mealTypeButton, selectedMealType === 'dinner' && styles.activeMealType]} 
          onPress={() => setSelectedMealType('dinner')}
        >
          <Ionicons name="nutrition-outline" size={24} color={selectedMealType === 'dinner' ? '#000' : '#999'} />
          <Text style={styles.mealTypeText}>晚餐</Text>
        </TouchableOpacity>
      </View>

      {/* 膳食推荐 */}
      <View style={styles.mealsGrid}>
        <View style={styles.mealItem}>
          <Image 
            source={{ uri: mealData[selectedMealType].image }}
            style={styles.mealImage}
            resizeMode="cover"
          />
          <Text style={styles.mealName}>{mealData[selectedMealType].name}</Text>
        </View>
      </View>

      {/* 推荐理由 */}
      <View style={styles.recommendationContainer}>
        <Text style={styles.recommendationTitle}>推荐理由：</Text>
        <Text style={styles.recommendationText}>{mealData[selectedMealType].reason}</Text>
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionButtonInner}>
            <Ionicons name="checkmark" size={24} color="white" />
          </View>
          <Text style={styles.actionButtonText}>完成</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionButtonInner}>
            <Ionicons name="camera-outline" size={24} color="white" />
          </View>
          <Text style={styles.actionButtonText}>拍照</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionButtonInner}>
            <Ionicons name="chatbubble-outline" size={24} color="white" />
          </View>
          <Text style={styles.actionButtonText}>对话</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionButtonInner}>
            <Ionicons name="swap-horizontal-outline" size={24} color="white" />
          </View>
          <Text style={styles.actionButtonText}>切换</Text>
        </TouchableOpacity>
      </View>

      {/* 健康打卡日历 */}
      <View style={styles.calendarContainer}>
        <Text style={styles.calendarTitle}>健康打卡日历</Text>
        <Text style={styles.calendarSubtitle}>5月已坚持健康饮食20天，共计52餐 🦊 🦊</Text>
        
        <View style={styles.calendarHeader}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={24} color="#999" />
          </TouchableOpacity>
          <Text style={styles.calendarMonth}>5月</Text>
          
          {/* 日历天数 */}
          <FlatList
            data={calendarData}
            renderItem={renderCalendarDay}
            keyExtractor={(item) => item.day.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.calendarDays}
            contentContainerStyle={styles.calendarDaysContent}
          />
          
          <Text style={styles.calendarMonth}>6月</Text>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>
        
        {/* 当天的膳食记录 */}
        <View style={styles.dayMealRecordsContainer}>
          <FlatList
            data={calendarData.find(day => day.day === selectedDay)?.meals || []}
            renderItem={renderMealRecord}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.mealRecords}
            contentContainerStyle={styles.mealRecordsContent}
          />
        </View>
        
        {/* 健康记录列表 */}
        <FlatList
          data={healthRecords}
          renderItem={renderHealthRecord}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          style={styles.healthRecordsList}
          contentContainerStyle={styles.healthRecordsContent}
        />
      </View>
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
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
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 80,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  calendarSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 5,
  },
  calendarDays: {
    flex: 1,
    height: 40,
    marginHorizontal: 5,
  },
  calendarDaysContent: {
    alignItems: 'center',
  },
  calendarDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  selectedCalendarDay: {
    backgroundColor: '#4CAF50',
  },
  calendarDayText: {
    fontSize: 16,
  },
  selectedCalendarDayText: {
    color: 'white',
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