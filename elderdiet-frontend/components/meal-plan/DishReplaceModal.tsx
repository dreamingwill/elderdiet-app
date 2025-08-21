import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { trackingService } from '@/services/trackingService';

interface DishReplaceModalProps {
  visible: boolean;
  dishName: string;
  onClose: () => void;
  onConfirm: (preferences: {
    preferred_ingredient?: string;
    avoid_ingredient?: string;
    special_requirement?: string;
  }) => Promise<void>;
}

const DishReplaceModal: React.FC<DishReplaceModalProps> = ({
  visible,
  dishName,
  onClose,
  onConfirm,
}) => {
  const [preferredIngredient, setPreferredIngredient] = useState('');
  const [avoidIngredient, setAvoidIngredient] = useState('');
  const [specialRequirement, setSpecialRequirement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const preferences = {
        ...(preferredIngredient.trim() && { preferred_ingredient: preferredIngredient.trim() }),
        ...(avoidIngredient.trim() && { avoid_ingredient: avoidIngredient.trim() }),
        ...(specialRequirement.trim() && { special_requirement: specialRequirement.trim() }),
      };
      
      await onConfirm(preferences);
      handleClose();
    } catch (error) {
      console.error('Replace dish failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // 追踪模态框关闭事件
    trackingService.trackInteractionEvent('button_click', {
      buttonName: 'close_replace_modal',
      dishName,
      action: 'cancel',
    });
    
    setPreferredIngredient('');
    setAvoidIngredient('');
    setSpecialRequirement('');
    setIsSubmitting(false);
    onClose();
  };

  const handleSkip = async () => {
    // 追踪跳过偏好设置事件
    trackingService.trackInteractionEvent('button_click', {
      buttonName: 'skip_preferences',
      dishName,
      action: 'skip_and_replace',
    });
    
    setIsSubmitting(true);
    try {
      await onConfirm({});
      handleClose();
    } catch (error) {
      console.error('Replace dish failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* 标题 */}
            <View style={styles.header}>
              <Text style={styles.title}>更换菜品偏好</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* 当前菜品 */}
            <View style={styles.currentDishContainer}>
              <Text style={styles.currentDishLabel}>当前菜品：</Text>
              <Text style={styles.currentDishName}>{dishName}</Text>
            </View>

            {/* 输入表单 */}
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>请填写您的偏好（可选）：</Text>

              {/* 偏好食材 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>偏好食材</Text>
                <TextInput
                  style={styles.textInput}
                  value={preferredIngredient}
                  onChangeText={setPreferredIngredient}
                  placeholder="希望新菜品包含的食材..."
                  placeholderTextColor="#999"
                  multiline
                  maxLength={100}
                />
              </View>

              {/* 避免食材 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>避免食材</Text>
                <TextInput
                  style={styles.textInput}
                  value={avoidIngredient}
                  onChangeText={setAvoidIngredient}
                  placeholder="希望避免的食材或口味..."
                  placeholderTextColor="#999"
                  multiline
                  maxLength={100}
                />
              </View>

              {/* 特殊要求 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>特殊要求</Text>
                <TextInput
                  style={styles.textInput}
                  value={specialRequirement}
                  onChangeText={setSpecialRequirement}
                  placeholder="例如：清淡一些、营养丰富、易消化"
                  placeholderTextColor="#999"
                  multiline
                  maxLength={150}
                />
              </View>
            </View>

            {/* 按钮组 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.skipButton]}
                onPress={handleSkip}
                disabled={isSubmitting}
              >
                <Text style={styles.skipButtonText}>跳过</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}
                disabled={isSubmitting}
              >
                <Text style={styles.confirmButtonText}>
                  {isSubmitting ? '更换中...' : '确认更换'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  currentDishContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  currentDishLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  currentDishName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  formContainer: {
    paddingVertical: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 44,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#007bff',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default DishReplaceModal; 