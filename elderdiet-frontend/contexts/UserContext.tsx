import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

type UserRole = 'elder' | 'child';

interface UserData {
  uid: string;
  role: UserRole;
  phone: string;
  token: string;
}

interface UserContextType {
  role: UserRole | null;
  uid: string | null;
  phone: string | null;
  token: string | null;
  isAuthenticated: boolean;
  signUp: (phone: string, password: string, role: UserRole) => Promise<void>;
  signIn: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [uid, setUidState] = useState<string | null>(null);
  const [phone, setPhoneState] = useState<string | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = role !== null && uid !== null && token !== null;

  useEffect(() => {
    // 从安全存储加载用户数据
    const loadUserData = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('userToken');
        const savedRole = await SecureStore.getItemAsync('userRole');
        const savedUid = await SecureStore.getItemAsync('userUid');
        const savedPhone = await SecureStore.getItemAsync('userPhone');

        if (savedToken && savedRole && savedUid && savedPhone) {
          // 验证token是否仍然有效
          try {
            await authAPI.me(savedToken);
            setTokenState(savedToken);
            setRoleState(savedRole as UserRole);
            setUidState(savedUid);
            setPhoneState(savedPhone);
          } catch (error) {
            // Token无效，清除存储的数据
            console.log('Token已过期，清除用户数据');
            await clearUserData();
          }
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const saveUserData = async (userData: UserData) => {
    await SecureStore.setItemAsync('userToken', userData.token);
    await SecureStore.setItemAsync('userRole', userData.role);
    await SecureStore.setItemAsync('userUid', userData.uid);
    await SecureStore.setItemAsync('userPhone', userData.phone);
  };

  const clearUserData = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userRole');
    await SecureStore.deleteItemAsync('userUid');
    await SecureStore.deleteItemAsync('userPhone');
  };

  const signUp = async (phone: string, password: string, role: UserRole) => {
    try {
      const response = await authAPI.register(phone, password, role);
      if (response.success && response.data) {
        const userData: UserData = {
          uid: response.data.uid,
          role: response.data.role,
          phone: response.data.phone,
          token: response.data.token,
        };

        await saveUserData(userData);
        setTokenState(userData.token);
        setRoleState(userData.role);
        setUidState(userData.uid);
        setPhoneState(userData.phone);
      } else {
        throw new Error(response.message || '注册失败');
      }
    } catch (error) {
      console.error('Failed to sign up:', error);
      throw error;
    }
  };

  const signIn = async (phone: string, password: string) => {
    try {
      const response = await authAPI.login(phone, password);
      if (response.success && response.data) {
        const userData: UserData = {
          uid: response.data.uid,
          role: response.data.role,
          phone: response.data.phone,
          token: response.data.token,
        };

        await saveUserData(userData);
        setTokenState(userData.token);
        setRoleState(userData.role);
        setUidState(userData.uid);
        setPhoneState(userData.phone);
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error) {
      console.error('Failed to sign in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // 如果有token，调用后端注销接口
      if (token) {
        try {
          await authAPI.logout(token);
        } catch (error) {
          console.warn('Backend logout failed:', error);
        }
      }

      // 清除本地存储
      await clearUserData();
      setTokenState(null);
      setRoleState(null);
      setUidState(null);
      setPhoneState(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ 
      role, 
      uid, 
      phone,
      token,
      isAuthenticated, 
      signUp,
      signIn, 
      signOut, 
      isLoading 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 