import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Switch, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { mealRecordsAPI, CreateMealRecordRequest } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

export default function CreatePostScreen() {
  const { token } = useAuth();
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 选择图片
  const pickImages = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages(prev => [...prev, ...newImages].slice(0, 9)); // 最多9张图片
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败，请重试');
    }
  }, []);

  // 拍照
  const takePhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const newImage = result.assets[0].uri;
        setImages(prev => [...prev, newImage].slice(0, 9)); // 最多9张图片
      }
    } catch (error) {
      console.error('拍照失败:', error);
      Alert.alert('错误', '拍照失败，请重试');
    }
  }, []);

  // 删除图片
  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 发布分享
  const handleSubmit = useCallback(async () => {
    if (!token) {
      Alert.alert('错误', '请先登录');
      return;
    }

    // 移除caption校验，允许空内容
    // if (!caption.trim()) {
    //   Alert.alert('提示', '请输入分享内容');
    //   return;
    // }

    if (images.length === 0) {
      Alert.alert('提示', '请选择至少一张图片');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData: CreateMealRecordRequest = {
        caption: caption.trim(),
        visibility: isPrivate ? 'PRIVATE' : 'FAMILY',
      };

      // 直接传递URI数组，不再转换为File对象
      const response = await mealRecordsAPI.createMealRecord(requestData, images, token);

      if (response.success) {
        Alert.alert('成功', '分享发布成功！', [
          {
            text: '确定',
            onPress: () => router.back(),
          },
        ]);
      } else {
        throw new Error(response.message || '发布失败');
      }
    } catch (error) {
      console.error('发布分享失败:', error);
      Alert.alert('错误', '发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [token, caption, images, isPrivate]);

  return (
    <>
      <Stack.Screen 
        options={{
          title: '记录温暖时刻',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitButton}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>发布</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 图片选择区域 */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>选择图片</Text>
          <View style={styles.imageGrid}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
            
            {images.length < 9 && (
              <TouchableOpacity 
                style={styles.addImageButton}
                onPress={pickImages}
              >
                <Ionicons name="add" size={32} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* 图片操作按钮 */}
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
              <Ionicons name="camera" size={20} color="#007bff" />
              <Text style={styles.actionButtonText}>拍照</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={pickImages}>
              <Ionicons name="images" size={20} color="#007bff" />
              <Text style={styles.actionButtonText}>从相册选择</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 文字输入区域 */}
        <View style={styles.textSection}>
          <Text style={styles.sectionTitle}>分享内容</Text>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="今天吃了什么好吃的？分享一下心情吧..."
            value={caption}
            onChangeText={setCaption}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{caption.length}/500</Text>
        </View>

        {/* 隐私设置 */}
        <View style={styles.privacySection}>
          <View style={styles.privacyHeader}>
            <Text style={styles.sectionTitle}>隐私设置</Text>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isPrivate ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.privacyDescription}>
            {isPrivate 
              ? '仅自己可见：只有你能看到这条分享' 
              : '家庭可见：家庭成员都能看到这条分享'
            }
          </Text>
        </View>

        {/* 发布按钮 */}
        <TouchableOpacity 
          style={[styles.publishButton, isSubmitting && styles.publishButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.publishButtonText}>发布分享</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageItem: {
    position: 'relative',
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  addImageButton: {
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  textSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#fff',
  },
  charCount: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 12,
    color: '#6c757d',
  },
  privacySection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  privacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  privacyDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  publishButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  publishButtonDisabled: {
    backgroundColor: '#ccc',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 