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
  StatusBar
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

// 消息类型定义
interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'audio';
  sender: 'user' | 'ai';
  timestamp: number;
  imageUri?: string;
  audioDuration?: number;
}

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
  const flatListRef = useRef<FlatList<Message>>(null);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 从存储加载历史消息
  useEffect(() => {
    loadMessages();
    requestPermissions();
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []);

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
  const loadMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('@chat_messages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        // 添加欢迎消息
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          content: "您好！我是您的专属营养师小助手。请问您今天想了解什么饮食健康问题呢？",
          type: 'text',
          sender: 'ai',
          timestamp: Date.now()
        };
        setMessages([welcomeMessage]);
        await AsyncStorage.setItem('@chat_messages', JSON.stringify([welcomeMessage]));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // 保存消息到存储
  const saveMessages = async (newMessages: Message[]) => {
    try {
      await AsyncStorage.setItem('@chat_messages', JSON.stringify(newMessages));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  };

  // 发送文本消息
  const sendTextMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      type: 'text',
      sender: 'user',
      timestamp: Date.now()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    saveMessages(updatedMessages);
    
    // 模拟AI回复
    setIsLoading(true);
    setTimeout(() => {
      let aiResponse = "我想了解一下，您可以吃小米粥吗？";
      
      // 如果用户问了关于小米粥的问题，给出相应回答
      if (inputText.toLowerCase().includes('小米') || inputText.toLowerCase().includes('粥')) {
        aiResponse = AI_RESPONSES[5];
      } else {
        // 随机选择一个回复
        aiResponse = AI_RESPONSES[Math.floor(Math.random() * 5)];
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        type: 'text',
        sender: 'ai',
        timestamp: Date.now()
      };
      
      const newMessages = [...updatedMessages, aiMessage];
      setMessages(newMessages);
      saveMessages(newMessages);
      setIsLoading(false);
    }, 1000);
  };

  // 选择图片
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      sendImageMessage(imageUri);
    }
  };

  // 拍照
  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      sendImageMessage(imageUri);
    }
  };

  // 发送图片消息
  const sendImageMessage = async (imageUri: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: '图片消息',
      type: 'image',
      sender: 'user',
      timestamp: Date.now(),
      imageUri
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    
    // 模拟AI回复
    setIsLoading(true);
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "我看到您发送了一张图片。请问这是您想了解的食物吗？",
        type: 'text',
        sender: 'ai',
        timestamp: Date.now()
      };
      
      const newMessages = [...updatedMessages, aiMessage];
      setMessages(newMessages);
      saveMessages(newMessages);
      setIsLoading(false);
    }, 1000);
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
    saveMessages(updatedMessages);
    
    // 模拟AI回复
    setIsLoading(true);
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "我收到了您的语音消息。请问您想了解什么饮食健康问题呢？",
        type: 'text',
        sender: 'ai',
        timestamp: Date.now()
      };
      
      const newMessages = [...updatedMessages, aiMessage];
      setMessages(newMessages);
      saveMessages(newMessages);
      setIsLoading(false);
    }, 1000);
  };

  // 清空聊天记录
  const clearChat = async () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: "您好！我是您的专属营养师小助手。请问您今天想了解什么饮食健康问题呢？",
      type: 'text',
      sender: 'ai',
      timestamp: Date.now()
    };
    
    setMessages([welcomeMessage]);
    await AsyncStorage.setItem('@chat_messages', JSON.stringify([welcomeMessage]));
  };

  // 渲染消息气泡
  const renderMessage = ({ item }: { item: Message }) => {
    const isAI = item.sender === 'ai';
    
    return (
      <View style={[
        styles.messageBubble,
        isAI ? styles.aiMessage : styles.userMessage,
      ]}>
        {/* AI头像 */}
        {isAI && (
          <View style={styles.avatarContainer}>
            <View style={styles.aiAvatar}>
              <Ionicons name="medical" size={20} color="#fff" />
            </View>
          </View>
        )}
        
        <View style={[
          styles.messageContent,
          isAI ? styles.aiMessageContent : styles.userMessageContent
        ]}>
          {item.type === 'text' && (
            <Text style={[
              styles.messageText,
              isAI ? styles.aiMessageText : styles.userMessageText
            ]}>
              {item.content}
            </Text>
          )}
          
          {item.type === 'image' && item.imageUri && (
            <Image 
              source={{ uri: item.imageUri }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}
          
          {item.type === 'audio' && (
            <RNView style={styles.audioContainer}>
              <Ionicons name="mic" size={20} color={isAI ? "#28a745" : "#fff"} />
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
        
        {/* 用户头像 */}
        {!isAI && (
          <View style={styles.avatarContainer}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
        contentContainerStyle={styles.messagesContainer}
        ref={flatListRef}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
                    <TouchableOpacity style={styles.optionButton} onPress={startRecording}>
                      <Ionicons name="mic" size={20} color="#fff" />
                      <Text style={styles.optionText}>语音</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="请输入您的健康饮食问题..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
                onFocus={() => setShowInputOptions(false)}
              />
              <TouchableOpacity 
                style={[styles.sendButton, !inputText.trim() && styles.disabledButton]} 
                onPress={sendTextMessage}
                disabled={!inputText.trim()}
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
    backgroundColor: '#f8fffe',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'linear-gradient(180deg, #f8fffe 0%, #f0f9f4 100%)',
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
    backgroundColor: '#fff',
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
    paddingBottom: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 22,
    position: 'relative',
    maxWidth: width * 0.7,
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
    backgroundColor: '#007bff',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  aiMessageText: {
    color: '#2d3748',
  },
  userMessageText: {
    color: '#ffffff',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
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
    backgroundColor: '#ffffff',
  },
  audioDuration: {
    fontSize: 12,
    marginLeft: 8,
  },
  aiAudioDuration: {
    color: '#718096',
  },
  userAudioDuration: {
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 10,
    position: 'absolute',
    bottom: 6,
    right: 12,
  },
  aiTimestamp: {
    color: '#a0aec0',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
}); 