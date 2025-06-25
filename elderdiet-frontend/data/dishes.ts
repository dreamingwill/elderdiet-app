// 菜品数据管理文件
export interface Dish {
  id: string;
  name: string;
  imageUrl: string;
  category: '主食' | '菜肴' | '汤品';
  description?: string;
}

// 菜品数据库 - 统一管理所有菜品的名称和图片URL
export const dishDatabase: Record<string, Dish> = {
  // 早餐主食
  'b_staple_001': {
    id: 'b_staple_001',
    name: '全麦面包',
    imageUrl: 'https://i2.chuimg.com/1ed7136f5e81438f9d00d45aa6f86858_1920w_1080h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '主食',
    description: '富含膳食纤维的全麦面包'
  },
  'b_staple_002': {
    id: 'b_staple_002',
    name: '燕麦粥',
    imageUrl: 'https://i2.chuimg.com/10f416bc88c111e6a9a10242ac110002_640w_620h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '主食',
    description: '营养丰富的燕麦粥'
  },
  'b_staple_003': {
    id: 'b_staple_003',
    name: '紫薯',
    imageUrl: 'https://i2.chuimg.com/99ad534a70b34260b5831fab82b538f6_1008w_754h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '主食',
    description: '富含花青素的紫薯'
  },

  // 早餐菜肴
  'b_dish_001': {
    id: 'b_dish_001',
    name: '牛奶燕麦粥',
    imageUrl: 'https://i2.chuimg.com/6751051c99e34be0a11c0aa7467dfd6d_1080w_1920h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '菜肴',
    description: '香浓的牛奶燕麦粥'
  },
  'b_dish_002': {
    id: 'b_dish_002',
    name: '水煮蛋',
    imageUrl: 'https://i2.chuimg.com/cd9be2128b7911e6b87c0242ac110003_1560w_2080h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '菜肴',
    description: '营养丰富的水煮蛋'
  },
  'b_dish_003': {
    id: 'b_dish_003',
    name: '蒸蛋羹',
    imageUrl: 'https://i2.chuimg.com/7a23babe966e4dd1ab540f1fc98858c5_1128w_1504h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '菜肴',
    description: '嫩滑的蒸蛋羹'
  },
  'b_dish_004': {
    id: 'b_dish_004',
    name: '豆浆',
    imageUrl: 'https://i2.chuimg.com/3c2450c7827942d0887f47c0a780fcc0_1280w_1304h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '菜肴',
    description: '香浓的豆浆'
  },

  // 午餐主食
  'l_staple_001': {
    id: 'l_staple_001',
    name: '糙米饭',
    imageUrl: 'https://i2.chuimg.com/fe15f0688b4711e6a9a10242ac110002_2988w_5312h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '主食',
    description: '营养价值高的糙米饭'
  },
  'l_staple_002': {
    id: 'l_staple_002',
    name: '五谷杂粮饭',
    imageUrl: 'https://i2.chuimg.com/6cf19c9e32514293b5ee3bde8578d6b4_1875w_1500h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '主食',
    description: '多种谷物搭配的杂粮饭'
  },
  'l_staple_003': {
    id: 'l_staple_003',
    name: '玉米',
    imageUrl: 'https://i2.chuimg.com/ca3f0ba7959641a49d1ad12ac2c994e7_1632w_1224h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '主食',
    description: '香甜的玉米'
  },

  // 午餐菜肴
  'l_dish_001': {
    id: 'l_dish_001',
    name: '西芹炒虾仁',
    imageUrl: 'https://i2.chuimg.com/659f2e93e9244916ac8428fdc66bbe7d_960w_767h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '菜肴',
    description: '清爽的西芹炒虾仁'
  },
  'l_dish_002': {
    id: 'l_dish_002',
    name: '清炒菠菜',
    imageUrl: 'https://i2.chuimg.com/a770c67b903c457fa42fe09fab1ebe57_1616w_1080h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '菜肴',
    description: '营养丰富的清炒菠菜'
  },
  'l_dish_003': {
    id: 'l_dish_003',
    name: '蒸蛋',
    imageUrl: 'https://i2.chuimg.com/409fa33f36044f9781042b3914f4ad0c_1836w_2448h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '菜肴',
    description: '嫩滑的蒸蛋'
  },

  // 午餐汤品
  'l_soup_001': {
    id: 'l_soup_001',
    name: '冬瓜排骨汤',
    imageUrl: 'https://i2.chuimg.com/a1d0813e86f511e6a9a10242ac110002_600w_800h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '汤品',
    description: '清淡的冬瓜排骨汤'
  },
  'l_soup_002': {
    id: 'l_soup_002',
    name: '紫菜蛋花汤',
    imageUrl: 'https://i2.chuimg.com/c5349462db8e43cc99a65978a111e798_1565w_1175h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '汤品',
    description: '清淡的紫菜蛋花汤'
  },
  'l_soup_003': {
    id: 'l_soup_003',
    name: '银耳莲子汤',
    imageUrl: 'https://i2.chuimg.com/9be465d48ba911e6a9a10242ac110002_1080w_1440h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '汤品',
    description: '滋润的银耳莲子汤'
  },

  // 晚餐主食
  'd_staple_001': {
    id: 'd_staple_001',
    name: '小米粥',
    imageUrl: 'https://i2.chuimg.com/1e5d9cded39d42a99d1c231561d5f156_1280w_960h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '主食',
    description: '养胃的小米粥'
  },
  'd_staple_002': {
    id: 'd_staple_002',
    name: '山药粥',
    imageUrl: 'https://i2.chuimg.com/511f4937846849968f110a0651b17143_1279w_1706h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '主食',
    description: '健脾的山药粥'
  },
  'd_staple_003': {
    id: 'd_staple_003',
    name: '白粥',
    imageUrl: 'https://i2.chuimg.com/69eaebb8877e11e6b87c0242ac110003_700w_525h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '主食',
    description: '清淡的白粥'
  },

  // 晚餐菜肴
  'd_dish_001': {
    id: 'd_dish_001',
    name: '清蒸鲈鱼',
    imageUrl: 'https://i2.chuimg.com/915d38c577054489bbdf72f9dd563421_960w_1280h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '菜肴',
    description: '鲜美的清蒸鲈鱼'
  },
  'd_dish_002': {
    id: 'd_dish_002',
    name: '凉拌黄瓜',
    imageUrl: 'https://i2.chuimg.com/104202f693bf4ed993a6279fba0b1c46_3024w_4030h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '菜肴',
    description: '清爽的凉拌黄瓜'
  },
  'd_dish_003': {
    id: 'd_dish_003',
    name: '蒸蛋羹',
    imageUrl: 'https://i2.chuimg.com/7a23babe966e4dd1ab540f1fc98858c5_1128w_1504h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '菜肴',
    description: '嫩滑的蒸蛋羹'
  },
  'd_dish_004': {
    id: 'd_dish_004',
    name: '清炒时蔬',
    imageUrl: 'https://i2.chuimg.com/da0f114e87f111e6a9a10242ac110002_2592w_1936h.jpg?imageView2/2/w/660/interlace/1/q/75',
    category: '菜肴',
    description: '新鲜的清炒时蔬'
  }
};

