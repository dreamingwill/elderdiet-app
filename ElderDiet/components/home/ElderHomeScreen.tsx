import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { recipes, Recipe } from '@/data/recipes';

const { width } = Dimensions.get('window');

export default function ElderHomeScreen() {
  const [todayMenuList, setTodayMenuList] = useState<Recipe[]>([]);
  const [waterIntake, setWaterIntake] = useState<number>(0); // 单位：杯
  const waterGoal = 8; // 每天建议喝水量（杯）

  useEffect(() => {
    // 获取今日推荐餐单
    const recommendedRecipes = recipes.slice(0, 3); // 简单示例，实际应该根据用户健康档案推荐
    setTodayMenuList(recommendedRecipes);
  }, []);

  const handleWaterIntake = () => {
    if (waterIntake < waterGoal) {
      setWaterIntake(waterIntake + 1);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>今日膳食</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('zh-CN')}</Text>
      </View>

      {/* 餐单轮播 */}
      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
      >
        {todayMenuList.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            style={styles.mealCard}
            onPress={() => router.push(`/recipe/${meal.id}`)}
          >
            <View style={styles.mealImageContainer}>
              <Image
                source={{ uri: meal.image }}
                style={styles.mealImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.mealInfo}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.healthBenefits}>{meal.healthBenefits}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 按钮组 */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          style={styles.recordButton}
          onPress={() => router.push('/meal-record')}
        >
          <Ionicons name="restaurant-outline" size={32} color="white" />
          <Text style={styles.buttonText}>我吃了啥</Text>
        </TouchableOpacity>

        <View style={styles.smallButtonsContainer}>
          <TouchableOpacity style={styles.smallButton} onPress={() => console.log('换个餐单')}>
            <Ionicons name="refresh-outline" size={24} color="#4CAF50" />
            <Text style={styles.smallButtonText}>换个餐单</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.smallButton}
            onPress={() => router.push('/(tabs)/meal-plan')}
          >
            <Ionicons name="book-outline" size={24} color="#4CAF50" />
            <Text style={styles.smallButtonText}>看食谱</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 喝水提醒 */}
      <TouchableOpacity 
        style={styles.waterReminderContainer}
        onPress={handleWaterIntake}
      >
        <View style={styles.waterReminder}>
          <Ionicons name="water-outline" size={28} color="#2196F3" />
          <Text style={styles.waterText}>今日饮水：{waterIntake}/{waterGoal}杯</Text>
        </View>
        <View style={styles.waterProgress}>
          <View 
            style={[
              styles.waterProgressFill, 
              { width: `${(waterIntake / waterGoal) * 100}%` }
            ]} 
          />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  carousel: {
    height: 220,
    marginBottom: 20,
  },
  mealCard: {
    width: width - 40,
    marginHorizontal: 20,
    borderRadius: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: 200,
    flexDirection: 'row',
  },
  mealImageContainer: {
    width: '40%',
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  mealInfo: {
    padding: 15,
    width: '60%',
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  healthBenefits: {
    fontSize: 14,
    color: '#666',
  },
  buttonGroup: {
    padding: 20,
  },
  recordButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  smallButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
    width: '48%',
  },
  smallButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  waterReminderContainer: {
    padding: 20,
    marginBottom: 20,
  },
  waterReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  waterText: {
    fontSize: 16,
    marginLeft: 10,
  },
  waterProgress: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  waterProgressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
}); 