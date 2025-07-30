import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { pushService, PushSettings } from '../services/pushService';

interface PushSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PushSettingsModal: React.FC<PushSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const [settings, setSettings] = useState<PushSettings>({
    pushEnabled: true,
    mealRecordPushEnabled: true,
    reminderPushEnabled: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCurrentSettings();
    }
  }, [visible]);

  const loadCurrentSettings = async () => {
    // 这里可以从后端加载当前设置
    // 暂时使用默认值
  };

  const handleSettingChange = async (
    key: keyof PushSettings,
    value: boolean
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // 如果关闭了总开关，同时关闭所有子开关
    if (key === 'pushEnabled' && !value) {
      newSettings.mealRecordPushEnabled = false;
      newSettings.reminderPushEnabled = false;
      setSettings(newSettings);
    }

    // 立即保存到后端
    await saveSettings({ [key]: value });
  };

  const saveSettings = async (partialSettings: Partial<PushSettings>) => {
    setLoading(true);
    try {
      const success = await pushService.updatePushSettings(partialSettings);
      if (!success) {
        Alert.alert('错误', '保存推送设置失败，请重试');
      }
    } catch (error) {
      console.error('保存推送设置失败:', error);
      Alert.alert('错误', '保存推送设置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>推送设置</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>完成</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>启用推送通知</Text>
              <Text style={styles.settingDescription}>
                接收所有推送通知
              </Text>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={(value) => handleSettingChange('pushEnabled', value)}
              disabled={loading}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>膳食记录通知</Text>
              <Text style={styles.settingDescription}>
                当家人分享膳食记录时接收通知
              </Text>
            </View>
            <Switch
              value={settings.mealRecordPushEnabled && settings.pushEnabled}
              onValueChange={(value) => handleSettingChange('mealRecordPushEnabled', value)}
              disabled={loading || !settings.pushEnabled}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>膳食提醒</Text>
              <Text style={styles.settingDescription}>
                在用餐时间接收提醒通知（12:30, 18:30）
              </Text>
            </View>
            <Switch
              value={settings.reminderPushEnabled && settings.pushEnabled}
              onValueChange={(value) => handleSettingChange('reminderPushEnabled', value)}
              disabled={loading || !settings.pushEnabled}
            />
          </View>

          <View style={styles.note}>
            <Text style={styles.noteText}>
              💡 提示：关闭推送通知可能会影响您及时了解家人的膳食情况
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  note: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  noteText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});