// 根据ID获取菜品信息
export const getDishById = (id: string): Dish | null => {
  return dishDatabase[id] || null;
};

// 根据分类获取菜品列表
export const getDishesByCategory = (category: '主食' | '菜肴' | '汤品'): Dish[] => {
  return Object.values(dishDatabase).filter(dish => dish.category === category);
};

// 根据餐次和分类获取菜品列表
export const getDishesByMealAndCategory = (mealType: 'breakfast' | 'lunch' | 'dinner', category: '主食' | '菜肴' | '汤品'): Dish[] => {
  const mealPrefix = mealType === 'breakfast' ? 'b_' : mealType === 'lunch' ? 'l_' : 'd_';
  return Object.values(dishDatabase).filter(dish => 
    dish.id.startsWith(mealPrefix) && dish.category === category
  );
};

// 膳食方案配置
export interface MealPlan {
  mealType: string;
  dishes: Dish[];
  recommendation: {
    title: string;
    details: {
      nutrition: string;
      healthBenefit: string;
      wellness: string;
    };
  };
}

// 默认膳食方案配置 - 使用菜品ID来引用
export const defaultMealPlans: Record<'breakfast' | 'lunch' | 'dinner', {
  mealType: string;
  dishIds: string[];
  recommendation: {
    title: string;
    details: {
      nutrition: string;
      healthBenefit: string;
      wellness: string;
    };
  };
}> = {
  breakfast: {
    mealType: '早餐',
    dishIds: ['b_staple_001', 'b_dish_001', 'b_dish_002'],
    recommendation: {
      title: "开启元气满满的一天",
      details: {
        nutrition: "提供均衡的碳水化合物、优质蛋白质和膳食纤维，确保血糖平稳上升，为大脑和身体提供持久能量。",
        healthBenefit: "燕麦中的β-葡聚糖有助于降低胆固醇，全麦面包富含纤维，促进肠道健康。鸡蛋是优质蛋白质的绝佳来源，有助维持肌肉量。",
        wellness: "温热的燕麦粥有暖胃效果，易于消化，非常适合作为一天的开始，为脾胃提供温和的滋养。"
      }
    }
  },
  lunch: {
    mealType: '午餐',
    dishIds: ['l_staple_001', 'l_dish_001', 'l_soup_001'],
    recommendation: {
      title: "活力满满的减压午餐",
      details: {
        nutrition: "本方案通过糙米饭提供优质复合碳水和B族维生素；虾仁富含优质蛋白质和锌元素，西芹则补充了膳食纤维和钾，共同维持肌肉与神经功能。这是一套高蛋白、高纤维、低脂肪的组合。",
        healthBenefit: "西芹和冬瓜均有利尿、降血压的食疗效果，适合血压偏高的长者。虾仁中的虾青素是强大的抗氧化剂，有助于延缓衰老。整体搭配清淡少油，易于消化，能有效减轻肠胃负担。",
        wellness: "冬瓜性凉，可清热解暑；排骨汤补气养血。此搭配在补充营养的同时，兼顾了清热与滋养的平衡，适合夏季或体内有虚热的长者。"
      }
    }
  },
  dinner: {
    mealType: '晚餐',
    dishIds: ['d_staple_001', 'd_dish_001', 'd_dish_002'],
    recommendation: {
      title: "安神助眠的轻盈晚餐",
      details: {
        nutrition: "以易消化的小米粥作为主食，搭配富含Omega-3的鲈鱼和清爽的黄瓜。此组合热量较低，蛋白质优质，不会给夜间休息带来负担。",
        healthBenefit: "鲈鱼中的DHA对大脑健康有益，且易于消化吸收。小米含有色氨酸，能在体内转化为褪黑素，有助改善睡眠质量。黄瓜补充水分和维生素。",
        wellness: "小米有安神健胃的功效，是中医推荐的晚间食疗佳品。清蒸的烹饪方式保留了食材原味，避免了油腻，符合夜间阳气内收的养生之道。"
      }
    }
  }
};

