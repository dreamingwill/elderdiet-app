import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { testNetworkConnection, testMultipleEndpoints, NetworkTestResult } from '@/utils/networkTest';
import { API_BASE_URL } from '@/config/api.config';

export default function NetworkTestScreen() {
  const [testResults, setTestResults] = useState<NetworkTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runBasicTest = async () => {
    setIsLoading(true);
    try {
      const result = await testNetworkConnection();
      setTestResults([result]);
      
      if (result.success) {
        Alert.alert('成功', result.message);
      } else {
        Alert.alert('失败', result.message);
      }
    } catch (error) {
      Alert.alert('错误', '测试过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const runMultipleTests = async () => {
    setIsLoading(true);
    try {
      const results = await testMultipleEndpoints();
      setTestResults(results);
      
      const successCount = results.filter(r => r.success).length;
      Alert.alert('测试完成', `${successCount}/${results.length} 个端点测试成功`);
    } catch (error) {
      Alert.alert('错误', '测试过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>网络连接测试</Text>
        <Text style={styles.subtitle}>API 地址: {API_BASE_URL}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={runBasicTest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '测试中...' : '基础连接测试'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={runMultipleTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '测试中...' : '多端点测试'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>清除结果</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>测试结果:</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>暂无测试结果</Text>
        ) : (
          testResults.map((result, index) => (
            <View 
              key={index} 
              style={[
                styles.resultItem,
                result.success ? styles.successResult : styles.failureResult
              ]}
            >
              <Text style={styles.resultMessage}>{result.message}</Text>
              <Text style={styles.resultTimestamp}>{result.timestamp}</Text>
              {result.details && (
                <View style={styles.resultDetails}>
                  <Text style={styles.detailsTitle}>详细信息:</Text>
                  <Text style={styles.detailsText}>
                    {JSON.stringify(result.details, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  secondaryButton: {
    backgroundColor: '#28a745',
  },
  clearButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  noResults: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
  },
  resultItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  successResult: {
    backgroundColor: '#d4edda',
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  failureResult: {
    backgroundColor: '#f8d7da',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  resultMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  resultDetails: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
}); 