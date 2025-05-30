import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';

export default function RoleSelectionScreen() {
  const { role } = useLocalSearchParams();
  const { setRole } = useUser();

  useEffect(() => {
    // 验证角色参数
    if (role !== 'elder' && role !== 'child') {
      router.replace('/');
    }
  }, [role]);

  const handleConfirm = async () => {
    if (role === 'elder' || role === 'child') {
      await setRole(role);
      router.replace('/');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color="#666" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>
          {role === 'elder' ? '老人模式' : '子女监护模式'}
        </Text>

        <View style={styles.imageContainer}>
          <Image 
            source={
              role === 'elder' 
                ? require('@/assets/images/elder-mode.png') 
                : require('@/assets/images/child-mode.png')
            } 
            style={styles.roleImage} 
            resizeMode="contain"
          />
        </View>

        <Text style={styles.description}>
          {role === 'elder' 
            ? '老人模式提供大字体、简洁界面，方便操作，包含饮食记录、健康提醒等功能。' 
            : '子女监护模式可查看老人健康状况、饮食记录，并提供远程关怀功能。'}
        </Text>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>确认选择</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleImage: {
    width: '80%',
    height: '100%',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 