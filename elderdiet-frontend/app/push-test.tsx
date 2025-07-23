import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { pushService } from '@/services/pushService';
import { API_BASE_URL } from '@/config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PushTestScreen() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadPushToken();
    loadStatistics();
  }, []);

  const loadPushToken = () => {
    const token = pushService.getPushToken();
    setPushToken(token);
  };

  const loadStatistics = async () => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) return;

      const response = await fetch(`${API_BASE_URL}/api/v1/push/test/statistics`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };

  const testLunchReminder = async () => {
    setLoading(true);
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        Alert.alert('错误', '请先登录');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/push/test/lunch-reminder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        Alert.alert('成功', '午餐提醒推送已触发');
        loadStatistics();
      } else {
        Alert.alert('错误', '触发推送失败');
      }
    } catch (error) {
      console.error('测试午餐提醒失败:', error);
      Alert.alert('错误', '网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const testDinnerReminder = async () => {
    setLoading(true);
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        Alert.alert('错误', '请先登录');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/push/test/dinner-reminder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        Alert.alert('成功', '晚餐提醒推送已触发');
        loadStatistics();
      } else {
        Alert.alert('错误', '触发推送失败');
      }
    } catch (error) {
      console.error('测试晚餐提醒失败:', error);
      Alert.alert('错误', '网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const reinitializePush = async () => {
    setLoading(true);
    try {
      await pushService.initialize();
      loadPushToken();
      Alert.alert('成功', '推送服务重新初始化完成');
    } catch (error) {
      console.error('重新初始化推送服务失败:', error);
      Alert.alert('错误', '重新初始化失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>推送功能测试</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>推送Token状态</Text>
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenLabel}>Token:</Text>
            <Text style={styles.tokenText}>
              {pushToken ? `${pushToken.substring(0, 20)}...` : '未获取'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={reinitializePush}
            disabled={loading}
          >
            <Text style={styles.buttonText}>重新初始化推送</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>推送测试</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={testLunchReminder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>测试午餐提醒</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testDinnerReminder}
            disabled={loading}
          >
            <Text style={styles.buttonText}>测试晚餐提醒</Text>
          </TouchableOpacity>
        </View>

        {statistics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>推送统计</Text>
            <View style={styles.statisticsContainer}>
              <Text style={styles.statisticsText}>
                总推送数: {statistics.total || 0}
              </Text>
              <Text style={styles.statisticsText}>
                成功数: {statistics.success || 0}
              </Text>
              <Text style={styles.statisticsText}>
                失败数: {statistics.failed || 0}
              </Text>
              <Text style={styles.statisticsText}>
                成功率: {((statistics.successRate || 0) * 100).toFixed(1)}%
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadStatistics}
            >
              <Text style={styles.refreshButtonText}>刷新统计</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>使用说明</Text>
          <Text style={styles.instructionText}>
            1. 确保已登录并获取到推送Token{'\n'}
            2. 点击测试按钮触发推送{'\n'}
            3. 查看设备是否收到推送通知{'\n'}
            4. 检查推送统计信息
          </Text>
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tokenContainer: {
    marginBottom: 12,
  },
  tokenLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statisticsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statisticsText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  refreshButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
