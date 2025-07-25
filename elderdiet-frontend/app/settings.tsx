import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PushSettingsModal } from '@/components/PushSettingsModal';

export default function SettingsScreen() {
  const [pushSettingsVisible, setPushSettingsVisible] = useState(false);

  const settingsItems = [
    {
      title: '账号管理',
      icon: 'person-outline',
      onPress: () => {
        // 导航到账号管理页面
      }
    },
    {
      title: '推送通知',
      icon: 'notifications-outline',
      onPress: () => {
        setPushSettingsVisible(true);
      }
    },
    {
      title: '隐私设置',
      icon: 'shield-outline',
      onPress: () => {
        // 导航到隐私设置页面
      }
    },
    {
      title: '关于我们',
      icon: 'information-circle-outline',
      onPress: () => {
        // 导航到关于我们页面
      }
    },
    {
      title: '帮助与反馈',
      icon: 'help-circle-outline',
      onPress: () => {
        // 导航到帮助页面
      }
    },
    {
      title: '推送测试',
      icon: 'notifications-circle-outline',
      onPress: () => {
        router.push('/push-test');
      }
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.settingItem}
            onPress={item.onPress}
          >
            <View style={styles.settingItemLeft}>
              <Ionicons name={item.icon as any} size={24} color="#666" />
              <Text style={styles.settingItemText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      <PushSettingsModal
        visible={pushSettingsVisible}
        onClose={() => setPushSettingsVisible(false)}
      />
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
}); 