import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ProfileCompletenessResult } from '@/services/api';

interface ProfileCompletenessAlertProps {
  completenessResult: ProfileCompletenessResult;
  style?: any;
}

export default function ProfileCompletenessAlert({ 
  completenessResult, 
  style 
}: ProfileCompletenessAlertProps) {
  // 如果档案已完整，不显示提醒
  if (completenessResult.isComplete) {
    return null;
  }

  const handleGoToProfile = () => {
    router.push('/edit-profile');
  };

  const getMissingFieldsText = () => {
    const { missingFields } = completenessResult;
    if (missingFields.length === 0) return '';
    
    if (missingFields.length <= 3) {
      return missingFields.join('、');
    } else {
      return `${missingFields.slice(0, 3).join('、')}等${missingFields.length}项`;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.alertCard}>
        <View style={styles.iconContainer}>
          <Ionicons name="heart-outline" size={24} color="#28a745" />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>💚 完善健康档案，享受专属膳食关怀</Text>
          <Text style={styles.description}>
            您的健康档案已完成 {completenessResult.completionPercentage}%，
            补充{getMissingFieldsText()}信息，让我们为您提供更贴心的营养建议
          </Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleGoToProfile}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>完善档案</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${completenessResult.completionPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {completenessResult.completionPercentage}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 12,
  },
  alertCard: {
    backgroundColor: '#f8fff9',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  contentContainer: {
    paddingRight: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 6,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
});
