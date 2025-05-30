import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// 模拟的老人活动数据
const mockElderActivities = [
  {
    id: '1',
    type: 'meal',
    content: '早餐：燕麦牛奶粥',
    time: '08:30',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: '2',
    type: 'water',
    content: '饮水 250ml',
    time: '10:15',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: '3',
    type: 'meal',
    content: '午餐：清蒸鲈鱼配时蔬',
    time: '12:00',
    date: new Date().toISOString().split('T')[0],
  },
];

// 模拟的老人健康概要
const mockElderProfile = {
  name: '张爷爷',
  age: 72,
  summary: {
    healthStatus: '良好',
    dietaryCompliance: '90%',
    recentMeals: 3,
    waterIntake: 5,
    lastActivity: '1小时前',
  },
};

export default function ChildHomeScreen() {
  const [elderProfile, setElderProfile] = useState(mockElderProfile);
  const [elderActivities, setElderActivities] = useState(mockElderActivities);

  // 在实际应用中，这里应该从API获取老人的实时数据
  useEffect(() => {
    // 模拟API调用
    const fetchElderData = async () => {
      // 这里应该是实际的API调用
      setElderProfile(mockElderProfile);
      setElderActivities(mockElderActivities);
    };

    fetchElderData();
    // 设置定时刷新
    const interval = setInterval(fetchElderData, 60000); // 每分钟刷新一次
    return () => clearInterval(interval);
  }, []);

  const handleSendEncouragement = () => {
    // 实现发送鼓励消息的逻辑
    console.log('发送鼓励消息');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>家人健康概览</Text>
        <Text style={styles.subtitle}>{elderProfile.name} · {elderProfile.age}岁</Text>
      </View>

      {/* 健康概要卡片 */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>健康状态</Text>
            <Text style={styles.summaryValue}>{elderProfile.summary.healthStatus}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>饮食达标率</Text>
            <Text style={styles.summaryValue}>{elderProfile.summary.dietaryCompliance}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>今日用餐</Text>
            <Text style={styles.summaryValue}>{elderProfile.summary.recentMeals}餐</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>饮水量</Text>
            <Text style={styles.summaryValue}>{elderProfile.summary.waterIntake}杯</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>最近活动</Text>
            <Text style={styles.summaryValue}>{elderProfile.summary.lastActivity}</Text>
          </View>
        </View>
      </View>

      {/* 操作按钮 */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleSendEncouragement}>
          <Ionicons name="heart-outline" size={24} color="#4CAF50" />
          <Text style={styles.actionButtonText}>发送鼓励</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/elder-details')}
        >
          <Ionicons name="document-text-outline" size={24} color="#4CAF50" />
          <Text style={styles.actionButtonText}>查看详情</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => console.log('协助购物')}>
          <Ionicons name="cart-outline" size={24} color="#4CAF50" />
          <Text style={styles.actionButtonText}>协助购物</Text>
        </TouchableOpacity>
      </View>

      {/* 活动记录 */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>今日活动</Text>
        {elderActivities.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityTimeContainer}>
              <Text style={styles.activityTime}>{activity.time}</Text>
              <View style={styles.timelineDot} />
              <View style={styles.timelineLine} />
            </View>
            <View style={styles.activityContent}>
              <View style={styles.activityIconContainer}>
                <Ionicons 
                  name={activity.type === 'meal' ? 'restaurant-outline' : 'water-outline'} 
                  size={20} 
                  color={activity.type === 'meal' ? '#FF9800' : '#2196F3'} 
                />
              </View>
              <Text style={styles.activityText}>{activity.content}</Text>
            </View>
          </View>
        ))}
      </View>
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
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    margin: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    marginTop: 5,
    fontSize: 14,
    color: '#4CAF50',
  },
  activitySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  activityTimeContainer: {
    width: 60,
    alignItems: 'center',
    position: 'relative',
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginTop: 5,
  },
  timelineLine: {
    position: 'absolute',
    top: 25,
    bottom: -15,
    width: 2,
    backgroundColor: '#E0E0E0',
    left: '50%',
    marginLeft: -1,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 10,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityText: {
    fontSize: 14,
  },
}); 