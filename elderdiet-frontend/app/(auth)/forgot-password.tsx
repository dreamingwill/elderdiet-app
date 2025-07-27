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
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { authAPI, VerifyRelationshipResponse } from '@/services/api';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [userPhone, setUserPhone] = useState('');
  const [relatedPhone, setRelatedPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyRelationshipResponse | null>(null);

  // 格式化手机号输入
  const handlePhoneChange = (text: string, setter: (value: string) => void) => {
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 11);
    setter(numericText);
    if (errorMessage) setErrorMessage('');
  };

  // 验证关联关系
  const handleVerifyRelationship = async () => {
    if (userPhone.length !== 11) {
      setErrorMessage('请输入正确的11位手机号');
      return;
    }
    
    if (relatedPhone.length !== 11 && relatedPhone !== '18100010001') {
      setErrorMessage('请输入正确的关联手机号或特殊号码');
      return;
    }

    if (userPhone === relatedPhone) {
      setErrorMessage('本人手机号和关联手机号不能相同');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await authAPI.verifyRelationship(userPhone, relatedPhone);
      if (response.success && response.data) {
        setVerifyResult(response.data);
        setStep('reset');
        Alert.alert('验证成功', `找到${response.data.relationshipType === 'backdoor' ? '后门权限' : '家庭关联关系'}，请设置新密码`);
      } else {
        setErrorMessage('验证失败，请检查输入信息');
      }
    } catch (error) {
      console.error('验证关联关系错误:', error);
      setErrorMessage(error instanceof Error ? error.message : '验证失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setErrorMessage('密码长度至少6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await authAPI.resetPassword(userPhone, relatedPhone, newPassword);
      if (response.success) {
        Alert.alert('重置成功', '密码已重置，请使用新密码登录', [
          {
            text: '确定',
            onPress: () => router.replace('/(auth)/login')
          }
        ]);
      } else {
        setErrorMessage('重置失败，请重试');
      }
    } catch (error) {
      console.error('重置密码错误:', error);
      setErrorMessage(error instanceof Error ? error.message : '重置失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 返回上一步
  const handleGoBack = () => {
    if (step === 'reset') {
      setStep('verify');
      setVerifyResult(null);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage('');
    } else {
      router.back();
    }
  };

  const renderVerifyStep = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>验证身份</Text>
      <Text style={styles.stepDescription}>
        请输入您的手机号和关联手机号来验证身份
      </Text>

      {/* 本人手机号 */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>本人手机号</Text>
        <TextInput
          style={styles.input}
          placeholder="请输入您的手机号"
          placeholderTextColor="#999"
          value={userPhone}
          onChangeText={(text) => handlePhoneChange(text, setUserPhone)}
          keyboardType="numeric"
          maxLength={11}
        />
      </View>

      {/* 关联手机号 */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>关联手机号</Text>
        <TextInput
          style={styles.input}
          placeholder="家人手机号或特殊号码18100010001"
          placeholderTextColor="#999"
          value={relatedPhone}
          onChangeText={(text) => handlePhoneChange(text, setRelatedPhone)}
          keyboardType="numeric"
          maxLength={11}
        />
        <Text style={styles.helpText}>
          老人用户：输入子女手机号{'\n'}
          子女用户：输入老人手机号{'\n'}
          后门权限：输入18100010001
        </Text>
      </View>

      {/* 错误提示 */}
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* 验证按钮 */}
      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
        onPress={handleVerifyRelationship}
        disabled={isLoading}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading ? '验证中...' : '验证关联关系'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderResetStep = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>设置新密码</Text>
      <Text style={styles.stepDescription}>
        验证成功！用户：{verifyResult?.userName} ({verifyResult?.userRole === 'ELDER' ? '老人' : '子女'})
      </Text>

      {/* 新密码 */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>新密码</Text>
        <TextInput
          style={styles.input}
          placeholder="请输入新密码（至少6位）"
          placeholderTextColor="#999"
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            if (errorMessage) setErrorMessage('');
          }}
          secureTextEntry
        />
      </View>

      {/* 确认密码 */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>确认新密码</Text>
        <TextInput
          style={styles.input}
          placeholder="请再次输入新密码"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errorMessage) setErrorMessage('');
          }}
          secureTextEntry
        />
      </View>

      {/* 错误提示 */}
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* 重置按钮 */}
      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading ? '重置中...' : '重置密码'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>忘记密码</Text>
              <Text style={styles.subtitle}>
                {step === 'verify' ? '验证身份信息' : '设置新密码'}
              </Text>
            </View>

            {step === 'verify' ? renderVerifyStep() : renderResetStep()}

            {/* 返回按钮 */}
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <Text style={styles.backButtonText}>
                {step === 'verify' ? '返回登录' : '返回上一步'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
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
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
  helpText: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 6,
    lineHeight: 16,
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
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
});
