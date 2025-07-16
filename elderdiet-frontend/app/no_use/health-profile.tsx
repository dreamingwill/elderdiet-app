import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';

const STORAGE_KEY = '@health_profile';
const CHECKIN_KEY = '@checkin_data';

interface HealthProfile {
  name: string;
  age: string;
  gender: string;
  location: string;
  height: string;
  weight: string;
  healthConditions: string[];
  dietaryPreferences: string[];
  activityLevel: string;
}

interface CheckinData {
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  achievements: number;
}

export default function ProfileScreen() {
  const { signOut, role, uid } = useUser();
  const [profile, setProfile] = useState<HealthProfile>({
    name: 'XXX',
    age: '60',
    gender: '男性',
    location: '湖南人',
    height: '',
    weight: '',
    healthConditions: ['高血压', '糖尿病', '骨质疏松'],
    dietaryPreferences: ['爱吃辣', '海鲜过敏'],
    activityLevel: '久坐'
  });

  const [checkinData, setCheckinData] = useState<CheckinData>({
    totalDays: 1290,
    currentStreak: 102,
    longestStreak: 129,
    achievements: 12
  });

  useEffect(() => {
    // Clear potentially corrupted data first (for debugging)
    // AsyncStorage.removeItem(STORAGE_KEY);
    loadProfile();
    loadCheckinData();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        console.log('Loaded profile from storage:', parsedProfile);
        
        // Ensure arrays are properly initialized with strict type checking
        const healthConditions = Array.isArray(parsedProfile.healthConditions) 
          ? parsedProfile.healthConditions 
          : ['高血压', '糖尿病', '骨质疏松'];
          
        const dietaryPreferences = Array.isArray(parsedProfile.dietaryPreferences)
          ? parsedProfile.dietaryPreferences
          : ['爱吃辣', '海鲜过敏'];
        
        setProfile({
          name: parsedProfile.name || 'XXX',
          age: parsedProfile.age || '60',
          gender: parsedProfile.gender || '男性',
          location: parsedProfile.location || '湖南人',
          height: parsedProfile.height || '',
          weight: parsedProfile.weight || '',
          healthConditions,
          dietaryPreferences,
          activityLevel: parsedProfile.activityLevel || '久坐'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Reset to default values on error
      setProfile({
        name: 'XXX',
        age: '60',
        gender: '男性',
        location: '湖南人',
        height: '',
        weight: '',
        healthConditions: ['高血压', '糖尿病', '骨质疏松'],
        dietaryPreferences: ['爱吃辣', '海鲜过敏'],
        activityLevel: '久坐'
      });
    }
  };

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

  const navigateToSettings = () => {
    router.push('/settings');
  };

  const navigateToEditProfile = () => {
    router.push('/edit-profile');
  };

  const navigateToAchievements = () => {
    router.push('/achievements');
  };

  const handleSignOut = () => {
    Alert.alert(
      '退出登录',
      '确定要退出当前账号吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('开始退出登录...');
              await signOut();
              console.log('退出登录成功，准备跳转...');
              // 不需要手动跳转，主layout的useEffect会自动处理
            } catch (error) {
              console.error('退出登录失败:', error);
              Alert.alert('错误', '退出登录失败，请重试');
            }
          },
        },
      ]
    );
  };

  const clearAllData = () => {
    Alert.alert(
      '清除所有数据',
      '这将清除所有本地数据，包括登录信息。确定继续吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('成功', '所有数据已清除，请重启应用');
            } catch (error) {
              Alert.alert('错误', '清除数据失败');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 个人信息区域 */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#999" />
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameSection}>
              <Text style={styles.name}>{profile.name}</Text>
              <TouchableOpacity onPress={navigateToSettings}>
                <Ionicons name="settings-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.basicInfo}>
              <View style={styles.infoTag}>
                <Text style={styles.infoTagText}>{profile.age}岁</Text>
              </View>
              <View style={styles.infoTag}>
                <Ionicons name="male" size={16} color="#666" style={styles.genderIcon} />
                <Text style={styles.infoTagText}>{profile.gender}</Text>
              </View>
              <View style={styles.infoTag}>
                <Text style={styles.infoTagText}>{profile.location}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 健康档案卡片 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>健康档案</Text>
          <TouchableOpacity style={styles.editButton} onPress={navigateToEditProfile}>
            <Ionicons name="create-outline" size={16} color="#666" />
            <Text style={styles.editButtonText}>修改</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.healthSection}>
          <Text style={styles.sectionLabel}>主要慢性病史：</Text>
          <View style={styles.tagsContainer}>
            {Array.isArray(profile.healthConditions) && profile.healthConditions.map((condition, index) => (
              <View key={index} style={styles.healthTag}>
                <Text style={styles.healthTagText}>{condition}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.healthSection}>
          <Text style={styles.sectionLabel}>饮食偏好：</Text>
          <View style={styles.tagsContainer}>
            {Array.isArray(profile.dietaryPreferences) && profile.dietaryPreferences.map((preference, index) => (
              <View key={index} style={styles.healthTag}>
                <Text style={styles.healthTagText}>{preference}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.healthSection}>
          <Text style={styles.sectionLabel}>活动量：</Text>
          <Text style={styles.activityText}>{profile.activityLevel}</Text>
        </View>
      </View>

      {/* 成就勋章卡片 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>成就勋章</Text>
          <TouchableOpacity onPress={navigateToAchievements}>
            <Text style={styles.rulesText}>规则</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.achievementMain} onPress={navigateToAchievements}>
          <Text style={styles.achievementNumber}>{checkinData.totalDays}</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <View style={styles.achievementDetails}>
          <View style={styles.achievementRow}>
            <Text style={styles.achievementText}>
              累计获得<Text style={styles.highlightNumber}>{checkinData.achievements}</Text>枚勋章
            </Text>
            <View style={styles.medalContainer}>
              {[...Array(3)].map((_, index) => (
                <View key={index} style={styles.medal}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                </View>
              ))}
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
          </View>

          <View style={styles.achievementRow}>
            <Text style={styles.achievementText}>
              持续打卡<Text style={styles.highlightNumber}>{checkinData.currentStreak}</Text>天获得"持之以恒奖"
            </Text>
            <View style={styles.medal}>
              <Ionicons name="ribbon" size={20} color="#4CAF50" />
            </View>
          </View>

          <Text style={styles.streakText}>
            至今，您已经坚持打卡<Text style={styles.highlightNumber}>{checkinData.totalDays}</Text>天，其中最长连续打卡<Text style={styles.highlightNumber}>{checkinData.longestStreak}</Text>天
          </Text>
        </View>
      </View>

      {/* 设置和账号管理 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>账号管理</Text>
        
        {/* 当前登录信息 */}
        <View style={styles.accountInfo}>
          <Text style={styles.accountLabel}>当前账号：</Text>
          <Text style={styles.accountValue}>
            {role === 'ELDER' ? '老人账号' : '家属账号'} (UID: {uid})
          </Text>
        </View>

        {/* 退出登录按钮 */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.signOutText}>退出登录</Text>
        </TouchableOpacity>

        {/* 开发调试功能 */}
        {__DEV__ && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>调试功能（开发模式）</Text>
            <TouchableOpacity style={styles.debugButton} onPress={clearAllData}>
              <Ionicons name="trash-outline" size={16} color="#ff6b6b" />
              <Text style={styles.debugButtonText}>清除所有数据</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.debugButton, { backgroundColor: '#4CAF50', marginTop: 8 }]} 
              onPress={() => router.push('/api-test' as any)}
            >
              <Ionicons name="server-outline" size={16} color="#fff" />
              <Text style={styles.debugButtonText}>测试API连接</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 底部激励文字 */}
      <View style={styles.motivationContainer}>
        <Text style={styles.motivationText}>
          您的每一次对健康膳食的坚持都在为身体注入活力，继续保持这样的好习惯，您已经做得很棒啦！
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  basicInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genderIcon: {
    marginRight: 4,
  },
  infoTagText: {
    fontSize: 14,
    color: '#666',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  rulesText: {
    fontSize: 14,
    color: '#666',
  },
  healthSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  healthTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  healthTagText: {
    fontSize: 14,
    color: '#666',
  },
  activityText: {
    fontSize: 16,
    color: '#666',
  },
  achievementMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  achievementNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  achievementDetails: {
    gap: 12,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  achievementText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  highlightNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  medalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  medal: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  streakText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  motivationContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  motivationText: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    textAlign: 'center',
  },
  accountInfo: {
    marginBottom: 16,
  },
  accountLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
  },
  accountValue: {
    fontSize: 14,
    color: '#666',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
  },
  debugSection: {
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  debugButtonText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
  },
}); 