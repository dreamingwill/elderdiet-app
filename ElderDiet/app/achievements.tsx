import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHECKIN_KEY = '@checkin_data';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedDate?: string;
}

interface CheckinData {
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  achievements: number;
}

export default function AchievementsScreen() {
  const [checkinData, setCheckinData] = useState<CheckinData>({
    totalDays: 129,
    currentStreak: 102,
    longestStreak: 129,
    achievements: 12
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: '初来乍到',
      description: '完成第一次健康打卡',
      icon: 'star',
      color: '#FFD700',
      unlocked: true,
      unlockedDate: '2024-01-01'
    },
    {
      id: '2',
      title: '坚持一周',
      description: '连续打卡7天',
      icon: 'star',
      color: '#FFD700',
      unlocked: true,
      unlockedDate: '2024-01-07'
    },
    {
      id: '3',
      title: '持之以恒',
      description: '连续打卡30天',
      icon: 'star',
      color: '#FFD700',
      unlocked: true,
      unlockedDate: '2024-01-30'
    },
    {
      id: '4',
      title: '百日坚持',
      description: '连续打卡100天',
      icon: 'ribbon',
      color: '#4CAF50',
      unlocked: true,
      unlockedDate: '2024-04-10'
    },
    {
      id: '5',
      title: '营养达人',
      description: '记录100次膳食',
      icon: 'restaurant',
      color: '#FF9800',
      unlocked: true,
      unlockedDate: '2024-03-15'
    },
    {
      id: '6',
      title: '健康专家',
      description: '完善所有健康档案信息',
      icon: 'medical',
      color: '#2196F3',
      unlocked: true,
      unlockedDate: '2024-01-15'
    },
    {
      id: '7',
      title: '分享达人',
      description: '分享10次健康心得',
      icon: 'share-social',
      color: '#9C27B0',
      unlocked: false
    },
    {
      id: '8',
      title: '年度坚持',
      description: '连续打卡365天',
      icon: 'trophy',
      color: '#FF5722',
      unlocked: false
    }
  ]);

  useEffect(() => {
    loadCheckinData();
  }, []);

  const loadCheckinData = async () => {
    try {
      const savedData = await AsyncStorage.getItem(CHECKIN_KEY);
      if (savedData) {
        setCheckinData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error('Error loading checkin data:', error);
    }
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>成就勋章</Text>
        <Text style={styles.subtitle}>您已获得 {unlockedAchievements.length} 个成就</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{checkinData.totalDays}</Text>
          <Text style={styles.statLabel}>总打卡天数</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{checkinData.currentStreak}</Text>
          <Text style={styles.statLabel}>当前连续</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{checkinData.longestStreak}</Text>
          <Text style={styles.statLabel}>最长连续</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>已获得成就</Text>
        <View style={styles.achievementsGrid}>
          {unlockedAchievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
                <Ionicons name={achievement.icon as any} size={24} color="white" />
              </View>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
              {achievement.unlockedDate && (
                <Text style={styles.achievementDate}>获得于 {achievement.unlockedDate}</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>未解锁成就</Text>
        <View style={styles.achievementsGrid}>
          {lockedAchievements.map((achievement) => (
            <View key={achievement.id} style={[styles.achievementCard, styles.lockedCard]}>
              <View style={[styles.achievementIcon, styles.lockedIcon]}>
                <Ionicons name="lock-closed" size={24} color="#999" />
              </View>
              <Text style={[styles.achievementTitle, styles.lockedText]}>{achievement.title}</Text>
              <Text style={[styles.achievementDescription, styles.lockedText]}>{achievement.description}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.rulesSection}>
        <Text style={styles.rulesTitle}>成就规则说明</Text>
        <Text style={styles.rulesText}>
          • 每日完成健康打卡可获得积分{'\n'}
          • 连续打卡天数越多，获得的成就越丰富{'\n'}
          • 完善健康档案信息可解锁特殊成就{'\n'}
          • 分享健康心得可获得社交类成就{'\n'}
          • 所有成就都会永久保存在您的账户中
        </Text>
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
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lockedCard: {
    backgroundColor: '#f8f8f8',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lockedIcon: {
    backgroundColor: '#e0e0e0',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDate: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  lockedText: {
    color: '#999',
  },
  rulesSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  rulesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 