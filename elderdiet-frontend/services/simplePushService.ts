import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStorage } from '../utils/authStorage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/api.config';

interface DeviceRegistration {
  deviceToken: string;
  platform: 'ANDROID' | 'IOS';
  deviceModel?: string;
  appVersion: string;
  pushEnabled: boolean;
  mealRecordPushEnabled: boolean;
  reminderPushEnabled: boolean;
}

/**
 * 简化的推送服务
 * 避免Firebase配置问题，直接使用设备ID作为Token
 */
class SimplePushService {
  private deviceToken: string | null = null;
  private maxRetries = 3;
  private isRegistering = false; // 防止重复注册

  /**
   * 初始化推送服务
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 开始初始化简化推送服务...');

      if (!Device.isDevice) {
        console.log('⚠️ 推送通知只能在真实设备上使用（当前是模拟器）');
        return;
      }

      // 生成设备Token（使用设备信息）
      await this.generateDeviceToken();

      if (this.deviceToken) {
        console.log('✅ 设备Token生成成功:', this.deviceToken.substring(0, 20) + '...');

        // 检查用户是否已登录，如果已登录则立即注册设备
        const authToken = await authStorage.getItem('userToken');
        if (authToken) {
          console.log('📱 用户已登录，立即注册设备...');
          // 延迟一点时间，确保用户状态完全加载
          setTimeout(async () => {
            await this.registerDeviceToBackendWithRetry();
          }, 500);
        } else {
          console.log('⚠️ 用户未登录，等待登录后再注册设备');
        }
      } else {
        console.log('❌ 设备Token生成失败');
      }

      console.log('✅ 简化推送服务初始化完成');
    } catch (error) {
      console.error('❌ 简化推送服务初始化失败:', error);
    }
  }

  /**
   * 生成设备Token
   */
  private async generateDeviceToken(): Promise<void> {
    try {
      // 使用设备信息生成唯一Token
      const deviceInfo = {
        platform: Platform.OS,
        model: Device.modelName || 'unknown',
        osVersion: Device.osVersion || 'unknown',
        brand: Device.brand || 'unknown',
        timestamp: Date.now()
      };

      // 生成基于设备信息的唯一标识符
      const deviceString = JSON.stringify(deviceInfo);
      const hash = await this.simpleHash(deviceString);
      this.deviceToken = `simple_push_${Platform.OS}_${hash}`;
      
      console.log('📱 生成设备Token:', this.deviceToken);
    } catch (error) {
      console.error('❌ 生成设备Token失败:', error);
    }
  }

  /**
   * 简单哈希函数
   */
  private async simpleHash(str: string): Promise<string> {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 带重试的设备注册
   */
  private async registerDeviceToBackendWithRetry(): Promise<void> {
    if (this.isRegistering) {
      console.log('⚠️ 设备注册正在进行中，跳过重复请求');
      return;
    }

    this.isRegistering = true;
    try {
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
    } finally {
      this.isRegistering = false;
    }
  }

  /**
   * 注册设备到后端
   */
  async registerDeviceToBackend(): Promise<boolean> {
    try {
      if (!this.deviceToken) {
        console.log('⚠️ 没有设备Token，跳过设备注册');
        return false;
      }

      const authToken = await authStorage.getItem('userToken');
      if (!authToken) {
        console.log('⚠️ 用户未登录，等待登录后再注册设备');
        return false;
      }

      console.log('📤 向后端注册设备...');
      console.log('🔍 设备Token:', this.deviceToken);

      const deviceInfo: DeviceRegistration = {
        deviceToken: this.deviceToken,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        deviceModel: Device.modelName || undefined,
        appVersion: '1.0.0',
        pushEnabled: true,
        mealRecordPushEnabled: true,
        reminderPushEnabled: true,
      };

      console.log('📋 发送的设备信息:', JSON.stringify(deviceInfo, null, 2));

      const requestBody = JSON.stringify(deviceInfo);
      console.log('📤 请求体:', requestBody);
      console.log('🔗 请求URL:', `${API_BASE_URL}/devices/register`);
      console.log('🔑 认证Token:', authToken ? authToken.substring(0, 20) + '...' : 'null');

      const response = await fetch(`${API_BASE_URL}/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: requestBody,
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
    
    if (!this.deviceToken) {
      console.log('⚠️ 没有设备Token，重新生成...');
      await this.generateDeviceToken();
      if (!this.deviceToken) {
        console.log('❌ 无法生成设备Token，设备注册失败');
        return;
      }
    }
    
    await this.registerDeviceToBackendWithRetry();
  }

  /**
   * 获取当前的设备Token
   */
  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  /**
   * 获取推送设置状态
   */
  async getPushSettings(): Promise<any> {
    return {
      deviceToken: this.deviceToken,
      isEnabled: !!this.deviceToken,
      platform: Platform.OS,
    };
  }

  /**
   * 模拟清除通知
   */
  clearAllNotifications(): void {
    console.log('🧹 已清除所有通知（简化版本）');
  }
}

// 导出单例
export const simplePushService = new SimplePushService();
export default simplePushService;
