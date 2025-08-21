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
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../../contexts/UserContext';
import { useProfile } from '../../hooks/useProfile';
import { familyAPI, FamilyMember, profileAPI, authAPI, AddFamilyMemberRequest } from '../../services/api';
import { trackingService } from '@/services/trackingService';

export default function MeScreen() {
  const { phone, role, signOut, token, setUser } = useUser();
  const { profile, isLoading, error, refreshProfile } = useProfile();
  const [isAddChildModalVisible, setIsAddChildModalVisible] = useState(false);
  const [childPhone, setChildPhone] = useState('');
  const [isLinkingFamily, setIsLinkingFamily] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isFamilyLoading, setIsFamilyLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAddElderModalVisible, setIsAddElderModalVisible] = useState(false);
  const [elderPhone, setElderPhone] = useState('');
  const [isLinkingElder, setIsLinkingElder] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isRoleChangeConfirmModalVisible, setIsRoleChangeConfirmModalVisible] = useState(false);

  // 获取家庭成员信息
  const loadFamilyMembers = async () => {
    if (!token) return;
    
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

  // 页面访问追踪
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔥 Profile useFocusEffect触发');
      try {
        console.log('🔥 开始profile页面访问追踪...');
        trackingService.startPageVisit('profile', '我的', '/(tabs)/profile');
        console.log('✅ profile页面访问追踪调用完成');
      } catch (error) {
        console.error('❌ profile页面访问追踪失败:', error);
      }
      
      return () => {
        console.log('🔥 Profile页面离开，结束访问追踪');
        try {
          trackingService.endPageVisit('navigation');
        } catch (error) {
          console.error('❌ 结束profile页面访问追踪失败:', error);
        }
      };
    }, [])
  );

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
    return role === 'ELDER' ? '长者' : '家属';
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
      // 心血管系统疾病
      hypertension: '高血压',
      heart_disease: '心脏病',
      coronary_heart_disease: '冠心病',
      arrhythmia: '心律不齐',
      heart_failure: '心力衰竭',
      hyperlipidemia: '高血脂',
      atherosclerosis: '动脉硬化',

      // 内分泌代谢系统疾病
      diabetes: '糖尿病',
      type_2_diabetes: '2型糖尿病',
      thyroid_disease: '甲状腺疾病',
      hyperthyroidism: '甲亢',
      hypothyroidism: '甲减',
      gout: '痛风',
      obesity: '肥胖症',

      // 呼吸系统疾病
      asthma: '哮喘',
      copd: '慢性阻塞性肺疾病',
      chronic_bronchitis: '慢性支气管炎',
      pulmonary_fibrosis: '肺纤维化',

      // 消化系统疾病
      gastritis: '胃炎',
      peptic_ulcer: '消化性溃疡',
      ibs: '肠易激综合征',
      chronic_hepatitis: '慢性肝炎',
      cirrhosis: '肝硬化',
      gallstones: '胆结石',

      // 泌尿系统疾病
      chronic_kidney_disease: '慢性肾病',
      kidney_stones: '肾结石',
      prostate_hyperplasia: '前列腺增生',
      urinary_incontinence: '尿失禁',

      // 神经系统疾病
      stroke: '脑卒中',
      parkinsons_disease: '帕金森病',
      alzheimers_disease: '阿尔茨海默病',
      dementia: '痴呆症',
      epilepsy: '癫痫',
      migraine: '偏头痛',

      // 骨骼肌肉系统疾病
      osteoporosis: '骨质疏松症',
      arthritis: '关节炎',
      rheumatoid_arthritis: '类风湿关节炎',
      osteoarthritis: '骨关节炎',
      lumbar_disc_herniation: '腰椎间盘突出',
      cervical_spondylosis: '颈椎病',

      // 眼科疾病
      cataract: '白内障',
      glaucoma: '青光眼',
      macular_degeneration: '黄斑变性',
      diabetic_retinopathy: '糖尿病视网膜病变',

      // 皮肤疾病
      eczema: '湿疹',
      psoriasis: '银屑病',
      dermatitis: '皮炎',

      // 血液系统疾病
      anemia: '贫血',
      thrombosis: '血栓症',

      // 精神心理疾病
      depression: '抑郁症',
      anxiety_disorder: '焦虑症',
      insomnia: '失眠症',

      // 肿瘤疾病
      cancer_history: '肿瘤病史',
      benign_tumor: '良性肿瘤',

      // 其他
      chronic_fatigue_syndrome: '慢性疲劳综合征',
      fibromyalgia: '纤维肌痛症',
      others: '其他',
    };
    return labels[condition] || condition;
  };

  // 渲染慢性疾病标签
  const renderChronicConditions = () => {
    if (!profile?.chronic_conditions || profile.chronic_conditions.length === 0) {
      return <Text style={styles.placeholderText}>暂无慢性疾病记录</Text>;
    }

    const displayConditions = profile.chronic_conditions.slice(0, 3);
    const remaining = profile.chronic_conditions.length - 3;

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
    if (!profile?.dietary_preferences || profile.dietary_preferences.length === 0) {
      return <Text style={styles.placeholderText}>暂无饮食偏好设置</Text>;
    }

    const displayPreferences = profile.dietary_preferences.slice(0, 3);
    const remaining = profile.dietary_preferences.length - 3;

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
  
  // 选择并上传头像
  const handleAvatarUpload = async () => {
    if (!token) {
      Alert.alert('错误', '请先登录');
      return;
    }
    
    // 请求相册访问权限
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要相册访问权限才能选择头像');
      return;
    }
    
    try {
      // 打开图片选择器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // 开始上传
        setIsUploadingAvatar(true);
        try {
          const response = await profileAPI.uploadAvatar(selectedImage.uri, token);
          
          if (response.success && response.data) {
            // 更新个人资料（包括新头像URL）
            refreshProfile();
            Alert.alert('成功', '头像上传成功');
          } else {
            Alert.alert('失败', response.message || '头像上传失败');
          }
        } catch (error: any) {
          console.error('Avatar upload error:', error);
          Alert.alert('错误', error.message || '上传过程中发生错误');
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('错误', '选择图片时发生错误');
    }
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
              {member.avatar_url ? (
                <Image source={{ uri: member.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={32} color="#999" />
              )}
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {member.name || '未设置姓名'}
              </Text>
              <Text style={styles.memberDetails}>
                {member.age ? `${member.age}岁` : '年龄未设置'} · {
                  member.gender === 'male' ? '男' : 
                  member.gender === 'female' ? '女' : '未设置'
                }
              </Text>
              <Text style={styles.memberRole}>
                {member.relationship_type === 'child' ? '子女' : '家长'}
              </Text>
            </View>
            
            {/* 删除按钮 */}
            <View style={styles.memberActions}>
              <TouchableOpacity 
                style={styles.memberDeleteButton}
                onPress={() => handleRemoveFamilyMember(member)}
              >
                <Ionicons name="trash-outline" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* <View style={styles.memberActions}>
              <TouchableOpacity style={styles.memberActionButton}>
                <Ionicons name="chatbubble-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View> */}
          </View>
        ))}
      </View>
    );
  };

  // 通用添加家庭成员（支持双角色系统）
  const handleAddFamilyMember = async (memberPhone: string) => {
    if (!memberPhone.trim()) {
      Alert.alert('提示', '请输入家庭成员手机号');
      return;
    }

    // 简单的手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(memberPhone)) {
      Alert.alert('提示', '请输入正确的手机号格式');
      return;
    }

    if (memberPhone === phone) {
      Alert.alert('提示', '不能添加自己的手机号');
      return;
    }

    const isAddingChild = role === 'ELDER';
    setIsLinkingFamily(isAddingChild);
    setIsLinkingElder(!isAddingChild);

    try {
      const request: AddFamilyMemberRequest = { phone: memberPhone };
      const response = await familyAPI.addFamilyMember(request, token!);
      
      if (response.success) {
        const memberType = role === 'ELDER' ? '家庭成员' : '家庭成员';
        Alert.alert('成功', `${memberType}添加成功！系统已自动建立正确的家庭关系`, [
          {
            text: '确定',
            onPress: () => {
              if (isAddingChild) {
                setIsAddChildModalVisible(false);
                setChildPhone('');
              } else {
                setIsAddElderModalVisible(false);
                setElderPhone('');
              }
              // 刷新家庭成员列表
              loadFamilyMembers();
            },
          },
        ]);
      } else {
        Alert.alert('失败', response.message || '添加失败，请重试');
      }
    } catch (error: any) {
      console.error('Add family member error:', error);
      Alert.alert('错误', error.message || '网络错误，请重试');
    } finally {
      setIsLinkingFamily(false);
      setIsLinkingElder(false);
    }
  };

  // 添加子女账号（兼容旧版本）
  const handleAddChild = async () => {
    await handleAddFamilyMember(childPhone);
  };

  // 添加长者账号（兼容旧版本）
  const handleAddElder = async () => {
    await handleAddFamilyMember(elderPhone);
  };

  // 删除家庭成员
  const handleRemoveFamilyMember = async (member: FamilyMember) => {
    if (!token) {
      Alert.alert('错误', '请先登录');
      return;
    }

    // 获取成员类型名称用于显示
    const memberTypeName = member.relationship_type === 'child' ? '子女' : 
                          member.relationship_type === 'parent' ? '家长' : '家庭成员';

    Alert.alert(
      '确认删除',
      `确定要删除家庭成员"${member.name || member.phone}"吗？\n\n删除后将无法查看其相关信息，需要重新添加才能恢复关系。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await familyAPI.removeFamilyMember(member.user_id, token);
              
              if (response.success) {
                Alert.alert('成功', `${memberTypeName}删除成功`, [
                  {
                    text: '确定',
                    onPress: () => {
                      // 刷新家庭成员列表
                      loadFamilyMembers();
                    },
                  },
                ]);
              } else {
                Alert.alert('失败', response.message || '删除失败，请重试');
              }
            } catch (error: any) {
              console.error('Remove family member error:', error);
              Alert.alert('错误', error.message || '网络错误，请重试');
            }
          },
        },
      ]
    );
  };

  // 获取添加按钮的文案
  const getAddButtonText = () => {
    if (role === 'ELDER') {
      return '添加家庭成员';
    } else {
      return '添加家庭成员';
    }
  };

  // 获取模态框标题
  const getModalTitle = () => {
    if (role === 'ELDER') {
      return '添加家庭成员';
    } else {
      return '添加家庭成员';
    }
  };

  // 获取输入框标签
  const getInputLabel = () => {
    if (role === 'ELDER') {
      return '家庭成员手机号';
    } else {
      return '家庭成员手机号';
    }
  };

  // 获取输入框提示
  const getInputPlaceholder = () => {
    if (role === 'ELDER') {
      return '请输入家庭成员的手机号码';
    } else {
      return '请输入家庭成员的手机号码';
    }
  };

  // 获取输入提示
  const getInputHint = () => {
    if (role === 'ELDER') {
      return '系统会根据对方的当前角色自动建立正确的家庭关系';
    } else {
      return '系统会根据对方的当前角色自动建立正确的家庭关系';
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

  // 角色切换处理
  const handleChangeRole = () => {
    const currentRoleText = role === 'ELDER' ? '长者' : '家属';
    const targetRoleText = role === 'ELDER' ? '家属' : '长者';
    
    Alert.alert(
      '角色切换确认',
      `您当前是${currentRoleText}角色，确定要切换为${targetRoleText}角色吗？\n\n说明：\n• 切换角色后将显示对应角色的家庭关系视图\n• ${targetRoleText}角色下可以看到不同的关系列表\n• 所有家庭关系数据都会保留\n• 可以随时切换回来`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定切换',
          onPress: showRoleChangeConfirmation,
        },
      ]
    );
  };

  const showRoleChangeConfirmation = () => {
    setIsRoleChangeConfirmModalVisible(true);
  };

  const handleRoleChangeConfirm = () => {
    setIsRoleChangeConfirmModalVisible(false);
    performRoleChange('CHANGE_ROLE'); // 直接传入确认字符串
  };

  const handleRoleChangeCancel = () => {
    setIsRoleChangeConfirmModalVisible(false);
  };

  const performRoleChange = async (confirmationText: string) => {
    if (!token) {
      Alert.alert('错误', '请先登录');
      return;
    }

    setIsChangingRole(true);
    try {
      const response = await authAPI.changeRole(confirmationText, token);
      
      if (response.success && response.data) {
        // 更新用户信息和token
        await setUser({
          phone: response.data.phone,
          role: response.data.role,
          uid: response.data.uid,
          token: response.data.token,
        });
        
        // 刷新个人资料
        refreshProfile();
        
        // 重新加载家庭成员信息
        loadFamilyMembers();
        
        Alert.alert(
          '切换成功', 
          `您已成功切换为${response.data.role === 'ELDER' ? '长者' : '家属'}角色`,
          [
            {
              text: '确定',
              onPress: () => {
                // 可以选择跳转到主页或刷新当前页面
                router.replace('/(tabs)/profile');
              }
            }
          ]
        );
      } else {
        Alert.alert('切换失败', response.message || '角色切换失败，请重试');
      }
    } catch (error: any) {
      console.error('Role change error:', error);
      Alert.alert('错误', error.message || '角色切换过程中发生错误');
    } finally {
      setIsChangingRole(false);
    }
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
          {/* 头像 - 可点击上传 */}
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={handleAvatarUpload}
            disabled={isUploadingAvatar}
          >
            <View style={styles.avatar}>
              {isUploadingAvatar ? (
                <ActivityIndicator size="large" color="#4CAF50" />
              ) : profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.userAvatarImage} />
              ) : (
                <Ionicons name="person" size={40} color="#999" />
              )}
            </View>
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

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
          {/* <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity> */}
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
                      { backgroundColor: getBMIStatusColor(profile.bmi_status) }
                    ]}>
                      <Text style={styles.bmiStatusText}>
                        {getBMIStatusText(profile.bmi_status)}
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

      {/* 家庭管理卡片 */}
      {(role === 'ELDER' || role === 'CHILD') && (
        <View style={styles.familyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              家庭管理 
            </Text>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => role === 'ELDER' ? setIsAddChildModalVisible(true) : setIsAddElderModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
              <Text style={styles.addText}>{getAddButtonText()}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.familyContent}>
            {renderFamilyMembers()}
          </View>
        </View>
      )}

      {/* 成就勋章卡片（占位，后续扩展） */}
      {/* <View style={styles.achievementCard}>
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
      </View> */}

      {/* 账户信息卡片 */}
      <View style={styles.accountCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>账户信息</Text>
        </View>
        
        <View style={styles.accountInfo}>
          <Text style={styles.phoneText}>手机号: {phone}</Text>

          {/* 角色切换按钮 */}
          <TouchableOpacity
            style={[styles.changeRoleButton, isChangingRole && styles.disabledButton]}
            onPress={showRoleChangeConfirmation}
            disabled={isChangingRole}
          >
            <Ionicons name="swap-horizontal-outline" size={20} color="#FF9800" />
            {isChangingRole ? (
              <ActivityIndicator size="small" color="#FF9800" />
            ) : (
              <Text style={styles.changeRoleText}>
                切换角色 (当前: {role === 'ELDER' ? '长者' : '家属'})
              </Text>
            )}
          </TouchableOpacity>

          {/* 修改密码按钮 */}
          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => router.push('change-password' as any)}
          >
            <Ionicons name="key-outline" size={20} color="#4CAF50" />
            <Text style={styles.changePasswordText}>修改密码</Text>
          </TouchableOpacity>

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
              <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              <TouchableOpacity 
                onPress={() => setIsAddChildModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{getInputLabel()}</Text>
              <TextInput
                style={styles.phoneInput}
                value={childPhone}
                onChangeText={setChildPhone}
                placeholder={getInputPlaceholder()}
                keyboardType="phone-pad"
                maxLength={11}
              />
              <Text style={styles.inputHint}>
                {getInputHint()}
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

      {/* 添加长者模态框 */}
      <Modal
        visible={isAddElderModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAddElderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              <TouchableOpacity 
                onPress={() => setIsAddElderModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{getInputLabel()}</Text>
              <TextInput
                style={styles.phoneInput}
                value={elderPhone}
                onChangeText={setElderPhone}
                placeholder={getInputPlaceholder()}
                keyboardType="phone-pad"
                maxLength={11}
              />
              <Text style={styles.inputHint}>
                {getInputHint()}
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsAddElderModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, isLinkingElder && styles.disabledButton]}
                onPress={handleAddElder}
                disabled={isLinkingElder}
              >
                {isLinkingElder ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>确认添加</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 角色切换确认模态框 */}
      <Modal
        visible={isRoleChangeConfirmModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleRoleChangeCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>最终确认</Text>
              <TouchableOpacity 
                onPress={handleRoleChangeCancel}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.confirmationContent}>
              <Ionicons name="swap-horizontal" size={48} color="#FF9800" />
              <Text style={styles.confirmationTitle}>
                确定要切换角色吗？
              </Text>
              <Text style={styles.confirmationText}>
                您当前是{role === 'ELDER' ? '长者' : '家属'}角色，
                将切换为{role === 'ELDER' ? '家属' : '长者'}角色
              </Text>
              <Text style={styles.confirmationDesc}>
                • 切换后将显示对应角色的家庭关系视图
                • 所有家庭关系数据都会保留
                • 可以随时切换回来
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleRoleChangeCancel}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleRoleChangeConfirm}
              >
                <Text style={styles.confirmButtonText}>
                  确认切换
                </Text>
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
    backgroundColor: '#F7F8FA',
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
    backgroundColor: '#F7F8FA',
  },
  errorText: {
    fontSize: 14,
    color: '#ff4757',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
    backgroundColor: '#F7F8FA',
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
  changeRoleButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  changeRoleText: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: '600',
  },
  changePasswordButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  changePasswordText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
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
    backgroundColor: '#F7F8FA',
  },
  familyLoadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyFamilyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
    backgroundColor: '#F7F8FA',
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
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  userAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  editAvatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
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
  memberDeleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#f8f9fa',
  },
  confirmationContent: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmationDesc: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 