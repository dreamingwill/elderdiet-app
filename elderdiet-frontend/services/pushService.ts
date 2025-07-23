import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api.config';

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

  /**
   * 初始化推送服务
   */
  async initialize(): Promise<void> {
    try {
      // 注册推送通知
      await this.registerForPushNotifications();
      
      // 设置通知监听器
      this.setupNotificationListeners();
      
      console.log('推送服务初始化成功');
    } catch (error) {
      console.error('推送服务初始化失败:', error);
    }
  }

  /**
   * 注册推送通知
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('推送通知只能在真实设备上使用');
        return null;
      }

      // 检查现有权限
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // 如果没有权限，请求权限
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('推送通知权限被拒绝');
        return null;
      }

      // 获取推送Token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '36ea1d9a-f68a-4445-a8fa-c22c49972703', // 从app.json中获取
      });

      this.expoPushToken = token.data;
      console.log('获取到推送Token:', this.expoPushToken);

      // 注册设备到后端
      await this.registerDeviceToBackend();

      return this.expoPushToken;
    } catch (error) {
      console.error('注册推送通知失败:', error);
      return null;
    }
  }

  /**
   * 注册设备到后端
   */
  async registerDeviceToBackend(): Promise<void> {
    try {
      if (!this.expoPushToken) {
        console.log('没有推送Token，跳过设备注册');
        return;
      }

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.log('用户未登录，跳过设备注册');
        return;
      }

      const deviceInfo: DeviceRegistration = {
        deviceToken: this.expoPushToken,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        deviceModel: Device.modelName || undefined,
        appVersion: '1.0.0', // 可以从app.json动态获取
        pushEnabled: true,
        mealRecordPushEnabled: true,
        reminderPushEnabled: true,
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(deviceInfo),
      });

      if (response.ok) {
        console.log('设备注册成功');
      } else {
        console.error('设备注册失败:', response.status);
      }
    } catch (error) {
      console.error('注册设备到后端失败:', error);
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
    }
  }

  /**
   * 处理用户点击通知的响应
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;

    if (data?.action === 'view_meal_record' && data?.meal_record_id) {
      // 跳转到膳食记录详情页
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

      const authToken = await AsyncStorage.getItem('authToken');
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
   * 获取推送Token
   */
  getPushToken(): string | null {
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
