import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Switch, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { mealRecordsAPI, CreateMealRecordRequest } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

// 图片压缩配置
const IMAGE_COMPRESSION_CONFIG = {
  maxWidth: 1200,      // 最大宽度
  maxHeight: 1200,     // 最大高度
  quality: 0.8,        // 压缩质量
  maxSizeKB: 500,      // 最大文件大小(KB)
};

export default function CreatePostScreen() {
  const { token } = useAuth();
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [shareWithNutritionist, setShareWithNutritionist] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // 压缩图片函数
  const compressImage = useCallback(async (uri: string): Promise<string> => {
    try {
      // 获取图片信息
      const imageInfo = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );

      // 计算压缩尺寸
      const { width: originalWidth, height: originalHeight } = imageInfo;
      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      // 如果图片过大，按比例缩放
      if (originalWidth > IMAGE_COMPRESSION_CONFIG.maxWidth || originalHeight > IMAGE_COMPRESSION_CONFIG.maxHeight) {
        const widthRatio = IMAGE_COMPRESSION_CONFIG.maxWidth / originalWidth;
        const heightRatio = IMAGE_COMPRESSION_CONFIG.maxHeight / originalHeight;
        const ratio = Math.min(widthRatio, heightRatio);

        targetWidth = Math.round(originalWidth * ratio);
        targetHeight = Math.round(originalHeight * ratio);
      }

      // 压缩图片
      const compressedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: targetWidth,
              height: targetHeight,
            },
          },
        ],
        {
          compress: IMAGE_COMPRESSION_CONFIG.quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      console.log(`图片压缩完成: ${originalWidth}x${originalHeight} -> ${targetWidth}x${targetHeight}`);
      return compressedImage.uri;
    } catch (error) {
      console.error('图片压缩失败:', error);
      // 如果压缩失败，返回原图
      return uri;
    }
  }, []);

  // 选择图片
  const pickImages = useCallback(async () => {
    if (isCompressing) return; // 防止重复操作

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        setIsCompressing(true);

        try {
          // 压缩所有选中的图片
          const compressedImages = await Promise.all(
            result.assets.map(async (asset, index) => {
              console.log(`压缩图片 ${index + 1}/${result.assets.length}`);
              return await compressImage(asset.uri);
            })
          );

          setImages(prev => [...prev, ...compressedImages].slice(0, 9)); // 最多9张图片
        } finally {
          setIsCompressing(false);
        }
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败，请重试');
      setIsCompressing(false);
    }
  }, [compressImage, isCompressing]);

  // 拍照
  const takePhoto = useCallback(async () => {
    if (isCompressing) return; // 防止重复操作

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        setIsCompressing(true);

        try {
          // 压缩拍摄的图片
          const compressedImage = await compressImage(result.assets[0].uri);
          setImages(prev => [...prev, compressedImage].slice(0, 9)); // 最多9张图片
        } finally {
          setIsCompressing(false);
        }
      }
    } catch (error) {
      console.error('拍照失败:', error);
      Alert.alert('错误', '拍照失败，请重试');
      setIsCompressing(false);
    }
  }, [compressImage, isCompressing]);

  // 验证文件大小
  const validateFileSize = useCallback(async (uri: string): Promise<boolean> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const sizeInKB = blob.size / 1024;

      if (sizeInKB > IMAGE_COMPRESSION_CONFIG.maxSizeKB) {
        Alert.alert(
          '文件过大',
          `图片大小为 ${Math.round(sizeInKB)}KB，超过限制 ${IMAGE_COMPRESSION_CONFIG.maxSizeKB}KB。请选择较小的图片或等待压缩完成。`
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('验证文件大小失败:', error);
      return true; // 验证失败时允许继续
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

    if (images.length === 0) {
      Alert.alert('提示', '请选择至少一张图片');
      return;
    }

    setIsSubmitting(true);

    try {
      // 验证所有图片大小
      console.log('开始验证图片大小...');
      for (let i = 0; i < images.length; i++) {
        const isValid = await validateFileSize(images[i]);
        if (!isValid) {
          setIsSubmitting(false);
          return;
        }
      }

      console.log('图片大小验证通过，开始上传...');

      const requestData: CreateMealRecordRequest = {
        caption: caption.trim(),
        visibility: isPrivate ? 'PRIVATE' : 'FAMILY',
        shareWithNutritionist,
      };

      // 直接传递URI数组，不再转换为File对象
      const response = await mealRecordsAPI.createMealRecord(requestData, images, token);

      if (response.success) {
        const successMessage = shareWithNutritionist
          ? '分享发布成功！营养师正在为您生成评论，请稍后查看分享墙'
          : '分享发布成功！';

        Alert.alert('成功', successMessage, [
          {
            text: '确定',
            onPress: () => router.back(),
          },
        ]);
      } else {
        throw new Error(response.message || '发布失败');
      }
    } catch (error: any) {
      console.error('发布分享失败:', error);

      // 根据错误类型提供更具体的错误信息
      let errorMessage = '发布失败，请重试';
      if (error.message?.includes('文件过大') || error.message?.includes('file size')) {
        errorMessage = '图片文件过大，请选择较小的图片或等待压缩完成';
      } else if (error.message?.includes('网络') || error.message?.includes('network')) {
        errorMessage = '网络连接失败，请检查网络后重试';
      } else if (error.message?.includes('格式') || error.message?.includes('format')) {
        errorMessage = '图片格式不支持，请选择JPG、PNG格式的图片';
      }

      Alert.alert('错误', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [token, caption, images, isPrivate, shareWithNutritionist, validateFileSize]);

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
            <TouchableOpacity
              style={[styles.actionButton, isCompressing && styles.actionButtonDisabled]}
              onPress={takePhoto}
              disabled={isCompressing}
            >
              {isCompressing ? (
                <ActivityIndicator size="small" color="#007bff" />
              ) : (
                <Ionicons name="camera" size={20} color="#007bff" />
              )}
              <Text style={styles.actionButtonText}>
                {isCompressing ? '处理中...' : '拍照'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, isCompressing && styles.actionButtonDisabled]}
              onPress={pickImages}
              disabled={isCompressing}
            >
              {isCompressing ? (
                <ActivityIndicator size="small" color="#007bff" />
              ) : (
                <Ionicons name="images" size={20} color="#007bff" />
              )}
              <Text style={styles.actionButtonText}>
                {isCompressing ? '处理中...' : '从相册选择'}
              </Text>
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
            maxLength={100}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{caption.length}/100</Text>
        </View>

        {/* 隐私设置 */}
        <View style={styles.privacySection}>
          <View style={styles.privacyRow}>
            <View style={styles.privacyContent}>
              <View style={styles.privacyLabelRow}>
                <Ionicons
                  name={isPrivate ? "lock-closed" : "people"}
                  size={16}
                  color={isPrivate ? "#ff9500" : "#34c759"}
                />
                <Text style={styles.privacyLabel}>
                  {isPrivate ? '仅自己可见' : '家庭可见'}
                </Text>
              </View>
              <Text style={styles.privacyHint}>
                {isPrivate
                  ? '只有你能看到这条分享，家人不会收到提醒'
                  : '发布时，家人可收到消息提醒'
                }
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#34c759', true: '#ff9500' }}
              thumbColor="#fff"
              ios_backgroundColor="#e0e0e0"
            />
          </View>
        </View>

        {/* 营养师评论设置 */}
        <View style={styles.nutritionistSection}>
          <View style={styles.nutritionistRow}>
            <View style={styles.nutritionistContent}>
              <View style={styles.nutritionistLabelRow}>
                <Ionicons
                  name="medical"
                  size={16}
                  color="#28a745"
                />
                <Text style={styles.nutritionistLabel}>
                  分享给营养师
                </Text>
              </View>
              <Text style={styles.nutritionistHint}>
                {shareWithNutritionist
                  ? 'AI营养师将为您的饮食提供专业评价（约需10秒）'
                  : '开启后，AI营养师会分析您的饮食并给出建议'
                }
              </Text>
            </View>
            <Switch
              value={shareWithNutritionist}
              onValueChange={setShareWithNutritionist}
              trackColor={{ false: '#e0e0e0', true: '#28a745' }}
              thumbColor="#fff"
              ios_backgroundColor="#e0e0e0"
            />
          </View>
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
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
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  textSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#fafafa',
    color: '#333',
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
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  privacyContent: {
    flex: 1,
    marginRight: 12,
  },
  privacyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 6,
  },
  privacyHint: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 18,
  },
  nutritionistSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nutritionistRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  nutritionistContent: {
    flex: 1,
    marginRight: 12,
  },
  nutritionistLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nutritionistLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 6,
  },
  nutritionistHint: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 18,
  },
  publishButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    marginTop: 24,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  publishButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
}); 