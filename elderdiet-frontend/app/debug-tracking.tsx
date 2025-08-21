import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { trackingService } from '@/services/trackingService';

export default function DebugTrackingScreen() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log('DEBUG:', logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    addLog('页面加载完成，开始调试');
    
    // 测试trackingService是否正确初始化
    try {
      addLog('trackingService对象: ' + (trackingService ? '存在' : '不存在'));
      
      if (trackingService) {
        addLog('trackingService方法检查:');
        addLog('- trackEvent: ' + (typeof trackingService.trackEvent === 'function' ? '存在' : '不存在'));
        addLog('- trackFeatureEvent: ' + (typeof trackingService.trackFeatureEvent === 'function' ? '存在' : '不存在'));
        addLog('- getCurrentSession: ' + (typeof trackingService.getCurrentSession === 'function' ? '存在' : '不存在'));
        
        // 检查配置
        const config = (trackingService as any).getConfig?.();
        if (config) {
          addLog('配置: ' + JSON.stringify(config));
        }
        
        // 检查设备信息
        const deviceInfo = (trackingService as any).getDeviceInfo?.();
        if (deviceInfo) {
          addLog('设备信息: ' + JSON.stringify(deviceInfo));
        }
        
        // 检查会话
        const session = trackingService.getCurrentSession();
        addLog('当前会话: ' + (session ? session.sessionId : '无'));
        
        // 检查队列长度
        const queueLength = (trackingService as any).getQueueLength?.();
        addLog('队列长度: ' + queueLength);
        
        // 检查是否启用
        addLog('有活跃会话: ' + trackingService.hasActiveSession());
      }
      
    } catch (error) {
      addLog('初始化检查失败: ' + (error as Error).message);
    }
  }, []);

  const testDirectTrackEvent = () => {
    addLog('开始测试直接调用trackEvent...');
    try {
      trackingService.trackEvent('TEST', 'direct_call', { test: true }, 'success');
      addLog('✅ trackEvent调用完成');
    } catch (error) {
      addLog('❌ trackEvent调用失败: ' + (error as Error).message);
    }
  };

  const testFeatureEvent = () => {
    addLog('开始测试trackFeatureEvent...');
    try {
      trackingService.trackFeatureEvent('test_feature', { timestamp: Date.now() });
      addLog('✅ trackFeatureEvent调用完成');
    } catch (error) {
      addLog('❌ trackFeatureEvent调用失败: ' + (error as Error).message);
    }
  };

  const testAuthEvent = () => {
    addLog('开始测试trackAuthEvent...');
    try {
      trackingService.trackAuthEvent('test_auth', 'success');
      addLog('✅ trackAuthEvent调用完成');
    } catch (error) {
      addLog('❌ trackAuthEvent调用失败: ' + (error as Error).message);
    }
  };

  const testInteractionEvent = () => {
    addLog('开始测试trackInteractionEvent...');
    try {
      trackingService.trackInteractionEvent('test_interaction', { button: 'debug' });
      addLog('✅ trackInteractionEvent调用完成');
    } catch (error) {
      addLog('❌ trackInteractionEvent调用失败: ' + (error as Error).message);
    }
  };

  const testTabSwitch = () => {
    addLog('开始测试trackTabSwitch...');
    try {
      trackingService.trackTabSwitch('debug', 'home');
      addLog('✅ trackTabSwitch调用完成');
    } catch (error) {
      addLog('❌ trackTabSwitch调用失败: ' + (error as Error).message);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const forceFlush = () => {
    addLog('尝试强制刷新事件队列...');
    try {
      // 通过多次调用来达到批量大小
      for (let i = 0; i < 6; i++) {
        trackingService.trackEvent('FORCE_FLUSH', `batch_event_${i}`, { index: i });
      }
      addLog('✅ 已添加6个事件，应该触发批量发送');
    } catch (error) {
      addLog('❌ 强制刷新失败: ' + (error as Error).message);
    }
  };

  const manualFlush = async () => {
    addLog('尝试手动刷新...');
    try {
      const result = await (trackingService as any).manualFlush?.();
      addLog('手动刷新结果: ' + (result ? '成功' : '失败'));
    } catch (error) {
      addLog('❌ 手动刷新异常: ' + (error as Error).message);
    }
  };

  const refreshStatus = () => {
    addLog('刷新状态信息...');
    try {
      const queueLength = (trackingService as any).getQueueLength?.();
      const session = trackingService.getCurrentSession();
      const hasSession = trackingService.hasActiveSession();
      
      addLog('当前队列长度: ' + queueLength);
      addLog('当前会话: ' + (session ? session.sessionId : '无'));
      addLog('有活跃会话: ' + hasSession);
    } catch (error) {
      addLog('❌ 刷新状态失败: ' + (error as Error).message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TrackingService 调试页面</Text>
        <Text style={styles.subtitle}>测试各个埋点方法</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testDirectTrackEvent}>
          <Text style={styles.buttonText}>测试 trackEvent</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testFeatureEvent}>
          <Text style={styles.buttonText}>测试 trackFeatureEvent</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testAuthEvent}>
          <Text style={styles.buttonText}>测试 trackAuthEvent</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testInteractionEvent}>
          <Text style={styles.buttonText}>测试 trackInteractionEvent</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testTabSwitch}>
          <Text style={styles.buttonText}>测试 trackTabSwitch</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#FF5722' }]} onPress={forceFlush}>
          <Text style={styles.buttonText}>强制批量发送</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#3F51B5' }]} onPress={manualFlush}>
          <Text style={styles.buttonText}>手动刷新</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#009688' }]} onPress={refreshStatus}>
          <Text style={styles.buttonText}>刷新状态</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#607D8B' }]} onPress={clearLogs}>
          <Text style={styles.buttonText}>清空日志</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>调试日志:</Text>
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
  },
  buttonContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logsContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 15,
    borderRadius: 5,
    maxHeight: 400,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  logText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
}); 