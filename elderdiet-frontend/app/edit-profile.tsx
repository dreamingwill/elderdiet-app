import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Stack } from 'expo-router';
import { useProfile } from '../hooks/useProfile';
import { ProfileData } from '../services/api';

export default function EditProfileScreen() {
  const { profile, chronicConditionsOptions, isLoading, isFirstTime, createProfile, updateProfile } = useProfile();
  
  // 表单状态
  const [formData, setFormData] = useState<Partial<ProfileData>>({
    name: '',
    age: 0,
    gender: 'male',
    region: '',
    height: 0,
    weight: 0,
    chronicConditions: [],
    dietaryPreferences: [],
    notes: '',
  });

  // UI状态
  const [isSaving, setIsSaving] = useState(false);
  const [showChronicModal, setShowChronicModal] = useState(false);
  const [dietaryPreferenceInput, setDietaryPreferenceInput] = useState('');

  // 错误状态
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 性别选项
  const genderOptions = [
    { label: '男', value: 'male' },
    { label: '女', value: 'female' },
    { label: '其他', value: 'other' },
  ];

  // 初始化表单数据
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        region: profile.region,
        height: profile.height,
        weight: profile.weight,
        chronicConditions: profile.chronicConditions || [],
        dietaryPreferences: profile.dietaryPreferences || [],
        notes: profile.notes || '',
      });
    }
  }, [profile]);

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '请输入姓名';
    } else if (formData.name.length > 50) {
      newErrors.name = '姓名长度不能超过50字符';
    }

    if (!formData.age || formData.age < 0 || formData.age > 120) {
      newErrors.age = '年龄必须在0-120之间';
    }

    if (!formData.region?.trim()) {
      newErrors.region = '请输入居住地区';
    } else if (formData.region.length > 100) {
      newErrors.region = '地区名称不能超过100字符';
    }

    if (!formData.height || formData.height < 80 || formData.height > 250) {
      newErrors.height = '身高必须在80-250cm之间';
    }

    if (!formData.weight || formData.weight < 30 || formData.weight > 200) {
      newErrors.weight = '体重必须在30-200kg之间';
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = '备注不能超过500字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存档案
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('表单错误', '请检查输入内容');
      return;
    }

    setIsSaving(true);

    try {
      const profileData = {
        name: formData.name!,
        age: formData.age!,
        gender: formData.gender as 'male' | 'female' | 'other',
        region: formData.region!,
        height: formData.height!,
        weight: formData.weight!,
        chronicConditions: formData.chronicConditions || [],
        dietaryPreferences: formData.dietaryPreferences || [],
        notes: formData.notes || '',
      };

      if (isFirstTime) {
        await createProfile(profileData);
        Alert.alert('成功', '健康档案创建成功！', [
          { text: '确定', onPress: () => router.back() }
        ]);
      } else {
        await updateProfile(profileData);
        Alert.alert('成功', '健康档案更新成功！', [
          { text: '确定', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('保存失败:', error);
      Alert.alert('保存失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 切换慢性疾病选择
  const toggleChronicCondition = (condition: string) => {
    const current = formData.chronicConditions || [];
    const updated = current.includes(condition)
      ? current.filter(c => c !== condition)
      : [...current, condition];
    
    setFormData({ ...formData, chronicConditions: updated });
  };

  // 添加饮食偏好
  const addDietaryPreference = () => {
    const preference = dietaryPreferenceInput.trim();
    if (preference && !(formData.dietaryPreferences || []).includes(preference)) {
      setFormData({
        ...formData,
        dietaryPreferences: [...(formData.dietaryPreferences || []), preference],
      });
      setDietaryPreferenceInput('');
    }
  };

  // 移除饮食偏好
  const removeDietaryPreference = (preference: string) => {
    setFormData({
      ...formData,
      dietaryPreferences: (formData.dietaryPreferences || []).filter(p => p !== preference),
    });
  };

  // 性别选择
  const selectGender = (gender: 'male' | 'female' | 'other') => {
    setFormData({ ...formData, gender });
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: '编辑健康档案' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: isFirstTime ? '创建健康档案' : '编辑健康档案',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          
          {/* 姓名 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>姓名 *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="请输入姓名"
              maxLength={50}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* 年龄 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>年龄 *</Text>
            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              value={formData.age?.toString() || ''}
              onChangeText={(text) => setFormData({ ...formData, age: parseInt(text) || 0 })}
              placeholder="请输入年龄"
              keyboardType="numeric"
              maxLength={3}
            />
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>

          {/* 性别 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>性别 *</Text>
            <View style={styles.genderSelector}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderOption,
                    formData.gender === option.value && styles.genderOptionSelected,
                  ]}
                  onPress={() => selectGender(option.value as 'male' | 'female' | 'other')}
                >
                  <Text
                    style={[
                      styles.genderText,
                      formData.gender === option.value && styles.genderTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 居住地区 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>居住地区 *</Text>
            <TextInput
              style={[styles.input, errors.region && styles.inputError]}
              value={formData.region}
              onChangeText={(text) => setFormData({ ...formData, region: text })}
              placeholder="如：上海市静安区"
              maxLength={100}
            />
            {errors.region && <Text style={styles.errorText}>{errors.region}</Text>}
          </View>
        </View>

        {/* 身体指标 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>身体指标</Text>
          
          {/* 身高 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>身高 (cm) *</Text>
            <TextInput
              style={[styles.input, errors.height && styles.inputError]}
              value={formData.height?.toString() || ''}
              onChangeText={(text) => setFormData({ ...formData, height: parseFloat(text) || 0 })}
              placeholder="请输入身高"
              keyboardType="numeric"
            />
            {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}
          </View>

          {/* 体重 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>体重 (kg) *</Text>
            <TextInput
              style={[styles.input, errors.weight && styles.inputError]}
              value={formData.weight?.toString() || ''}
              onChangeText={(text) => setFormData({ ...formData, weight: parseFloat(text) || 0 })}
              placeholder="请输入体重"
              keyboardType="numeric"
            />
            {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
          </View>
        </View>

        {/* 健康状况 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>健康状况</Text>
          
          {/* 慢性疾病 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>慢性疾病</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowChronicModal(true)}
            >
              <Text style={styles.selectButtonText}>
                {formData.chronicConditions?.length 
                  ? `已选择 ${formData.chronicConditions.length} 项`
                  : '点击选择慢性疾病'
                }
              </Text>
            </TouchableOpacity>
            
            {/* 显示已选择的慢性疾病 */}
            {formData.chronicConditions && formData.chronicConditions.length > 0 && (
              <View style={styles.selectedItems}>
                {formData.chronicConditions.map((condition) => (
                  <View key={condition} style={styles.selectedItem}>
                    <Text style={styles.selectedItemText}>
                      {chronicConditionsOptions.find(opt => opt.value === condition)?.label || condition}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 饮食偏好 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>饮食偏好</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={dietaryPreferenceInput}
                onChangeText={setDietaryPreferenceInput}
                placeholder="如：低盐、素食、不吃辣"
                maxLength={20}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={addDietaryPreference}
                disabled={!dietaryPreferenceInput.trim()}
              >
                <Text style={styles.addButtonText}>添加</Text>
              </TouchableOpacity>
            </View>
            
            {/* 显示已添加的饮食偏好 */}
            {formData.dietaryPreferences && formData.dietaryPreferences.length > 0 && (
              <View style={styles.selectedItems}>
                {formData.dietaryPreferences.map((preference, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.selectedItem}
                    onPress={() => removeDietaryPreference(preference)}
                  >
                    <Text style={styles.selectedItemText}>{preference}</Text>
                    <Text style={styles.removeIcon}>×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 备注 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>备注</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.notes && styles.inputError]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="其他需要说明的健康信息"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
          </View>
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? '保存中...' : isFirstTime ? '创建档案' : '更新档案'}
          </Text>
        </TouchableOpacity>

        {/* 慢性疾病选择模态框 */}
        <Modal
          visible={showChronicModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择慢性疾病</Text>
              <TouchableOpacity
                onPress={() => setShowChronicModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>完成</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {chronicConditionsOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    formData.chronicConditions?.includes(option.value) && styles.optionItemSelected
                  ]}
                  onPress={() => toggleChronicCondition(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    formData.chronicConditions?.includes(option.value) && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {formData.chronicConditions?.includes(option.value) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 4,
  },
  genderSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  genderOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  genderText: {
    fontSize: 16,
    color: '#666',
  },
  genderTextSelected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  selectButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#666',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectedItem: {
    backgroundColor: '#e8f5e8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedItemText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  removeIcon: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalCloseText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  optionItemSelected: {
    backgroundColor: '#e8f5e8',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  checkmark: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 