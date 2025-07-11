import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dish } from '@/services/api';

interface DishItemProps {
  dish: Dish;
  index: number;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  onReplace: (mealType: 'breakfast' | 'lunch' | 'dinner', dishIndex: number) => void;
}

const DishItem: React.FC<DishItemProps> = ({ dish, index, mealType, onReplace }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleReplace = () => {
    onReplace(mealType, index);
  };

  // 如果推荐理由超过80个字符，显示展开按钮
  const shouldShowExpandButton = dish.recommendation_reason.length > 80;
  const displayText = isExpanded || !shouldShowExpandButton 
    ? dish.recommendation_reason 
    : dish.recommendation_reason.substring(0, 80) + '...';

  return (
    <View style={styles.dishItem}>
      <View style={styles.dishInfo}>
        <Text style={styles.dishName}>{dish.name}</Text>
        <TouchableOpacity 
          style={styles.changeButton}
          onPress={handleReplace}
        >
          <Ionicons name="refresh" size={16} color="#666" />
          <Text style={styles.changeButtonText}>更换</Text>
        </TouchableOpacity>
      </View>
      
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
              size={14} 
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dishInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dishName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  changeButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  recommendationContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#495057',
    marginBottom: 8,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  expandButtonText: {
    fontSize: 12,
    color: '#007bff',
    marginRight: 4,
  },
});

export default DishItem; 