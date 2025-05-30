import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const STORAGE_KEY = '@health_profile';

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

export default function EditProfileScreen() {
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

  const healthConditionOptions = ['高血压', '糖尿病', '骨质疏松', '心脏病', '关节炎', '高血脂'];
  const dietaryOptions = ['爱吃辣', '海鲜过敏', '素食主义', '低盐饮食', '低糖饮食'];
  const activityOptions = ['久坐', '轻度活动', '中度活动', '高强度活动'];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        console.log('Loaded profile from storage:', parsedProfile);
        
        // Convert old object format to new array format for healthConditions
        let healthConditions = ['高血压', '糖尿病', '骨质疏松'];
        if (parsedProfile.healthConditions) {
          if (Array.isArray(parsedProfile.healthConditions)) {
            healthConditions = parsedProfile.healthConditions;
          } else if (typeof parsedProfile.healthConditions === 'object') {
            // Convert object format to array format
            const conditionMap: { [key: string]: string } = {
              'hypertension': '高血压',
              'diabetes': '糖尿病',
              'osteoporosis': '骨质疏松',
              'heartDisease': '心脏病',
              'arthritis': '关节炎',
              'highCholesterol': '高血脂'
            };
            healthConditions = Object.entries(parsedProfile.healthConditions)
              .filter(([key, value]) => value === true)
              .map(([key]) => conditionMap[key] || key)
              .filter(condition => condition);
          }
        }
        
        // Convert old object format to new array format for dietaryPreferences
        let dietaryPreferences = ['爱吃辣', '海鲜过敏'];
        if (parsedProfile.dietaryPreferences) {
          if (Array.isArray(parsedProfile.dietaryPreferences)) {
            dietaryPreferences = parsedProfile.dietaryPreferences;
          } else if (parsedProfile.dietaryRestrictions && typeof parsedProfile.dietaryRestrictions === 'object') {
            // Convert dietary restrictions object to preferences array
            const restrictionMap: { [key: string]: string } = {
              'lowSalt': '低盐饮食',
              'lowSugar': '低糖饮食',
              'lowFat': '低脂饮食',
              'vegetarian': '素食主义',
              'dairyFree': '无乳制品'
            };
            dietaryPreferences = Object.entries(parsedProfile.dietaryRestrictions)
              .filter(([key, value]) => value === true)
              .map(([key]) => restrictionMap[key] || key)
              .filter(preference => preference);
            
            // Add default preferences if none found
            if (dietaryPreferences.length === 0) {
              dietaryPreferences = ['爱吃辣', '海鲜过敏'];
            }
          }
        }
        
        setProfile({
          name: parsedProfile.name || 'XXX',
          age: parsedProfile.age || '60',
          gender: parsedProfile.gender === '男' ? '男性' : (parsedProfile.gender === '女' ? '女性' : parsedProfile.gender || '男性'),
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

  const saveProfile = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      Alert.alert('成功', '健康档案已保存');
      router.back();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('错误', '保存失败，请重试');
    }
  };

  const toggleHealthCondition = (condition: string) => {
    setProfile(prev => {
      const healthConditions = Array.isArray(prev.healthConditions) ? prev.healthConditions : [];
      return {
        ...prev,
        healthConditions: healthConditions.includes(condition)
          ? healthConditions.filter(c => c !== condition)
          : [...healthConditions, condition]
      };
    });
  };

  const toggleDietaryPreference = (preference: string) => {
    setProfile(prev => {
      const dietaryPreferences = Array.isArray(prev.dietaryPreferences) ? prev.dietaryPreferences : [];
      return {
        ...prev,
        dietaryPreferences: dietaryPreferences.includes(preference)
          ? dietaryPreferences.filter(p => p !== preference)
          : [...dietaryPreferences, preference]
      };
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>编辑健康档案</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>姓名</Text>
          <TextInput
            style={styles.input}
            value={profile.name}
            onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
            placeholder="请输入您的姓名"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>年龄</Text>
          <TextInput
            style={styles.input}
            value={profile.age}
            onChangeText={(text) => setProfile(prev => ({ ...prev, age: text }))}
            keyboardType="numeric"
            placeholder="请输入您的年龄"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>性别</Text>
          <View style={styles.genderButtons}>
            <TouchableOpacity
              style={[styles.genderButton, profile.gender === '男性' && styles.genderButtonActive]}
              onPress={() => setProfile(prev => ({ ...prev, gender: '男性' }))}
            >
              <Text style={[styles.genderButtonText, profile.gender === '男性' && styles.genderButtonTextActive]}>男性</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, profile.gender === '女性' && styles.genderButtonActive]}
              onPress={() => setProfile(prev => ({ ...prev, gender: '女性' }))}
            >
              <Text style={[styles.genderButtonText, profile.gender === '女性' && styles.genderButtonTextActive]}>女性</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>地区</Text>
          <TextInput
            style={styles.input}
            value={profile.location}
            onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
            placeholder="请输入您的地区"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>身高 (cm)</Text>
          <TextInput
            style={styles.input}
            value={profile.height}
            onChangeText={(text) => setProfile(prev => ({ ...prev, height: text }))}
            keyboardType="numeric"
            placeholder="请输入您的身高"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>体重 (kg)</Text>
          <TextInput
            style={styles.input}
            value={profile.weight}
            onChangeText={(text) => setProfile(prev => ({ ...prev, weight: text }))}
            keyboardType="numeric"
            placeholder="请输入您的体重"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>健康状况（可多选）</Text>
          <View style={styles.optionsContainer}>
            {healthConditionOptions.map((condition, index) => {
              const healthConditions = Array.isArray(profile.healthConditions) ? profile.healthConditions : [];
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    healthConditions.includes(condition) && styles.optionButtonActive
                  ]}
                  onPress={() => toggleHealthCondition(condition)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    healthConditions.includes(condition) && styles.optionButtonTextActive
                  ]}>
                    {condition}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>饮食偏好（可多选）</Text>
          <View style={styles.optionsContainer}>
            {dietaryOptions.map((preference, index) => {
              const dietaryPreferences = Array.isArray(profile.dietaryPreferences) ? profile.dietaryPreferences : [];
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    dietaryPreferences.includes(preference) && styles.optionButtonActive
                  ]}
                  onPress={() => toggleDietaryPreference(preference)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    dietaryPreferences.includes(preference) && styles.optionButtonTextActive
                  ]}>
                    {preference}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>活动量</Text>
          <View style={styles.optionsContainer}>
            {activityOptions.map((activity, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  profile.activityLevel === activity && styles.optionButtonActive
                ]}
                onPress={() => setProfile(prev => ({ ...prev, activityLevel: activity }))}
              >
                <Text style={[
                  styles.optionButtonText,
                  profile.activityLevel === activity && styles.optionButtonTextActive
                ]}>
                  {activity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={saveProfile}>
          <Text style={styles.submitButtonText}>保存信息</Text>
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#333',
  },
  genderButtonTextActive: {
    color: 'white',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  optionButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  optionButtonTextActive: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 