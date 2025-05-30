import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, FoodItem } from '@/data/recipes';

export type MealRecord = {
  id: string;
  date: string;
  mealType: '早餐' | '午餐' | '晚餐' | '加餐';
  recordType: '拍照记录' | '按推荐吃的' | '自定义记录';
  imageUri?: string;
  recipeId?: string;
  customFoods?: {
    foodId: string;
    amount: number;
  }[];
  notes?: string;
  timestamp: number;
};

const STORAGE_KEYS = {
  MEAL_RECORDS: '@meal_records',
  HEALTH_PROFILE: '@health_profile',
  FAVORITE_RECIPES: '@favorite_recipes',
};

export const storage = {
  // 保存饮食记录
  saveMealRecord: async (record: MealRecord) => {
    try {
      const existingRecords = await storage.getMealRecords();
      const updatedRecords = [...existingRecords, record];
      await AsyncStorage.setItem(STORAGE_KEYS.MEAL_RECORDS, JSON.stringify(updatedRecords));
      return true;
    } catch (error) {
      console.error('Error saving meal record:', error);
      return false;
    }
  },

  // 获取所有饮食记录
  getMealRecords: async (): Promise<MealRecord[]> => {
    try {
      const records = await AsyncStorage.getItem(STORAGE_KEYS.MEAL_RECORDS);
      return records ? JSON.parse(records) : [];
    } catch (error) {
      console.error('Error getting meal records:', error);
      return [];
    }
  },

  // 获取指定日期的饮食记录
  getMealRecordsByDate: async (date: string): Promise<MealRecord[]> => {
    try {
      const allRecords = await storage.getMealRecords();
      return allRecords.filter(record => record.date === date);
    } catch (error) {
      console.error('Error getting meal records by date:', error);
      return [];
    }
  },

  // 删除饮食记录
  deleteMealRecord: async (recordId: string): Promise<boolean> => {
    try {
      const records = await storage.getMealRecords();
      const updatedRecords = records.filter(record => record.id !== recordId);
      await AsyncStorage.setItem(STORAGE_KEYS.MEAL_RECORDS, JSON.stringify(updatedRecords));
      return true;
    } catch (error) {
      console.error('Error deleting meal record:', error);
      return false;
    }
  },

  // 保存收藏的食谱
  saveFavoriteRecipe: async (recipeId: string): Promise<boolean> => {
    try {
      const favorites = await storage.getFavoriteRecipes();
      if (!favorites.includes(recipeId)) {
        favorites.push(recipeId);
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_RECIPES, JSON.stringify(favorites));
      }
      return true;
    } catch (error) {
      console.error('Error saving favorite recipe:', error);
      return false;
    }
  },

  // 获取收藏的食谱
  getFavoriteRecipes: async (): Promise<string[]> => {
    try {
      const favorites = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_RECIPES);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error getting favorite recipes:', error);
      return [];
    }
  },

  // 移除收藏的食谱
  removeFavoriteRecipe: async (recipeId: string): Promise<boolean> => {
    try {
      const favorites = await storage.getFavoriteRecipes();
      const updatedFavorites = favorites.filter(id => id !== recipeId);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_RECIPES, JSON.stringify(updatedFavorites));
      return true;
    } catch (error) {
      console.error('Error removing favorite recipe:', error);
      return false;
    }
  },
}; 