import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * 用户认证数据的跨平台存储工具
 * Web端使用localStorage，移动端使用SecureStore
 */
class AuthStorage {
  /**
   * 存储数据
   */
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Web端使用localStorage
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('localStorage.setItem failed:', error);
        throw error;
      }
    } else {
      // 移动端使用SecureStore
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error('SecureStore.setItemAsync failed:', error);
        throw error;
      }
    }
  }

  /**
   * 获取数据
   */
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Web端使用localStorage
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('localStorage.getItem failed:', error);
        return null;
      }
    } else {
      // 移动端使用SecureStore
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.error('SecureStore.getItemAsync failed:', error);
        return null;
      }
    }
  }

  /**
   * 删除数据
   */
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Web端使用localStorage
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('localStorage.removeItem failed:', error);
        throw error;
      }
    } else {
      // 移动端使用SecureStore
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error('SecureStore.deleteItemAsync failed:', error);
        throw error;
      }
    }
  }

  /**
   * 清除所有认证相关数据
   */
  async clearAuthData(): Promise<void> {
    const keys = ['userToken', 'userRole', 'userUid', 'userPhone'];
    
    for (const key of keys) {
      try {
        await this.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove ${key}:`, error);
      }
    }
  }
}

// 导出单例实例
export const authStorage = new AuthStorage();

// 默认导出
export default authStorage; 