import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dish } from '@/services/api';

interface DishItemProps {
  dish: Dish;
  index: number;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  onReplace: (mealType: 'breakfast' | 'lunch' | 'dinner', dishIndex: number) => Promise<void>;
}

const DishItem: React.FC<DishItemProps> = ({ dish, index, mealType, onReplace }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleReplace = async () => {
    if (isReplacing) return; // 防止重复点击

    setIsReplacing(true);
    try {
      await onReplace(mealType, index);
    } finally {
      setIsReplacing(false);
    }
  };

  // 如果推荐理由超过60个字符，显示展开按钮
  const shouldShowExpandButton = dish.recommendation_reason.length > 32;
  const displayText = isExpanded || !shouldShowExpandButton 
    ? dish.recommendation_reason 
    : dish.recommendation_reason.substring(0, 32) + '...';

  return (
    <View style={styles.dishItem}>
      {/* 菜品名称和更换按钮 */}
      <View style={styles.dishHeader}>
        <Text style={styles.dishName}>{dish.name}</Text>
        <TouchableOpacity
          style={[
            styles.changeButton,
            isReplacing && styles.changeButtonDisabled
          ]}
          onPress={handleReplace}
          disabled={isReplacing}
          testID="replace-button"
        >
          {isReplacing ? (
            <ActivityIndicator size="small" color="#666" testID="loading-indicator" />
          ) : (
            <Ionicons name="refresh" size={18} color="#666" />
          )}
        </TouchableOpacity>
      </View>
      
      {/* 推荐理由 */}
      <View style={styles.recommendationContainer}>
        <Text style={styles.recommendationText}>{displayText}</Text>
        {shouldShowExpandButton && (
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={toggleExpanded}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? '收起' : '展开'}
            </Text>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={12} 
              color="#007bff" 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dishItem: {
    backgroundColor: '#F7F8FA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  dishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dishName: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
  },
  changeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  changeButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#e9ecef',
  },
  recommendationContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 10,
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#495057',
    marginBottom: 4,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  expandButtonText: {
    fontSize: 14,
    color: '#007bff',
    marginRight: 3,
  },
});

export default DishItem; 