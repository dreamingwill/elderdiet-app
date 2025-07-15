import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '../../contexts/UserContext';
import { useProfile } from '../../hooks/useProfile';
import { familyAPI, FamilyMember } from '../../services/api';

export default function MeScreen() {
  const { phone, role, signOut, token } = useUser();
  const { profile, isLoading, error, refreshProfile } = useProfile();
  const [isAddChildModalVisible, setIsAddChildModalVisible] = useState(false);
  const [childPhone, setChildPhone] = useState('');
  const [isLinkingFamily, setIsLinkingFamily] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isFamilyLoading, setIsFamilyLoading] = useState(false);

  // 获取家庭成员信息
  const loadFamilyMembers = async () => {
    if (!token || role !== 'ELDER') return;
    
    setIsFamilyLoading(true);
    try {
      const response = await familyAPI.getFamilyMembers(token);
      if (response.success && response.data) {
        setFamilyMembers(response.data);
      }
    } catch (error) {
      console.error('Failed to load family members:', error);
    } finally {
      setIsFamilyLoading(false);
    }
  };

  // 组件加载时获取家庭成员信息
  useEffect(() => {
    loadFamilyMembers();
  }, [token, role]);

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

  // 渲染慢性疾病标签
  const renderChronicConditions = () => {
    if (!profile?.chronicConditions || profile.chronicConditions.length === 0) {
      return <Text style={styles.placeholderText}>暂无慢性疾病记录</Text>;
    }

    const displayConditions = profile.chronicConditions.slice(0, 3);
    const remaining = profile.chronicConditions.length - 3;

    return (
      <View style={styles.tagsContainer}>
        {displayConditions.map((condition, index) => (
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
      return <Text style={styles.placeholderText}>暂无饮食偏好设置</Text>;
    }

    const displayPreferences = profile.dietaryPreferences.slice(0, 3);
    const remaining = profile.dietaryPreferences.length - 3;

    return (
      <View style={styles.tagsContainer}>
        {displayPreferences.map((preference, index) => (
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

  // 跳转到编辑页面
  const handleEdit = () => {
    router.push('/edit-profile');
  };

  // 渲染家庭成员信息
  const renderFamilyMembers = () => {
    if (isFamilyLoading) {
      return (
        <View style={styles.familyLoadingContainer}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.familyLoadingText}>加载中...</Text>
        </View>
      );
    }

    if (familyMembers.length === 0) {
      return (
        <View style={styles.emptyFamilyContainer}>
          <Ionicons name="people-outline" size={48} color="#ccc" />
          <Text style={styles.emptyFamilyText}>还没有添加家庭成员</Text>
          <Text style={styles.emptyFamilyDesc}>添加子女账号后，可以共享健康信息</Text>
        </View>
      );
    }

    return (
      <View style={styles.familyMembersList}>
        {familyMembers.map((member, index) => (
          <View key={member.user_id} style={styles.familyMemberCard}>
            <View style={styles.memberAvatar}>
              {member.profile?.avatar ? (
                <Image source={{ uri: member.profile.avatar }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={32} color="#999" />
              )}
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {member.profile?.name || '未设置姓名'}
              </Text>
              <Text style={styles.memberDetails}>
                {member.profile?.age ? `${member.profile.age}岁` : '年龄未设置'} · {
                  member.profile?.gender === 'male' ? '男' : 
                  member.profile?.gender === 'female' ? '女' : '未设置'
                }
              </Text>
              <Text style={styles.memberRole}>
                {member.relationship === 'child' ? '子女' : '家长'}
              </Text>
            </View>
            <View style={styles.memberActions}>
              <TouchableOpacity style={styles.memberActionButton}>
                <Ionicons name="chatbubble-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // 添加子女账号
  const handleAddChild = async () => {
    if (!childPhone.trim()) {
      Alert.alert('提示', '请输入子女手机号');
      return;
    }

    // 简单的手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(childPhone)) {
      Alert.alert('提示', '请输入正确的手机号格式');
      return;
    }

    if (childPhone === phone) {
      Alert.alert('提示', '不能添加自己的手机号');
      return;
    }

    setIsLinkingFamily(true);
    try {
      const response = await familyAPI.linkFamily({ child_phone: childPhone }, token!);
      if (response.success) {
        Alert.alert('成功', '家庭链接创建成功！', [
          {
            text: '确定',
            onPress: () => {
              setIsAddChildModalVisible(false);
              setChildPhone('');
              // 刷新家庭成员列表
              loadFamilyMembers();
            },
          },
        ]);
      } else {
        Alert.alert('失败', response.message || '链接失败，请重试');
      }
    } catch (error: any) {
      console.error('Link family error:', error);
      Alert.alert('错误', error.message || '网络错误，请重试');
    } finally {
      setIsLinkingFamily(false);
    }
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
          </>
        )}
      </View>

      {/* 家庭管理卡片 - 仅老人角色显示 */}
      {role === 'ELDER' && (
        <View style={styles.familyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>家庭管理</Text>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setIsAddChildModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
              <Text style={styles.addText}>添加子女</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.familyContent}>
            {renderFamilyMembers()}
          </View>
        </View>
      )}

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

      {/* 账户信息卡片 */}
      <View style={styles.accountCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>账户信息</Text>
        </View>
        
        <View style={styles.accountInfo}>
          <Text style={styles.phoneText}>手机号: {phone}</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.signOutText}>退出登录</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 添加子女模态框 */}
      <Modal
        visible={isAddChildModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAddChildModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加子女账号</Text>
              <TouchableOpacity 
                onPress={() => setIsAddChildModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>子女手机号</Text>
              <TextInput
                style={styles.phoneInput}
                value={childPhone}
                onChangeText={setChildPhone}
                placeholder="请输入子女的手机号码"
                keyboardType="phone-pad"
                maxLength={11}
              />
              <Text style={styles.inputHint}>
                请确保输入的手机号已注册为子女账号
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsAddChildModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, isLinkingFamily && styles.disabledButton]}
                onPress={handleAddChild}
                disabled={isLinkingFamily}
              >
                {isLinkingFamily ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>确认添加</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 16,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  basicInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
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
    marginHorizontal: 16,
    marginTop: 12,
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
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4757',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
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
  familyCard: {
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  familyContent: {
    marginTop: 12,
  },
  familyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  familyItemText: {
    fontSize: 16,
    color: '#333',
  },
  familyDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  
  // 模态框样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  
  // 家庭成员相关样式
  familyLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  familyLoadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyFamilyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyFamilyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  emptyFamilyDesc: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  familyMembersList: {
    gap: 12,
  },
  familyMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    gap: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  memberDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  memberActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
}); 