// 备选菜品配置 - 按餐次和分类组织
export const alternativeDishIds: Record<'breakfast' | 'lunch' | 'dinner', Record<string, string[]>> = {
  breakfast: {
    staple: ['b_staple_002', 'b_staple_003'],
    dish: ['b_dish_003', 'b_dish_004']
  },
  lunch: {
    staple: ['l_staple_002', 'l_staple_003'],
    dish: ['l_dish_002', 'l_dish_003'],
    soup: ['l_soup_002', 'l_soup_003']
  },
  dinner: {
    staple: ['d_staple_002', 'd_staple_003'],
    dish: ['d_dish_003', 'd_dish_004']
  }
};

// 构建完整的膳食方案
export const buildMealPlan = (mealType: 'breakfast' | 'lunch' | 'dinner'): MealPlan => {
  const config = defaultMealPlans[mealType];
  const dishes = config.dishIds.map(id => getDishById(id)).filter(dish => dish !== null) as Dish[];
  
  return {
    mealType: config.mealType,
    dishes,
    recommendation: config.recommendation
  };
};

// 获取备选菜品
export const getAlternativeDishes = (mealType: 'breakfast' | 'lunch' | 'dinner', category: string): Dish[] => {
  const categoryKey = category === '主食' ? 'staple' : category === '菜肴' ? 'dish' : 'soup';
  const dishIds = alternativeDishIds[mealType][categoryKey] || [];
  return dishIds.map(id => getDishById(id)).filter(dish => dish !== null) as Dish[];
}; 