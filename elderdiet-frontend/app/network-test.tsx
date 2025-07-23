import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { 
  runNetworkTests, 
  testExpoPushService, 
  detectChinaNetwork,
  NetworkTestResult 
} from '@/utils/networkTest';
import { API_BASE_URL } from '@/config/api.config';

export default function NetworkTestScreen() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<NetworkTestResult[]>([]);
  const [chinaNetwork, setChinaNetwork] = useState<boolean | null>(null);

  useEffect(() => {
    // 自动检测网络环境
    detectChinaNetwork().then(setChinaNetwork);
  }, []);

  const runTests = async () => {
    setTesting(true);
    try {
      const testResults = await runNetworkTests(API_BASE_URL);
      setResults(testResults);
    } catch (error) {
      console.error('网络测试失败:', error);
      Alert.alert('测试失败', '网络测试过程中出现错误');
    } finally {
      setTesting(false);
    }
  };

  const testExpoPushOnly = async () => {
    setTesting(true);
    try {
      const result = await testExpoPushService();
      setResults([result]);
      
      if (result.success) {
        Alert.alert(
          '✅ 连通性正常', 
          `Expo推送服务可以正常访问\n响应时间: ${result.responseTime}ms`
        );
      } else {
        Alert.alert(
          '❌ 连通性问题', 
          `无法访问Expo推送服务\n错误: ${result.error}\n\n建议:\n1. 检查网络连接\n2. 尝试使用VPN\n3. 考虑使用原生推送SDK`
        );
      }
    } catch (error) {
      console.error('Expo推送测试失败:', error);
      Alert.alert('测试失败', '测试过程中出现错误');
    } finally {
      setTesting(false);
    }
  };

  const renderResult = (result: NetworkTestResult, index: number) => (
    <View key={index} style={styles.resultContainer}>
      <View style={styles.resultHeader}>
        <Text style={styles.serviceName}>{result.service}</Text>
        <Text style={[
          styles.status,
          result.success ? styles.success : styles.error
        ]}>
          {result.success ? '✅ 正常' : '❌ 失败'}
        </Text>
      </View>
      
      {result.responseTime && (
        <Text style={styles.responseTime}>
          响应时间: {result.responseTime}ms
        </Text>
      )}
      
      {result.error && (
        <Text style={styles.errorText}>
          错误: {result.error}
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🌐 网络连通性测试</Text>
        
        {/* 网络环境检测 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 网络环境检测</Text>
          {chinaNetwork !== null && (
            <View style={styles.networkInfo}>
              <Text style={styles.networkText}>
                检测结果: {chinaNetwork ? '🇨🇳 中国大陆网络环境' : '🌍 国际网络环境'}
              </Text>
              {chinaNetwork && (
                <Text style={styles.warningText}>
                  ⚠️ 在中国大陆可能需要稳定的国际网络连接才能使用Expo推送服务
                </Text>
              )}
            </View>
          )}
        </View>

        {/* 测试按钮 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 连通性测试</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={testExpoPushOnly}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>📱 测试Expo推送服务</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={runTests}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                🔄 完整网络测试
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 测试结果 */}
        {results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 测试结果</Text>
            {results.map(renderResult)}
          </View>
        )}

        {/* 故障排除建议 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 故障排除建议</Text>
          <View style={styles.tipsContainer}>
            <Text style={styles.tipText}>
              📌 如果Expo推送服务连通失败:
            </Text>
            <Text style={styles.tipItem}>
              1. 检查设备网络连接是否正常
            </Text>
            <Text style={styles.tipItem}>
              2. 尝试切换到移动数据网络
            </Text>
            <Text style={styles.tipItem}>
              3. 如果在中国大陆，可能需要使用VPN
            </Text>
            <Text style={styles.tipItem}>
              4. 考虑使用极光推送原生SDK作为备选方案
            </Text>
          </View>
        </View>

        {/* 备选方案 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 备选推送方案</Text>
          <View style={styles.alternativeContainer}>
            <Text style={styles.alternativeTitle}>
              方案A: 继续使用Expo (推荐尝试)
            </Text>
            <Text style={styles.alternativeText}>
              • 在稳定网络环境下测试
              • 可能需要VPN辅助
              • 保持当前架构不变
            </Text>
            
            <Text style={styles.alternativeTitle}>
              方案B: 集成极光原生SDK (备选)
            </Text>
            <Text style={styles.alternativeText}>
              • React Native + 极光推送插件
              • 网络连接更稳定
              • 需要修改前端架构
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  networkInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  networkText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  warningText: {
    fontSize: 14,
    color: '#ff9500',
    lineHeight: 20,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  resultContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  success: {
    color: '#28a745',
  },
  error: {
    color: '#dc3545',
  },
  responseTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
  },
  tipsContainer: {
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    padding: 12,
  },
  tipText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  tipItem: {
    fontSize: 14,
    color: '#666',
    marginLeft: 16,
    marginBottom: 4,
    lineHeight: 20,
  },
  alternativeContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
    color: '#333',
  },
  alternativeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 8,
  },
}); 