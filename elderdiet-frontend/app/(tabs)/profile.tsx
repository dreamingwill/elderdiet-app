import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '../../contexts/UserContext';
import { useProfile } from '../../hooks/useProfile';

export default function MeScreen() {
  const { phone, role, signOut } = useUser();
  const { profile, isLoading, error, refreshProfile } = useProfile();

  // 获取性别显示文本
  const getGenderText = (gender?: string): string => {
    switch (gender) {
      case 'male': return '男';
      case 'female': return '女';
      case 'other': return '其他';
      default: return '未设置';
    }
  };

  // 获取角色显示文本
  const getRoleText = (role: 'ELDER' | 'CHILD'): string => {
    return role === 'ELDER' ? '老人' : '家属';
  };

  // 获取BMI状态文本
  const getBMIStatusText = (status?: string): string => {
    switch (status) {
      case 'underweight': return '偏瘦';
      case 'normal': return '正常';
      case 'overweight': return '超重';
      case 'obese': return '肥胖';
      default: return '未知';
    }
  };

  // 获取BMI状态颜色
  const getBMIStatusColor = (status?: string): string => {
    switch (status) {
      case 'normal': return '#4CAF50';
      case 'underweight': return '#FF9800';
      case 'overweight': return '#FF5722';
      case 'obese': return '#F44336';
      default: return '#999';
    }
  };

  // 渲染慢性疾病标签
  const renderChronicConditions = () => {
    if (!profile?.chronicConditions || profile.chronicConditions.length === 0) {
      return <Text style={styles.placeholderText}>暂无慢性疾病记录</Text>;
    }

    const conditions = profile.chronicConditions;
    const displayed = conditions.slice(0, 3);
    const remaining = conditions.length - 3;

    return (
      <View style={styles.tagsContainer}>
        {displayed.map((condition, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{getConditionLabel(condition)}</Text>
          </View>
        ))}
        {remaining > 0 && (
          <View style={[styles.tag, styles.remainingTag]}>
            <Text style={styles.remainingText}>+{remaining}</Text>
          </View>
        )}
      </View>
    );
  };

  // 渲染饮食偏好标签
  const renderDietaryPreferences = () => {
    if (!profile?.dietaryPreferences || profile.dietaryPreferences.length === 0) {
      return <Text style={styles.placeholderText}>暂无饮食偏好记录</Text>;
    }

    const preferences = profile.dietaryPreferences;
    const displayed = preferences.slice(0, 3);
    const remaining = preferences.length - 3;

    return (
      <View style={styles.tagsContainer}>
        {displayed.map((preference, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{preference}</Text>
          </View>
        ))}
        {remaining > 0 && (
          <View style={[styles.tag, styles.remainingTag]}>
            <Text style={styles.remainingText}>+{remaining}</Text>
          </View>
        )}
      </View>
    );
  };

  // 慢性疾病标签映射
  const getConditionLabel = (condition: string): string => {
    const labels: Record<string, string> = {
      hypertension: '高血压',
      diabetes: '糖尿病',
      heart_disease: '心脏病',
      asthma: '哮喘',
      arthritis: '关节炎',
      hyperlipidemia: '高血脂',
      others: '其他',
    };
    return labels[condition] || condition;
  };

  // 跳转到编辑页面
  const handleEdit = () => {
    router.push('/edit-profile');
  };

  // 退出登录处理
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refreshProfile} />
      }
    >
      {/* 头部用户信息 */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {/* 头像 */}
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#999" />
          </View>

          {/* 基本信息 */}
          <View style={styles.basicInfo}>
            <Text style={styles.userName}>
              {profile?.name || '请完善姓名'}
            </Text>
            <View style={styles.userDetails}>
              <Text style={styles.userDetailText}>
                {profile?.age ? `${profile.age}岁` : '年龄未设置'} · {getGenderText(profile?.gender)} · {role ? getRoleText(role) : '角色未设置'}
              </Text>
              <Text style={styles.userDetailText}>
                {profile?.region || '地区未设置'}
              </Text>
            </View>
          </View>

          {/* 设置按钮 */}
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 健康档案卡片 */}
      <View style={styles.healthCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>健康档案</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color="#4CAF50" />
            <Text style={styles.editText}>修改</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>加载失败：{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : (
          <>
            {/* BMI信息 */}
            <View style={styles.bmiSection}>
              <Text style={styles.sectionTitle}>身体指标</Text>
              {profile ? (
                <View style={styles.bmiContainer}>
                  <View style={styles.bmiInfo}>
                    <Text style={styles.bmiValue}>
                      BMI: {profile.bmi?.toFixed(1) || '--'}
                    </Text>
                    <View style={[
                      styles.bmiStatus,
                      { backgroundColor: getBMIStatusColor(profile.bmiStatus) }
                    ]}>
                      <Text style={styles.bmiStatusText}>
                        {getBMIStatusText(profile.bmiStatus)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.physicalInfo}>
                    身高 {profile.height}cm · 体重 {profile.weight}kg
                  </Text>
                </View>
              ) : (
                <Text style={styles.placeholderText}>请完善身体指标信息</Text>
              )}
            </View>

            {/* 慢性疾病 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>主要慢性病史</Text>
              {renderChronicConditions()}
            </View>

            {/* 饮食偏好 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>饮食偏好</Text>
              {renderDietaryPreferences()}
            </View>

            {/* 活动量（占位，后续扩展） */}
            {/* <View style={styles.section}>
              <Text style={styles.sectionTitle}>活动量</Text>
              <Text style={styles.placeholderText}>久坐</Text>
            </View> */}
          </>
        )}
      </View>

      {/* 成就勋章卡片（占位，后续扩展） */}
      <View style={styles.achievementCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>成就勋章</Text>
          <TouchableOpacity>
            <Text style={styles.ruleText}>规则</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.achievementContent}>
          <Text style={styles.achievementNumber}>35</Text>
          <Text style={styles.achievementDesc}>累计获得 3 枚勋章</Text>
          <Text style={styles.achievementDetail}>
            持续打卡 10 天获得"持之以恒奖"
          </Text>
          <Text style={styles.achievementSummary}>
            至今，您已经坚持打卡 35 天，其中最长连续打卡 6 天
          </Text>
        </View>
      </View>

      {/* 账号管理 */}
      <View style={styles.accountCard}>
        <Text style={styles.cardTitle}>账号管理</Text>
        <View style={styles.accountInfo}>
          <Text style={styles.phoneText}>当前手机号：{phone?.slice(0,3)}****{phone?.slice(-4)}</Text>
        </View>
        
        {/* 退出登录按钮 */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.signOutText}>退出登录</Text>
        </TouchableOpacity>
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
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  basicInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userDetails: {
    gap: 2,
  },
  userDetailText: {
    fontSize: 14,
    color: '#666',
  },
  settingsButton: {
    padding: 8,
  },
  healthCard: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  bmiSection: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  bmiContainer: {
    gap: 8,
  },
  bmiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bmiValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  bmiStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bmiStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  physicalInfo: {
    fontSize: 14,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e8f5e8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  remainingTag: {
    backgroundColor: '#f0f0f0',
  },
  remainingText: {
    fontSize: 14,
    color: '#666',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  achievementCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ruleText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  achievementContent: {
    alignItems: 'center',
    gap: 8,
  },
  achievementNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  achievementDesc: {
    fontSize: 16,
    color: '#666',
  },
  achievementDetail: {
    fontSize: 14,
    color: '#4CAF50',
  },
  achievementSummary: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  accountCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accountInfo: {
    marginTop: 12,
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
  },
  signOutButton: {
    backgroundColor: '#ff4757',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
}); 