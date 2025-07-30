import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../../contexts/UserContext';

export default function RegisterScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ELDER' | 'CHILD'>('ELDER');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp } = useUser();
  const router = useRouter();

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6 && password.length <= 20;
  };

  const handleRegister = async () => {
    // 表单验证
    if (!phone.trim()) {
      Alert.alert('错误', '请输入手机号');
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('错误', '请输入正确的手机号格式');
      return;
    }

    if (!password.trim()) {
      Alert.alert('错误', '请输入密码');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('错误', '密码长度应为6-20位');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('错误', '两次输入的密码不一致');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(phone, password, selectedRole);
      // 注册成功后自动跳转到主页面
      router.replace('/(tabs)/meal-plan');
    } catch (error) {
      Alert.alert('注册失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    router.push('/(auth)/login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>欢迎注册</Text>
          <Text style={styles.subtitle}>养老膳食助手</Text>
        </View>

        <View style={styles.form}>
          {/* 手机号输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>手机号</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入手机号"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={11}
              autoComplete="tel"
            />
          </View>

          {/* 密码输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>密码</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入密码（6-20位）"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
            />
          </View>

          {/* 确认密码输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>确认密码</Text>
            <TextInput
              style={styles.input}
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password-new"
            />
          </View>

          {/* 身份选择 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>我是</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'ELDER' && styles.roleOptionActive,
                ]}
                onPress={() => setSelectedRole('ELDER')}
              >
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === 'ELDER' && styles.roleTextActive,
                  ]}
                >
                  老人
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'CHILD' && styles.roleOptionActive,
                ]}
                onPress={() => setSelectedRole('CHILD')}
              >
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === 'CHILD' && styles.roleTextActive,
                  ]}
                >
                  家属
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 注册按钮 */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? '注册中...' : '立即注册'}
            </Text>
          </TouchableOpacity>

          {/* 登录链接 */}
          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>已有账号？</Text>
            <TouchableOpacity onPress={handleLoginRedirect}>
              <Text style={styles.loginLinkButton}>立即登录</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  roleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleOption: {
    flex: 0.48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  roleOptionActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  roleText: {
    fontSize: 16,
    color: '#666',
  },
  roleTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkButton: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
}); 