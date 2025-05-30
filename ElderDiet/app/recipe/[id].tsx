import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { recipes } from '@/data/recipes';
import { storage } from '@/utils/storage';

export default function RecipeScreen() {
  const { id } = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);
  
  const recipe = recipes.find(r => r.id === id);

  useEffect(() => {
    // 检查是否是收藏的食谱
    const checkFavorite = async () => {
      const favorites = await storage.getFavoriteRecipes();
      setIsFavorite(favorites.includes(id as string));
    };
    checkFavorite();
  }, [id]);

  const handleFavoritePress = async () => {
    try {
      if (isFavorite) {
        await storage.removeFavoriteRecipe(id as string);
        setIsFavorite(false);
      } else {
        await storage.saveFavoriteRecipe(id as string);
        setIsFavorite(true);
      }
    } catch (error) {
      Alert.alert('操作失败', '请重试');
    }
  };

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>未找到该食谱</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: recipe.image }}
        style={styles.headerImage}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{recipe.name}</Text>
          <TouchableOpacity onPress={handleFavoritePress}>
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={28} 
              color={isFavorite ? "#FF4081" : "#666"} 
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.healthBenefits}>{recipe.healthBenefits}</Text>

        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.metaText}>{recipe.duration}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star-outline" size={20} color="#666" />
            <Text style={styles.metaText}>{recipe.difficulty}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="flame-outline" size={20} color="#666" />
            <Text style={styles.metaText}>{recipe.calories}千卡</Text>
          </View>
        </View>

        <View style={styles.suitableContainer}>
          <Text style={styles.suitableTitle}>适合人群：</Text>
          <View style={styles.suitableTags}>
            {recipe.suitable.map((condition, index) => (
              <View key={index} style={styles.suitableTag}>
                <Text style={styles.suitableText}>{condition}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>食材准备</Text>
          {recipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <Text style={styles.ingredientName}>{ingredient.name}</Text>
              <Text style={styles.ingredientAmount}>{ingredient.amount}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>烹饪步骤</Text>
          {recipe.steps.map((step) => (
            <View key={step.id} style={styles.stepItem}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.id}</Text>
                </View>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
              {step.image && (
                <Image
                  source={{ uri: step.image }}
                  style={styles.stepImage}
                  resizeMode="cover"
                />
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.startCookingButton}>
          <Text style={styles.startCookingText}>开始烹饪</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  healthBenefits: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 16,
    color: '#666',
  },
  suitableContainer: {
    marginBottom: 30,
  },
  suitableTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  suitableTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suitableTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suitableText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ingredientName: {
    fontSize: 18,
  },
  ingredientAmount: {
    fontSize: 18,
    color: '#666',
  },
  stepItem: {
    marginBottom: 25,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepDescription: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
  },
  stepImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  startCookingButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  startCookingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 