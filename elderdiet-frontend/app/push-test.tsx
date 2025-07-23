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
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export default function PushTestScreen() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('');

  useEffect(() => {
    loadPushToken();
    loadStatistics();
    loadDeviceInfo();
    checkPermissions();
  }, []);

  const loadPushToken = () => {
    const tokenStatus = pushService.getTokenStatus();
    setPushToken(tokenStatus.token);
    console.log('📱 当前Token状态:', tokenStatus);
  };

  const loadDeviceInfo = () => {
    const info = {
      isDevice: Device.isDevice,
      deviceName: Device.deviceName,
      modelName: Device.modelName,
      brand: Device.brand,
      platform: Device.osName,
      osVersion: Device.osVersion,
    };
    setDeviceInfo(info);
    console.log('📱 设备信息:', info);
  };

  const checkPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      console.log('🔔 推送权限状态:', status);
    } catch (error) {
      console.error('检查权限失败:', error);
    }
  };

  const retryDeviceRegistration = async () => {
    setLoading(true);
    try {
      Alert.alert('🔄 重新注册', '正在重新注册设备...');
      
      await pushService.retryDeviceRegistration();
      
      // 重新加载Token
      setTimeout(() => {
        loadPushToken();
        Alert.alert('✅ 成功', '设备重新注册完成，请检查Token状态');
      }, 2000);
      
    } catch (error) {
      console.error('重新注册失败:', error);
      Alert.alert('❌ 失败', '设备重新注册失败: ' + error);
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.title}>📱 推送功能测试</Text>
        
        {/* 设备信息部分 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 设备信息</Text>
          {deviceInfo && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>设备类型: {deviceInfo.isDevice ? '真实设备' : '模拟器'}</Text>
              <Text style={styles.infoText}>设备名称: {deviceInfo.deviceName || '未知'}</Text>
              <Text style={styles.infoText}>型号: {deviceInfo.modelName || '未知'}</Text>
              <Text style={styles.infoText}>品牌: {deviceInfo.brand || '未知'}</Text>
              <Text style={styles.infoText}>平台: {deviceInfo.platform || '未知'}</Text>
              <Text style={styles.infoText}>系统版本: {deviceInfo.osVersion || '未知'}</Text>
            </View>
          )}
        </View>

        {/* 权限状态 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 推送权限</Text>
          <Text style={[
            styles.statusText,
            permissionStatus === 'granted' ? styles.successText : styles.errorText
          ]}>
            状态: {permissionStatus === 'granted' ? '✅ 已授权' : '❌ 未授权'}
          </Text>
          {permissionStatus !== 'granted' && (
            <Text style={styles.warningText}>
              ⚠️ 需要推送权限才能获取设备Token
            </Text>
          )}
        </View>

        {/* Token状态 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔑 推送Token状态</Text>
          
          {pushToken ? (
            <View style={styles.tokenContainer}>
              <Text style={styles.successText}>✅ Token已获取</Text>
              <Text style={styles.tokenText}>
                {pushToken.substring(0, 40)}...
              </Text>
            </View>
          ) : (
            <View style={styles.tokenContainer}>
              <Text style={styles.errorText}>❌ 未获取到Token</Text>
              {!deviceInfo?.isDevice && (
                <Text style={styles.warningText}>
                  ⚠️ 模拟器无法获取推送Token，请使用真实设备测试
                </Text>
              )}
            </View>
          )}
          
          <TouchableOpacity
            style={styles.button}
            onPress={retryDeviceRegistration}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>🔄 重新注册设备</Text>
            )}
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

        {deviceInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>设备信息</Text>
            <View style={styles.deviceInfoContainer}>
              <Text style={styles.deviceInfoText}>
                设备类型: {deviceInfo.isDevice ? '真机' : '模拟器'}
              </Text>
              <Text style={styles.deviceInfoText}>
                设备名称: {deviceInfo.deviceName}
              </Text>
              <Text style={styles.deviceInfoText}>
                型号: {deviceInfo.modelName}
              </Text>
              <Text style={styles.deviceInfoText}>
                品牌: {deviceInfo.brand}
              </Text>
              <Text style={styles.deviceInfoText}>
                平台: {deviceInfo.platform}
              </Text>
              <Text style={styles.deviceInfoText}>
                操作系统版本: {deviceInfo.osVersion}
              </Text>
            </View>
          </View>
        )}

        {permissionStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>推送权限</Text>
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>
                权限状态: {permissionStatus}
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={checkPermissions}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>检查权限</Text>
                )}
              </TouchableOpacity>
            </View>
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
  deviceInfoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  deviceInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  permissionContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  infoContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  successText: {
    color: '#28a745',
  },
  errorText: {
    color: '#dc3545',
  },
  warningText: {
    fontSize: 14,
    color: '#ffc107',
    marginTop: 8,
  },
});
