import JPush from 'jpush-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStorage } from '../utils/authStorage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/api.config';
import { JPUSH_APP_KEY, JPUSH_CHANNEL, JPUSH_PRODUCTION } from '../config/jpush.config';

interface DeviceRegistration {
  deviceToken: string;
  platform: 'ANDROID' | 'IOS';
  deviceModel?: string;
  appVersion: string;
  pushEnabled: boolean;
  mealRecordPushEnabled: boolean;
  reminderPushEnabled: boolean;
}

class JPushService {
  private registrationId: string | null = null;
  private initializationRetryCount = 0;
  private maxRetries = 3;

  /**
   * 检查JPush是否可用
   */
  isJPushAvailable(): boolean {
    try {
      return JPush !== null && typeof JPush.init === 'function';
    } catch (error) {
      return false;
    }
  }

  /**
   * 初始化JPush服务
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 开始初始化JPush服务...');

      if (!Device.isDevice) {
        console.log('⚠️ JPush只能在真实设备上使用（当前是模拟器）');
        return;
      }

      if (!this.isJPushAvailable()) {
        throw new Error('JPush SDK 不可用，可能是因为运行在 Expo 托管环境中');
      }

      // 初始化JPush
      await this.initJPush();
      
      // 获取RegistrationId
      const registrationId = await this.getRegistrationId();
      
      if (registrationId) {
        console.log('✅ JPush RegistrationId获取成功:', registrationId.substring(0, 20) + '...');
        
        // 尝试注册设备到后端
        await this.registerDeviceToBackendWithRetry();
      } else {
        console.log('❌ JPush RegistrationId获取失败');
      }
      
      // 设置通知监听器
      this.setupNotificationListeners();
      
      console.log('✅ JPush服务初始化完成');
    } catch (error) {
      console.error('❌ JPush服务初始化失败:', error);
    }
  }

  /**
   * 初始化JPush
   */
  private async initJPush(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 初始化JPush
        JPush.init({
          appKey: JPUSH_APP_KEY,
          channel: JPUSH_CHANNEL,
          production: JPUSH_PRODUCTION,
        });

        // 监听初始化完成事件
        JPush.addConnectEventListener((result) => {
          console.log('📱 JPush连接状态:', result);
          if (result.connectEnable) {
            resolve();
          }
        });

        // 设置调试模式
        JPush.setLoggerEnable(true);

        console.log('📱 JPush初始化完成');
        resolve();
      } catch (error) {
        console.error('❌ JPush初始化失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 获取RegistrationId
   */
  private async getRegistrationId(): Promise<string | null> {
    try {
      return new Promise((resolve) => {
        JPush.getRegistrationID((result) => {
          if (result && result.registerID) {
            this.registrationId = result.registerID;
            console.log('✅ 获取到RegistrationId:', result.registerID);
            resolve(result.registerID);
          } else {
            console.log('❌ 未能获取到RegistrationId');
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('❌ 获取RegistrationId失败:', error);
      return null;
    }
  }

  /**
   * 设置通知监听器
   */
  private setupNotificationListeners(): void {
    // 监听通知点击事件
    JPush.addNotificationListener((result) => {
      console.log('📱 收到通知:', result);
      // 处理通知点击逻辑
      this.handleNotificationClick(result);
    });

    // 监听自定义消息
    JPush.addCustomMessageListener((result) => {
      console.log('📱 收到自定义消息:', result);
      // 处理自定义消息逻辑
    });

    // 监听本地通知
    JPush.addLocalNotificationListener((result) => {
      console.log('📱 收到本地通知:', result);
    });
  }

  /**
   * 处理通知点击
   */
  private handleNotificationClick(notification: any): void {
    try {
      const extras = notification.extras;
      
      if (extras?.type === 'meal_record') {
        // 跳转到膳食记录详情页
        console.log('🍽️ 跳转到膳食记录:', extras.mealRecordId);
        // 这里可以使用导航跳转到相应页面
      } else if (extras?.type === 'reminder') {
        // 跳转到膳食记录页面
        console.log('⏰ 跳转到膳食记录页面');
        // 这里可以使用导航跳转到相应页面
      }
    } catch (error) {
      console.error('❌ 处理通知点击失败:', error);
    }
  }

  /**
   * 带重试的设备注册
   */
  private async registerDeviceToBackendWithRetry(): Promise<void> {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const success = await this.registerDeviceToBackend();
        if (success) {
          console.log('✅ 设备注册成功');
          return;
        }
      } catch (error) {
        console.error(`❌ 设备注册失败 (尝试 ${i + 1}/${this.maxRetries}):`, error);
      }

      if (i < this.maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 指数退避
        console.log(`🔄 ${delay}ms后重试设备注册...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.error('❌ 设备注册最终失败，已达到最大重试次数');
  }

  /**
   * 注册设备到后端
   */
  async registerDeviceToBackend(): Promise<boolean> {
    try {
      if (!this.registrationId) {
        console.log('⚠️ 没有RegistrationId，跳过设备注册');
        return false;
      }

      const authToken = await authStorage.getItem('userToken');
      if (!authToken) {
        console.log('⚠️ 用户未登录，等待登录后再注册设备');
        return false;
      }

      console.log('📤 向后端注册设备...');

      const deviceInfo: DeviceRegistration = {
        deviceToken: this.registrationId,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        deviceModel: Device.modelName || undefined,
        appVersion: '1.0.0',
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
        console.log('✅ 设备注册成功');
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ 设备注册失败:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ 设备注册异常:', error);
      return false;
    }
  }

  /**
   * 用户登录后重新注册设备
   */
  async onUserLogin(): Promise<void> {
    console.log('🔄 用户登录后重新注册设备...');
    
    if (!this.registrationId) {
      console.log('⚠️ 没有RegistrationId，重新获取...');
      const registrationId = await this.getRegistrationId();
      if (!registrationId) {
        console.log('❌ 无法获取RegistrationId，设备注册失败');
        return;
      }
    }
    
    await this.registerDeviceToBackendWithRetry();
  }

  /**
   * 获取当前的RegistrationId
   */
  getRegistrationIdSync(): string | null {
    return this.registrationId;
  }

  /**
   * 设置别名
   */
  async setAlias(alias: string): Promise<void> {
    try {
      JPush.setAlias({
        alias: alias,
        sequence: Date.now(),
      });
      console.log('✅ 设置别名成功:', alias);
    } catch (error) {
      console.error('❌ 设置别名失败:', error);
    }
  }

  /**
   * 设置标签
   */
  async setTags(tags: string[]): Promise<void> {
    try {
      if (JPush.setTags) {
        JPush.setTags({
          tags: tags,
          sequence: Date.now(),
        });
        console.log('✅ 设置标签成功:', tags);
      } else {
        console.log('⚠️ JPush.setTags方法不可用');
      }
    } catch (error) {
      console.error('❌ 设置标签失败:', error);
    }
  }

  /**
   * 清除通知
   */
  clearAllNotifications(): void {
    JPush.clearAllNotifications();
    console.log('🧹 已清除所有通知');
  }

  /**
   * 获取推送设置状态
   */
  async getPushSettings(): Promise<any> {
    return new Promise((resolve) => {
      JPush.getRegistrationID((registrationId) => {
        resolve({
          registrationId,
          isEnabled: !!registrationId,
        });
      });
    });
  }
}

// 导出单例
export const jpushService = new JPushService();
export default jpushService;
