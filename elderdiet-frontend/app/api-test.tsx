import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { healthAPI, authAPI } from '@/services/api';

export default function ApiTestScreen() {
  const [healthResult, setHealthResult] = useState<string>('');
  const [authResult, setAuthResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testHealthAPI = async () => {
    setIsLoading(true);
    try {
      const response = await healthAPI.check();
      setHealthResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setHealthResult(`错误: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

//   const testSmsAPI = async () => {
//     setIsLoading(true);
//     try {
//       const response = await authAPI.sendSms('13800000001');
//       setAuthResult(JSON.stringify(response, null, 2));
//     } catch (error) {
//       setAuthResult(`错误: ${error}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

  const testLoginAPI = async () => {
    setIsLoading(true);
    try {
      const response = await authAPI.login('13800000001', '000000');
      setAuthResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setAuthResult(`错误: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>API 连接测试</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>健康检查 API</Text>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={testHealthAPI}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>测试健康检查</Text>
          </TouchableOpacity>
          {healthResult ? (
            <View style={styles.result}>
              <Text style={styles.resultText}>{healthResult}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>认证 API</Text>
          {/* <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={testSmsAPI}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>测试发送验证码</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={testLoginAPI}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>测试登录</Text>
          </TouchableOpacity>
          {authResult ? (
            <View style={styles.result}>
              <Text style={styles.resultText}>{authResult}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            后端地址: http://localhost:3001{'\n'}
            测试账号: 13800000001 / 000000{'\n'}
            测试账号: 13800000002 / 000000
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  result: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  info: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
}); 