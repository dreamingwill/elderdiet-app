import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

type RecordMethod = '拍照记录' | '按推荐吃的' | '自定义记录';

export default function MealRecordScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [recordMethod, setRecordMethod] = useState<RecordMethod | null>(null);

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('需要相机权限', '请在设置中允许访问相机');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setRecordMethod('拍照记录');
    }
  };

  const RecordMethodButton = ({ method, icon }: { method: RecordMethod, icon: string }) => (
    <TouchableOpacity
      style={[
        styles.methodButton,
        recordMethod === method && styles.methodButtonActive
      ]}
      onPress={() => setRecordMethod(method)}
    >
      <Ionicons name={icon as any} size={24} color={recordMethod === method ? 'white' : '#666'} />
      <Text style={[
        styles.methodButtonText,
        recordMethod === method && styles.methodButtonTextActive
      ]}>
        {method}
      </Text>
    </TouchableOpacity>
  );

  const handleSubmit = () => {
    if (!recordMethod) {
      Alert.alert('请选择记录方式');
      return;
    }

    // 这里后续添加提交逻辑
    Alert.alert('记录成功', '您的饮食记录已保存');
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>记录饮食</Text>
        <Text style={styles.subtitle}>选择记录方式</Text>

        <View style={styles.methodButtons}>
          <RecordMethodButton method="拍照记录" icon="camera-outline" />
          <RecordMethodButton method="按推荐吃的" icon="checkmark-circle-outline" />
          <RecordMethodButton method="自定义记录" icon="create-outline" />
        </View>

        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          </View>
        )}

        {recordMethod === '拍照记录' && !selectedImage && (
          <TouchableOpacity style={styles.cameraButton} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={32} color="white" />
            <Text style={styles.cameraButtonText}>拍照</Text>
          </TouchableOpacity>
        )}

        {recordMethod === '按推荐吃的' && (
          <View style={styles.recommendedMeals}>
            <Text style={styles.sectionTitle}>今日推荐餐单</Text>
            {/* 这里后续添加推荐餐单列表 */}
          </View>
        )}

        {recordMethod === '自定义记录' && (
          <View style={styles.customRecord}>
            <Text style={styles.sectionTitle}>常见食物</Text>
            {/* 这里后续添加常见食物选择 */}
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.submitButton,
            (!recordMethod || (recordMethod === '拍照记录' && !selectedImage)) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!recordMethod || (recordMethod === '拍照记录' && !selectedImage)}
        >
          <Text style={styles.submitButtonText}>保存记录</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  methodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  methodButton: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  methodButtonActive: {
    backgroundColor: '#4CAF50',
  },
  methodButtonText: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
  methodButtonTextActive: {
    color: 'white',
  },
  imagePreviewContainer: {
    marginVertical: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 16,
    marginTop: 5,
  },
  recommendedMeals: {
    marginVertical: 20,
  },
  customRecord: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 30,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 