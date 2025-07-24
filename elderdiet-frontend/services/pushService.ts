import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStorage } from '../utils/authStorage';
import { API_BASE_URL } from '../config/api.config';
import jpushService from './jpushService';
import simplePushService from './simplePushService';

// 配置通知处理方式
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushSettings {
  pushEnabled: boolean;
  mealRecordPushEnabled: boolean;
  reminderPushEnabled: boolean;
}

export interface DeviceRegistration {
  deviceToken: string;
  platform: 'ANDROID' | 'IOS';
  deviceModel?: string;
  appVersion?: string;
  pushEnabled: boolean;
  mealRecordPushEnabled: boolean;
  reminderPushEnabled: boolean;
}

class PushService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;
  private initializationRetryCount = 0;
  private maxRetries = 3;
  private useJPush = true; // 重新启用JPush，现在Config Plugin已修复
  private jpushAvailable = false; // JPush可用性状态

  /**
   * 检查JPush是否可用
   * 在Development Build中应该可用，在Expo Go中不可用
   */
  private async checkJPushAvailability(): Promise<boolean> {
    try {
      // 尝试导入JPush模块
      const JPush = require('jpush-react-native').default;

      // 检测JPush是否真正可用
      if (JPush && typeof JPush.init === 'function') {
        try {
          // 尝试调用一个安全的方法来验证JPush是否真正可用
          JPush.setLoggerEnable(true); // 这是一个安全的测试调用
          console.log('✅ JPush SDK在Development Build中可用');
          return true;
        } catch (initError) {
          console.log('⚠️ JPush SDK存在但无法调用，可能在Expo Go中运行:', initError);
          return false;
        }
      } else {
        console.log('⚠️ JPush SDK对象为null或缺少方法');
        return false;
      }
    } catch (error) {
      console.log('⚠️ JPush SDK加载失败，可能在Expo Go中运行:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * 初始化推送服务
   * 智能检测：Development Build中使用JPush，Expo Go中降级到Expo推送
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 开始初始化推送服务...');

      if (this.useJPush) {
        // 检查JPush可用性
        this.jpushAvailable = await this.checkJPushAvailability();

        if (this.jpushAvailable) {
          // 在Development Build中使用JPush推送服务
          console.log('📱 使用JPush获取Registration ID...');
          try {
            await jpushService.initialize();
          } catch (jpushError) {
            console.log('❌ JPush初始化失败，降级到Expo推送:', jpushError);
            this.jpushAvailable = false; // 标记为不可用
            await this.fallbackToExpoPush();
          }
        } else {
          // 在Expo Go中降级到Expo推送（仅用于开发调试）
          console.log('📱 JPush不可用，降级到Expo推送（开发环境）...');
          await this.fallbackToExpoPush();
        }
      } else {
        // 直接使用Expo推送
        await this.fallbackToExpoPush();
      }

      console.log('✅ 推送服务初始化完成');
    } catch (error) {
      console.error('❌ 推送服务初始化失败:', error);
    }
  }

  /**
   * 降级到Expo推送
   */
  private async fallbackToExpoPush(): Promise<void> {
    console.log('📱 使用Expo推送服务获取Token...');
    const token = await this.registerForPushNotifications();

    if (token) {
      console.log('✅ Expo推送Token获取成功:', token.substring(0, 20) + '...');

      // 尝试注册设备到后端
      await this.registerDeviceToBackendWithRetry();
    } else {
      console.log('❌ Expo推送Token获取失败');
    }

    // 设置通知监听器
    this.setupNotificationListeners();
  }

  /**
   * 注册推送通知
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('⚠️ 推送通知只能在真实设备上使用（当前是模拟器）');
        return null;
      }

      console.log('📱 检查推送权限...');
      
      // 检查现有权限
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      console.log('📋 当前推送权限状态:', existingStatus);

      // 如果没有权限，请求权限
      if (existingStatus !== 'granted') {
        console.log('🔔 请求推送权限...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📋 推送权限请求结果:', status);
      }

      if (finalStatus !== 'granted') {
        console.log('❌ 推送通知权限被拒绝');
        return null;
      }

      // 获取推送Token
      console.log('🔑 获取Expo推送Token...');
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '36ea1d9a-f68a-4445-a8fa-c22c49972703', // 从app.json中获取
      });

      this.expoPushToken = token.data;
      console.log('✅ 推送Token获取成功:', this.expoPushToken.substring(0, 30) + '...');

      return this.expoPushToken;
    } catch (error) {
      console.error('❌ 注册推送通知失败:', error);
      return null;
    }
  }

  /**
   * 带重试机制的设备注册
   */
  async registerDeviceToBackendWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 尝试注册设备到后端 (${attempt}/${this.maxRetries})...`);
        
        const success = await this.registerDeviceToBackend();
        if (success) {
          console.log('✅ 设备注册成功');
          return;
        }
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ 等待 ${attempt * 2} 秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
      } catch (error) {
        console.error(`❌ 第 ${attempt} 次注册尝试失败:`, error);
        if (attempt === this.maxRetries) {
          throw error;
        }
      }
    }
    
    console.error('❌ 所有注册尝试都失败了');
  }

  /**
   * 注册设备到后端
   * 智能选择：优先使用JPush Registration ID，降级使用Expo Push Token
   */
  async registerDeviceToBackend(): Promise<boolean> {
    try {
      // 获取当前使用的推送Token
      let deviceToken: string | null = null;
      let tokenType = 'unknown';

      if (this.useJPush && this.jpushAvailable) {
        // 使用JPush Registration ID
        deviceToken = jpushService.getRegistrationIdSync();
        tokenType = 'jpush';
      } else {
        // 使用Expo Push Token
        deviceToken = this.expoPushToken;
        tokenType = 'expo';
      }

      if (!deviceToken) {
        console.log(`⚠️ 没有${tokenType}推送Token，跳过设备注册`);
        return false;
      }

      const authToken = await authStorage.getItem('userToken');
      if (!authToken) {
        console.log('⚠️ 用户未登录，等待登录后再注册设备');
        return false;
      }

      console.log(`📤 向后端注册设备（${tokenType}）...`);
      console.log(`🔍 使用的${tokenType}Token:`, deviceToken.substring(0, 30) + '...');

      const deviceInfo: DeviceRegistration = {
        deviceToken: deviceToken,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        deviceModel: Device.modelName || undefined,
        appVersion: '1.0.0', // 可以从app.json动态获取
        pushEnabled: true,
        mealRecordPushEnabled: true,
        reminderPushEnabled: true,
      };

      const response = await fetch(`${API_BASE_URL}/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(deviceInfo),
      });

      if (response.ok) {
        console.log(`✅ 设备注册成功（${tokenType}），后端将使用极光推送发送`);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ 设备注册失败:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ 注册设备到后端失败:', error);
      return false;
    }
  }

  /**
   * 设置通知监听器
   */
  setupNotificationListeners(): void {
    // 监听收到的通知
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('收到推送通知:', notification);
      this.handleNotificationReceived(notification);
    });

    // 监听用户点击通知的响应
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('用户点击了通知:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * 处理收到的通知
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    // 可以在这里添加自定义逻辑，比如更新应用状态
    const { data } = notification.request.content;

    if (data?.type === 'meal_record') {
      // 膳食记录通知
      console.log('收到膳食记录通知');
    } else if (data?.type === 'reminder') {
      // 提醒通知
      console.log('收到提醒通知');
    } else if (data?.type === 'comment') {
      // 评论通知
      console.log('收到评论通知');
    } else if (data?.type === 'like') {
      // 点赞通知
      console.log('收到点赞通知');
    }
  }

  /**
   * 处理用户点击通知的响应
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;

    if (data?.action === 'view_meal_record' && data?.meal_record_id) {
      // 跳转到膳食记录详情页（评论、点赞、膳食记录通知都跳转到这里）
      this.navigateToMealRecord(String(data.meal_record_id));
    } else if (data?.action === 'create_meal_record') {
      // 跳转到创建膳食记录页
      this.navigateToCreateMealRecord();
    }
  }

  /**
   * 跳转到膳食记录详情页
   */
  private navigateToMealRecord(mealRecordId: string): void {
    // 这里需要根据你的路由系统实现导航
    console.log('导航到膳食记录:', mealRecordId);
    // 例如: router.push(`/meal-record/${mealRecordId}`);
  }

  /**
   * 跳转到创建膳食记录页
   */
  private navigateToCreateMealRecord(): void {
    // 这里需要根据你的路由系统实现导航
    console.log('导航到创建膳食记录页');
    // 例如: router.push('/create-post');
  }

  /**
   * 更新推送设置
   */
  async updatePushSettings(settings: Partial<PushSettings>): Promise<boolean> {
    try {
      if (!this.expoPushToken) {
        console.log('没有推送Token，无法更新设置');
        return false;
      }

      const authToken = await authStorage.getItem('userToken');
      if (!authToken) {
        console.log('用户未登录，无法更新设置');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/devices/${this.expoPushToken}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        console.log('推送设置更新成功');
        return true;
      } else {
        console.error('推送设置更新失败:', response.status);
        return false;
      }
    } catch (error) {
      console.error('更新推送设置失败:', error);
      return false;
    }
  }

  /**
   * 用户登录后重新注册设备
   * 在用户登录成功后调用此方法
   */
  async retryDeviceRegistration(): Promise<void> {
    try {
      console.log('🔄 用户登录后重新注册设备...');

      if (this.useJPush) {
        if (this.jpushAvailable) {
          // 使用JPush推送服务
          console.log('📱 使用JPush重新注册设备...');
          await jpushService.onUserLogin();
        } else {
          // 降级到Expo推送
          console.log('📱 JPush不可用，使用Expo推送重新注册设备...');
          await this.retryExpoPushRegistration();
        }
      } else {
        // 使用Expo推送
        await this.retryExpoPushRegistration();
      }
    } catch (error) {
      console.error('❌ 重新注册设备失败:', error);
    }
  }

  /**
   * 重试Expo推送注册
   */
  private async retryExpoPushRegistration(): Promise<void> {
    if (!this.expoPushToken) {
      console.log('⚠️ 没有Expo推送Token，重新获取...');
      await this.registerForPushNotifications();
    }

    if (this.expoPushToken) {
      console.log('✅ 使用Expo推送Token重新注册设备');
      await this.registerDeviceToBackendWithRetry();
    } else {
      console.log('❌ 无法获取Expo推送Token，设备注册失败');
    }
  }

  /**
   * 获取当前推送Token状态
   * 智能返回：优先JPush Registration ID，降级Expo Push Token
   */
  getTokenStatus(): { hasToken: boolean; token: string | null; tokenType: 'jpush' | 'expo' | 'none' } {
    if (this.useJPush && this.jpushAvailable) {
      const jpushToken = jpushService.getRegistrationIdSync();
      return {
        hasToken: !!jpushToken,
        token: jpushToken,
        tokenType: 'jpush'
      };
    } else if (this.expoPushToken) {
      return {
        hasToken: true,
        token: this.expoPushToken,
        tokenType: 'expo'
      };
    } else {
      return {
        hasToken: false,
        token: null,
        tokenType: 'none'
      };
    }
  }

  /**
   * 获取推送Token（向后兼容）
   * 智能返回：优先JPush Registration ID，降级Expo Push Token
   */
  getPushToken(): string | null {
    if (this.useJPush && this.jpushAvailable) {
      return jpushService.getRegistrationIdSync();
    }
    return this.expoPushToken;
  }

  /**
   * 清理监听器
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

export const pushService = new PushService();
