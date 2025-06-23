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
  Dimensions
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
              <Ionicons name="mic" size={20} color={isAI ? "#4CAF50" : "#fff"} />
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

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>营养师交流</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearChat}>
          <Ionicons name="trash-outline" size={24} color="#999" />
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
      />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.loadingText}>正在思考...</Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        {isRecording ? (
          <View style={styles.recordingContainer}>
            <RNView style={styles.recordingIndicator}>
              <RNView style={styles.recordingDot} />
              <Text style={styles.recordingText}>录音中 {recordingDuration}s</Text>
            </RNView>
            <TouchableOpacity 
              style={styles.recordingStopButton}
              onPress={stopRecording}
            >
              <Ionicons name="stop" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="请输入您的问题..."
              placeholderTextColor="#999"
              multiline
            />
            <View style={styles.inputButtons}>
              <TouchableOpacity style={styles.inputButton} onPress={pickImage}>
                <Ionicons name="image" size={24} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.inputButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.inputButton}
                onPress={startRecording}
              >
                <Ionicons name="mic" size={24} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sendButton, !inputText.trim() && styles.disabledButton]} 
                onPress={sendTextMessage}
                disabled={!inputText.trim()}
              >
                <Ionicons name="send" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageContent: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 20,
    position: 'relative',
  },
  aiMessageContent: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userMessageContent: {
    backgroundColor: '#4CAF50',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  aiMessageText: {
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    minWidth: 100,
  },
  audioWave: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    height: 20,
  },
  audioWaveBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 3,
  },
  aiAudioWaveBar: {
    backgroundColor: '#4CAF50',
  },
  userAudioWaveBar: {
    backgroundColor: '#fff',
  },
  audioDuration: {
    fontSize: 12,
    marginLeft: 5,
  },
  aiAudioDuration: {
    color: '#666',
  },
  userAudioDuration: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    position: 'absolute',
    bottom: 5,
    right: 12,
  },
  aiTimestamp: {
    color: '#999',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#333',
    margin: 8,
  },
  inputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  inputButton: {
    padding: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#a5d6a7',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    color: '#333',
  },
  recordingStopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 