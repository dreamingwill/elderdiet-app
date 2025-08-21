import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  FlatList,
  View as RNView,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Audio } from 'expo-av';
import { chatAPI, ChatRequest, ChatResponse } from '@/services/api';
import { authStorage } from '@/utils/authStorage';
import { useUser } from '@/contexts/UserContext';
import { useFocusEffect } from 'expo-router';
import { trackingService } from '@/services/trackingService';

const { width } = Dimensions.get('window');

// 消息类型定义
interface Message {
  id: string;
  content?: string;
  type: 'text' | 'image' | 'audio';
  sender: 'user' | 'assistant';
  timestamp: number;
  imageUrls?: string[];
  audioDuration?: number;
}

// 图片处理工具函数
const processImageToBase64 = async (imageUri: string, index: number): Promise<string> => {
  try {
    console.log(`Processing image ${index}: ${imageUri}`);
    
    // 先缩略图片
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: 240, // 最大宽度240px
            height: 180, // 最大高度180px
          },
        },
      ],
      {
        compress: 0.6, // 压缩质量
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true, // 返回base64
      }
    );
    
    if (manipulatedImage.base64) {
      const base64Result = `data:image/jpeg;base64,${manipulatedImage.base64}`;
      console.log(`Image ${index} processed successfully, base64 length: ${base64Result.length}`);
      return base64Result;
    } else {
      throw new Error('Failed to convert image to base64');
    }
  } catch (error) {
    console.error(`Error processing image ${index}:`, error);
    throw error;
  }
};

