import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';

// 模拟的老人健康详情数据
const mockElderDetails = {
  name: '张爷爷',
  age: 72,
  height: 168,
  weight: 65,
  bloodPressure: '125/85',
  bloodSugar: '5.6',
  conditions: ['高血压', '轻度糖尿病'],
  dietaryRestrictions: ['低盐', '低糖'],
  weeklyStats: {
    caloriesAvg: 1800,
    waterAvg: 6.5,
    proteinAvg: 65,
    saltAvg: 4.2,
    sugarAvg: 35,
  },
};

export default function ElderDetailsScreen() {
  const elder = mockElderDetails;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本信息</Text>
        <View style={styles.infoCard}>
          <InfoItem label="姓名" value={elder.name} />
          <InfoItem label="年龄" value={`${elder.age}岁`} />
          <InfoItem label="身高" value={`${elder.height}cm`} />
          <InfoItem label="体重" value={`${elder.weight}kg`} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>健康状况</Text>
        <View style={styles.infoCard}>
          <InfoItem label="血压" value={elder.bloodPressure} />
          <InfoItem label="血糖" value={`${elder.bloodSugar} mmol/L`} />
          
          <Text style={styles.subLabel}>健康状况</Text>
          <View style={styles.tagsContainer}>
            {elder.conditions.map((condition, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{condition}</Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.subLabel}>饮食限制</Text>
          <View style={styles.tagsContainer}>
            {elder.dietaryRestrictions.map((restriction, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{restriction}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>本周饮食数据</Text>
        <View style={styles.infoCard}>
          <InfoItem 
            label="平均热量" 
            value={`${elder.weeklyStats.caloriesAvg} 千卡/天`}
            icon="flame-outline"
            color="#FF9800"
          />
          <InfoItem 
            label="平均饮水" 
            value={`${elder.weeklyStats.waterAvg} 杯/天`}
            icon="water-outline"
            color="#2196F3"
          />
          <InfoItem 
            label="平均蛋白质" 
            value={`${elder.weeklyStats.proteinAvg} 克/天`}
            icon="fitness-outline"
            color="#4CAF50"
          />
          <InfoItem 
            label="平均盐分" 
            value={`${elder.weeklyStats.saltAvg} 克/天`}
            icon="restaurant-outline"
            color="#FF5722"
          />
          <InfoItem 
            label="平均糖分" 
            value={`${elder.weeklyStats.sugarAvg} 克/天`}
            icon="cafe-outline"
            color="#9C27B0"
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <ActionButton 
          icon="chatbubble-outline" 
          label="发送消息" 
          onPress={() => console.log('发送消息')}
        />
        <ActionButton 
          icon="calendar-outline" 
          label="查看日历" 
          onPress={() => console.log('查看日历')}
        />
        <ActionButton 
          icon="call-outline" 
          label="紧急联系" 
          onPress={() => console.log('紧急联系')}
        />
      </View>
    </ScrollView>
  );
}

// 信息项组件
function InfoItem({ label, value, icon, color }: { label: string; value: string; icon?: string; color?: string }) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoLabel}>
        {icon && <Ionicons name={icon as any} size={20} color={color || '#666'} style={styles.infoIcon} />}
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// 操作按钮组件
function ActionButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Ionicons name={icon as any} size={24} color="#4CAF50" />
      <Text style={styles.actionButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabelText: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  subLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
  },
  actionButtonLabel: {
    marginTop: 5,
    fontSize: 14,
    color: '#4CAF50',
  },
}); 