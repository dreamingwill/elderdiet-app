import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { profileAPI } from '@/services/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { signIn } = useUser();

  // 格式化手机号输入
  const handlePhoneChange = (text: string) => {
    // 只允许数字，最大11位
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 11);
    setPhone(numericText);
    // 清除错误信息
    if (errorMessage) setErrorMessage('');
  };

  // 密码输入处理
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errorMessage) setErrorMessage('');
  };

  // 检查用户是否有健康档案
  const checkUserProfile = async (token: string, userId: string) => {
    try {
      const response = await profileAPI.getProfile(userId, token);
      return response.data !== null; // 有档案返回true，无档案返回false
    } catch (error) {
      // 如果是404错误，说明档案不存在
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('不存在'))) {
        return false;
      }
      // 其他错误抛出
      throw error;
    }
  };

  // 登录处理
  const handleLogin = async () => {
    if (phone.length !== 11) {
      setErrorMessage('请输入正确的11位手机号');
      return;
    }
    
    if (password.length === 0) {
      setErrorMessage('请输入密码');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // 执行登录
      await signIn(phone, password);
      
      // 登录成功后，检查用户是否有健康档案
      // 获取当前用户信息
      const userToken = await import('@/utils/authStorage').then(module => 
        module.authStorage.getItem('userToken')
      );
      const userId = await import('@/utils/authStorage').then(module => 
        module.authStorage.getItem('userUid')
      );

      if (userToken && userId) {
        const hasProfile = await checkUserProfile(userToken, userId);
        
        if (hasProfile) {
          // 有档案，正常跳转到主页面
          Alert.alert('登录成功', '欢迎使用养老膳食助手', [
            {
              text: '确定',
              onPress: () => router.replace('/(tabs)/meal-plan')
            }
          ]);
        } else {
          // 没有档案，提示创建档案
          Alert.alert(
            '完善健康档案', 
            '为了给您提供更好的膳食建议，请先完善您的健康档案。',
            [
              {
                text: '稍后完善',
                style: 'cancel',
                onPress: () => router.replace('/(tabs)/meal-plan')
              },
              {
                text: '立即完善',
                onPress: () => router.replace('/edit-profile')
              }
            ]
          );
        }
      } else {
        // 获取用户信息失败，跳转到主页面
        router.replace('/(tabs)/meal-plan');
      }
    } catch (error) {
      console.error('登录错误:', error);
      setErrorMessage(error instanceof Error ? error.message : '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 跳转到注册页面
  const handleRegisterRedirect = () => {
    router.push('/(auth)/register');
  };

  // 跳转到忘记密码页面
  const handleForgotPasswordRedirect = () => {
    router.push('/(auth)/forgot-password');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>养老膳食助手</Text>
            <Text style={styles.subtitle}>请登录您的账号</Text>
          </View>

          <View style={styles.form}>
            {/* 手机号输入框 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>手机号</Text>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="请输入手机号"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="numeric"
                maxLength={11}
                autoComplete="tel"
              />
            </View>

            {/* 密码输入框 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>密码</Text>
              <TextInput
                style={[styles.input]}
                placeholder="请输入密码"
                placeholderTextColor="#999"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                autoComplete="current-password"
              />
            </View>

            {/* 错误提示 */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* 登录按钮 */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? '登录中...' : '登录'}
              </Text>
            </TouchableOpacity>

            {/* 注册链接 */}
            <View style={styles.registerLinkContainer}>
              <Text style={styles.registerLinkText}>还没有账号？</Text>
              <TouchableOpacity onPress={handleRegisterRedirect}>
                <Text style={styles.registerLinkButton}>立即注册</Text>
              </TouchableOpacity>
            </View>

            {/* 忘记密码链接 */}
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={handleForgotPasswordRedirect}>
                <Text style={styles.forgotPasswordText}>忘记密码？</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 开发环境提示 */}
          {__DEV__ && (
            <View style={styles.devTip}>
              <Text style={styles.devTipText}>
                需要先注册账号，然后使用手机号+密码登录
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fafbfc',
    color: '#2c3e50',
  },
  phoneInput: {
    // 可以添加手机号特定样式
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: '#c53030',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerLinkText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  registerLinkButton: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#7f8c8d',
    textDecorationLine: 'underline',
  },
  devTip: {
    marginTop: 24,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bee5eb',
  },
  devTipText: {
    fontSize: 12,
    color: '#0c5460',
    textAlign: 'center',
  },
}); 