// 预设的AI回复
const AI_RESPONSES = [
  "您好！我是您的专属营养师小助手。请问您今天想了解什么饮食健康问题呢？",
  "根据您的健康状况，建议增加富含膳食纤维的食物，如全谷物、豆类和新鲜蔬菜。",
  "适当减少盐分摄入可以帮助控制血压。建议每日盐摄入量控制在5克以内。",
  "多吃新鲜水果和蔬菜可以提供丰富的维生素和抗氧化物质，有助于增强免疫力。",
  "对于老年人来说，每天摄入足够的蛋白质非常重要，可以选择瘦肉、鱼、豆制品和鸡蛋等。",
  "小米粥确实可以吃，它易于消化且富含营养，非常适合老年人食用。"
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showInputOptions, setShowInputOptions] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const flatListRef = useRef<FlatList<Message>>(null);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { uid, isAuthenticated } = useUser();

  // 获取用户专属的存储key
  const getChatStorageKey = (userId: string) => `@chat_messages_${userId}`;

  // 从存储加载历史消息
  useEffect(() => {
    if (isAuthenticated && uid) {
      // 如果用户ID发生变化，清理之前的数据并重新加载
      if (currentUserId !== uid) {
        setCurrentUserId(uid);
        setMessages([]); // 清空当前显示的消息
        loadMessages(uid);
      }
    } else {
      // 用户未登录，清空所有数据
      setMessages([]);
      setCurrentUserId(null);
    }
    
    requestPermissions();
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [uid, isAuthenticated]);

  // 页面访问追踪
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔥 Chat useFocusEffect触发');
      try {
        console.log('🔥 开始chat页面访问追踪...');
        trackingService.startPageVisit('chat', '聊天交流', '/(tabs)/chat');
        console.log('✅ chat页面访问追踪调用完成');
      } catch (error) {
        console.error('❌ chat页面访问追踪失败:', error);
      }
      
      return () => {
        console.log('🔥 Chat页面离开，结束访问追踪');
        try {
          trackingService.endPageVisit('navigation');
        } catch (error) {
          console.error('❌ 结束chat页面访问追踪失败:', error);
        }
      };
    }, [])
  );

  // 滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // 请求权限
  const requestPermissions = async () => {
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    await ImagePicker.requestCameraPermissionsAsync();
    await Audio.requestPermissionsAsync();
  };

  // 加载历史消息
  const loadMessages = async (userId: string) => {
    try {
      const token = await authStorage.getItem('userToken');
      if (!token) {
        console.warn('No token found, cannot load chat history');
        await loadWelcomeMessage(userId);
        return;
      }

      // 优先从后端获取聊天历史
      try {
        const response = await chatAPI.getChatHistory(token);
        if (response.success && response.data && response.data.length > 0) {
          // 转换后端消息格式为前端格式
          const convertedMessages = response.data.map(msg => ({
            id: msg.id,
            content: msg.content,
            type: msg.type as 'text' | 'image' | 'audio',
            sender: msg.role === 'user' ? 'user' : 'assistant' as 'user' | 'assistant',
            timestamp: msg.timestamp,
            imageUrls: msg.imageUrls || (msg as any).image_urls
          }));
          
          setMessages(convertedMessages);
          await saveMessagesToLocal(convertedMessages, userId);
          return;
        }
      } catch (error) {
        console.warn('Failed to load chat history from backend:', error);
      }

      // 如果后端获取失败，尝试从本地加载
      const storageKey = getChatStorageKey(userId);
      const savedMessages = await AsyncStorage.getItem(storageKey);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      } else {
        // 如果本地也没有，显示欢迎消息
        await loadWelcomeMessage(userId);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      await loadWelcomeMessage(userId);
    }
  };

  // 加载欢迎消息
  const loadWelcomeMessage = async (userId: string) => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: "您好！我是您的专属营养师小助手。请问您今天想了解什么饮食健康问题呢？",
      type: 'text',
      sender: 'assistant',
      timestamp: Date.now()
    };
    
    setMessages([welcomeMessage]);
    await saveMessagesToLocal([welcomeMessage], userId);
  };

  // 保存消息到本地存储
  const saveMessagesToLocal = async (newMessages: Message[], userId: string) => {
    try {
      const storageKey = getChatStorageKey(userId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(newMessages));
    } catch (error) {
      console.error('Failed to save messages to local storage:', error);
    }
  };

  // 发送文本消息
  const sendTextMessage = async () => {
    if (!inputText.trim() && pendingImages.length === 0) return;
    
    if (!isAuthenticated || !uid) {
      Alert.alert('错误', '请先登录');
      return;
    }
    
    // 确定消息类型和内容
    const messageType = pendingImages.length > 0 ? 'image' : 'text';
    const messageContent = inputText.trim() || (pendingImages.length > 0 ? `发送了${pendingImages.length}张图片` : '');
    
    // 清空输入和暂存的图片
    setInputText('');
    const currentPendingImages = [...pendingImages];
    setPendingImages([]);
    
    // 调用真实API
    setIsLoading(true);
    try {
      const token = await authStorage.getItem('userToken');
      if (!token) {
        Alert.alert('错误', '请先登录');
        setIsLoading(false);
        return;
      }
      
      // 如果有图片，需要先转换为base64
      let processedImageUrls: string[] = [];
      if (currentPendingImages.length > 0) {
        try {
          console.log('Processing images:', currentPendingImages);
          processedImageUrls = await Promise.all(
            currentPendingImages.map((imageUri, index) => processImageToBase64(imageUri, index))
          );
          console.log('All images processed:', processedImageUrls.map(url => ({ length: url.length, preview: url.substring(0, 50) + '...' })));
        } catch (error) {
          console.error('图片处理失败:', error);
          Alert.alert('错误', '图片处理失败，请重试');
          setIsLoading(false);
          return;
        }
      }
      
      // 创建用户消息（使用处理后的图片）
      const userMessage: Message = {
        id: Date.now().toString(),
        content: messageContent,
        type: messageType,
        sender: 'user',
        timestamp: Date.now(),
        ...(processedImageUrls.length > 0 && { imageUrls: processedImageUrls })
      };
      
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      await saveMessagesToLocal(updatedMessages, uid);
      
      const chatRequest: ChatRequest = {
        type: messageType,
        content: messageContent,
        ...(processedImageUrls.length > 0 && { image_urls: processedImageUrls })
      };
      
      console.log('Sending message:', { 
        type: chatRequest.type, 
        content: chatRequest.content,
        image_urls_count: chatRequest.image_urls?.length,
        image_previews: chatRequest.image_urls?.map((url, i) => `Image ${i + 1}: ${url.substring(0, 50)}...`)
      });
      
      const response = await chatAPI.sendMessage(chatRequest, token);
      
      if (response.success && response.data) {
        const aiMessage: Message = {
          id: response.data.messageId,
          content: response.data.response,
          type: 'text',
          sender: 'assistant',
          timestamp: response.data.timestamp
        };
        
        const newMessages = [...updatedMessages, aiMessage];
        setMessages(newMessages);
        await saveMessagesToLocal(newMessages, uid);
        
        // 追踪发送消息成功事件
        trackingService.trackFeatureEvent('send_message', {
          messageType: messageType,
          hasImages: processedImageUrls.length > 0,
          imageCount: processedImageUrls.length,
        }, 'success');
      } else {
        Alert.alert('错误', response.message || '发送消息失败');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      Alert.alert('错误', '发送消息失败，请重试');
      
      // 追踪发送消息失败事件
      trackingService.trackFeatureEvent('send_message', {
        error: error instanceof Error ? error.message : '未知错误',
        messageType: messageType,
        hasImages: currentPendingImages.length > 0,
        imageCount: currentPendingImages.length,
      }, 'failure');
    } finally {
      setIsLoading(false);
    }
  };

  // 选择图片
  const pickImage = async () => {
    if (pendingImages.length >= 3) {
      Alert.alert('提示', '最多只能选择3张图片');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      allowsMultipleSelection: false, // 确保单选
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      console.log('Selected image:', imageUri);
      
      // 检查是否已经选择了相同的图片
      if (pendingImages.includes(imageUri)) {
        Alert.alert('提示', '该图片已经选择过了');
        return;
      }
      
      setPendingImages(prev => {
        const newImages = [...prev, imageUri];
        console.log('Updated pending images:', newImages);
        return newImages;
      });
      setShowInputOptions(false);
    }
  };

  // 拍照
  const takePhoto = async () => {
    if (pendingImages.length >= 3) {
      Alert.alert('提示', '最多只能选择3张图片');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      console.log('Captured image:', imageUri);
      
      setPendingImages(prev => {
        const newImages = [...prev, imageUri];
        console.log('Updated pending images after capture:', newImages);
        return newImages;
      });
      setShowInputOptions(false);
    }
  };



  // 开始录音
  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // 开始计时
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // 停止录音
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.stopAndUnloadAsync();
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      
      if (uri) {
        sendAudioMessage(uri, recordingDuration);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  // 发送语音消息
  const sendAudioMessage = async (audioUri: string, duration: number) => {
    if (!isAuthenticated || !uid) {
      Alert.alert('错误', '请先登录');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: '语音消息',
      type: 'audio',
      sender: 'user',
      timestamp: Date.now(),
      audioDuration: duration
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    await saveMessagesToLocal(updatedMessages, uid);
    
    // 模拟AI回复
    setIsLoading(true);
    setTimeout(async () => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "我收到了您的语音消息。请问您想了解什么饮食健康问题呢？",
        type: 'text',
        sender: 'assistant',
        timestamp: Date.now()
      };
      
      const newMessages = [...updatedMessages, aiMessage];
      setMessages(newMessages);
      await saveMessagesToLocal(newMessages, uid);
      setIsLoading(false);
    }, 1000);
  };

  // 清空聊天记录
  const clearChat = async () => {
    if (!isAuthenticated || !uid) {
      Alert.alert('错误', '请先登录');
      return;
    }

    try {
      const token = await authStorage.getItem('userToken');
      if (token) {
        // 调用后端API清空聊天记录
        await chatAPI.clearChatHistory(token);
      }
      
      // 清空本地存储
      const storageKey = getChatStorageKey(uid);
      await AsyncStorage.removeItem(storageKey);
      
      // 重新加载欢迎消息
      await loadWelcomeMessage(uid);
    } catch (error) {
      console.error('Failed to clear chat:', error);
      Alert.alert('错误', '清空聊天记录失败，请重试');
    }
  };

  // 渲染消息气泡
  const renderMessage = ({ item }: { item: Message }) => {
    const isAI = item.sender === 'assistant';
    
    return (
      <View style={[
        styles.messageBubble,
        isAI ? styles.aiMessage : styles.userMessage,
      ]}>
        {/* 移除AI和用户头像，仅保留消息内容 */}
        <View style={[
          styles.messageContent,
          isAI ? styles.aiMessageContent : styles.userMessageContent,
          item.imageUrls && item.imageUrls.length > 0 && styles.imageMessageContent
        ]}>
          {/* 显示图片（如果有） */}
          {item.imageUrls && item.imageUrls.length > 0 && (
            <View style={styles.messageImagesContainer}>
              {item.imageUrls.map((imageUri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image 
                    source={{ uri: imageUri }}
                    style={[
                      styles.messageImage,
                      item.imageUrls!.length > 1 && styles.messageImageMultiple
                    ]}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          )}
          
          {/* 显示文字内容（如果有） */}
          {item.content && item.content.trim() && (
            <Text style={[
              styles.messageText,
              isAI ? styles.aiMessageText : styles.userMessageText
            ]}>
              {item.content}
            </Text>
          )}
          
          {item.type === 'audio' && (
            <RNView style={styles.audioContainer}>
              <Ionicons name="mic" size={20} color="#28a745" />
              <RNView style={styles.audioWave}>
                {[...Array(5)].map((_, i) => (
                  <RNView 
                    key={i} 
                    style={[
                      styles.audioWaveBar,
                      { height: 5 + Math.random() * 10 },
                      isAI ? styles.aiAudioWaveBar : styles.userAudioWaveBar
                    ]} 
                  />
                ))}
              </RNView>
              <Text style={[
                styles.audioDuration,
                isAI ? styles.aiAudioDuration : styles.userAudioDuration
              ]}>
                {item.audioDuration ? `${item.audioDuration}秒` : '语音消息'}
              </Text>
            </RNView>
          )}
          
          <Text style={[
            styles.timestamp,
            isAI ? styles.aiTimestamp : styles.userTimestamp
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  // 如果用户未登录，显示登录提示
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.loginPrompt}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.loginPromptText}>请先登录以使用聊天功能</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      {/* 渐变背景 */}
      <View style={styles.backgroundGradient} />
      
      <View style={[styles.header, { paddingTop: (StatusBar.currentHeight || 44) + 16 }]}>
        <View style={styles.headerLeft}>
          {/* <View style={styles.headerIcon}>
            <Ionicons name="chatbubbles" size={24} color="#28a745" />
          </View> */}
          <Text style={styles.headerTitle}>营养师小助手</Text>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={clearChat}>
          <Ionicons name="refresh-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContainer, 
          { paddingBottom: pendingImages.length > 0 ? 20 : 20 }
        ]}
        ref={flatListRef}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color="#28a745" />
            <Text style={styles.loadingText}>营养师正在思考...</Text>
          </View>
        </View>
      )}
      
      {/* 图片预览区域 */}
      {pendingImages.length > 0 && (
        <View style={styles.imagePreviewContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.imagePreviewScroll}
          >
            {pendingImages.map((imageUri, index) => (
              <View key={index} style={styles.imagePreviewWrapper}>
                <Image 
                  source={{ uri: imageUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setPendingImages(prev => prev.filter((_, i) => i !== index))}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.imagePreviewText}>
            已选择{pendingImages.length}张图片，输入文字后一起发送 (最多3张)
          </Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        {isRecording ? (
          <View style={styles.recordingContainer}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>录音中 {recordingDuration}s</Text>
              <View style={styles.recordingWaves}>
                {[...Array(3)].map((_, i) => (
                  <View key={i} style={[styles.recordingWave, { animationDelay: `${i * 0.2}s` }]} />
                ))}
              </View>
            </View>
            <TouchableOpacity 
              style={styles.recordingStopButton}
              onPress={stopRecording}
            >
              <Ionicons name="stop" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputWrapper}>
            {/* 输入框和功能按钮在同一行 */}
            <View style={styles.inputRow}>
              {/* 功能按钮 */}
              <View style={styles.inputActions}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => setShowInputOptions(!showInputOptions)}
                >
                  <Ionicons name="add" size={24} color="#28a745" />
                </TouchableOpacity>
                
                {showInputOptions && (
                  <View style={styles.optionsContainer}>
                    <TouchableOpacity style={styles.optionButton} onPress={pickImage}>
                      <Ionicons name="images" size={20} color="#fff" />
                      <Text style={styles.optionText}>相册</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
                      <Ionicons name="camera" size={20} color="#fff" />
                      <Text style={styles.optionText}>拍照</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity style={styles.optionButton} onPress={startRecording}>
                      <Ionicons name="mic" size={20} color="#fff" />
                      <Text style={styles.optionText}>语音</Text>
                    </TouchableOpacity> */}
                  </View>
                )}
              </View>
              
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="可输入健康饮食问题..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
                onFocus={() => setShowInputOptions(false)}
              />
              <TouchableOpacity 
                style={[styles.sendButton, (!inputText.trim() && pendingImages.length === 0) && styles.disabledButton]} 
                onPress={sendTextMessage}
                disabled={!inputText.trim() && pendingImages.length === 0}
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'linear-gradient(180deg, #f8fffe 0%, #f0f9f4 100%)',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F7F8FA',
  },
  loginPromptText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F7F8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f5e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f7fafc',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 20,
    paddingTop: (StatusBar.currentHeight || 44) + 80, // 为固定header留出空间
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  messageContent: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 24,
    position: 'relative',
    maxWidth: width * 0.75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  aiMessageContent: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8f5e8',
    borderBottomLeftRadius: 4,
  },
  userMessageContent: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8f5e8',
    borderBottomRightRadius: 4,
  },
  imageMessageContent: {
    padding: 4,
    backgroundColor: 'transparent',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 4,
  },
  aiMessageText: {
    color: '#2d3748',
  },
  userMessageText: {
    color: '#2d3748',
  },
  messageImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageImage: {
    width: 140,
    height: 105,
    marginBottom: 4,
  },
  messageImageMultiple: {
    width: 80,
    height: 60,
    marginBottom: 2,
    marginRight: 4,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    minWidth: 120,
  },
  audioWave: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    height: 20,
  },
  audioWaveBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 3,
  },
  aiAudioWaveBar: {
    backgroundColor: '#28a745',
  },
  userAudioWaveBar: {
    backgroundColor: '#28a745',
  },
  audioDuration: {
    fontSize: 12,
    marginLeft: 8,
  },
  aiAudioDuration: {
    color: '#718096',
  },
  userAudioDuration: {
    color: '#2d3748',
  },
  timestamp: {
    fontSize: 10,
    position: 'absolute',
    bottom: 4,
    right: 10,
  },
  aiTimestamp: {
    color: '#a0aec0',
  },
  userTimestamp: {
    color: '#a0aec0',
  },
  loadingContainer: {
    padding: 10,
    marginTop: 10,
    backgroundColor: '#F7F8FA',
  },
  loadingBubble: {
    backgroundColor: '#F7F8FA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 60,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#718096',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e8f5e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputActions: {
    position: 'relative',
    marginRight: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    flexDirection: 'row',
    backgroundColor: '#2d3748',
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20, // 增加z-index确保在imagePreviewContainer之上
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4a5568',
    marginHorizontal: 4,
  },
  optionText: {
    color: '#ffffff',
    fontSize: 10,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    color: '#2d3748',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#a0aec0',
    shadowOpacity: 0.1,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff8f0',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff4757',
    marginRight: 12,
  },
  recordingText: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '500',
    marginRight: 12,
  },
  recordingWaves: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingWave: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#ff4757',
    marginHorizontal: 2,
  },
  recordingStopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff4757',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff4757',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePreviewContainer: {
    backgroundColor: '#F7F8FA',
    padding: 10,
    paddingBottom: 5,
  },
  imagePreviewScroll: {
    maxHeight: 100,
  },
  imagePreviewWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginRight: 12,
    marginBottom: 3,
    marginTop: 5,
  },
  previewImage: {
    width: 110,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ff4757',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 8,
    zIndex: 10,
  },
  imagePreviewText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  imageDebugText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
}); 