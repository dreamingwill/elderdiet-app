import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { trackingService } from '@/services/trackingService';
import { useAuth } from '@/hooks/useAuth';

export default function TrackingTestScreen() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { token } = useAuth();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    trackingService.startPageVisit('tracking-test', '追踪测试页面', '/tracking-test');
    addLog('页面访问开始');

    return () => {
      trackingService.endPageVisit('navigation');
      addLog('页面访问结束');
    };
  }, []);

  const testStartSession = async () => {
    setIsLoading(true);
    try {
      const success = await trackingService.startSession();
      if (success) {
        const session = trackingService.getCurrentSession();
        setSessionInfo(session);
        addLog('会话开始成功: ' + session?.sessionId);
      } else {
        addLog('会话开始失败');
      }
    } catch (error) {
      addLog('会话开始异常: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const testEndSession = async () => {
    setIsLoading(true);
    try {
      const success = await trackingService.endSession('manual_test');
      if (success) {
        setSessionInfo(null);
        addLog('会话结束成功');
      } else {
        addLog('会话结束失败');
      }
    } catch (error) {
      addLog('会话结束异常: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const testTrackEvent = () => {
    trackingService.trackFeatureEvent('test_button_click', {
      timestamp: Date.now(),
      testData: 'Hello World',
    });
    addLog('追踪事件: test_button_click');
  };

  const testTabSwitch = () => {
    trackingService.trackTabSwitch('profile', 'tracking-test');
    addLog('追踪Tab切换: tracking-test -> profile');
  };

  const testPageVisit = async () => {
    await trackingService.startPageVisit('test-page', '测试页面', '/test');
    addLog('开始测试页面访问');
    
    setTimeout(async () => {
      await trackingService.endPageVisit('test_complete');
      addLog('结束测试页面访问');
    }, 2000);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getCurrentSessionInfo = () => {
    const session = trackingService.getCurrentSession();
    setSessionInfo(session);
    addLog('获取当前会话信息: ' + (session ? session.sessionId : '无活跃会话'));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>用户追踪功能测试</Text>
        <Text style={styles.subtitle}>
          Token状态: {token ? '已登录' : '未登录'}
        </Text>
        {sessionInfo && (
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>当前会话:</Text>
            <Text style={styles.sessionText}>ID: {sessionInfo.sessionId}</Text>
            <Text style={styles.sessionText}>用户: {sessionInfo.userId}</Text>
            <Text style={styles.sessionText}>设备: {sessionInfo.deviceType}</Text>
            <Text style={styles.sessionText}>活跃: {sessionInfo.isActive ? '是' : '否'}</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#4CAF50' }]}
          onPress={testStartSession}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>开始会话</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#f44336' }]}
          onPress={testEndSession}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>结束会话</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#2196F3' }]}
          onPress={getCurrentSessionInfo}
        >
          <Text style={styles.buttonText}>获取会话信息</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FF9800' }]}
          onPress={testTrackEvent}
        >
          <Text style={styles.buttonText}>追踪功能事件</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#9C27B0' }]}
          onPress={testTabSwitch}
        >
          <Text style={styles.buttonText}>追踪Tab切换</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#607D8B' }]}
          onPress={testPageVisit}
        >
          <Text style={styles.buttonText}>测试页面访问</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#795548' }]}
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>清空日志</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>处理中...</Text>
        </View>
      )}

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>操作日志:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  sessionInfo: {
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  sessionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  buttonContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  logsContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 15,
    borderRadius: 5,
    maxHeight: 300,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  logText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
}); 