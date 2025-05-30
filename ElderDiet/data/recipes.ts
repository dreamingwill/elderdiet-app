export type Recipe = {
  id: string;
  name: string;
  type: '早餐' | '午餐' | '晚餐' | '加餐';
  image: string;
  healthBenefits: string;
  difficulty: '简单' | '适中' | '较难';
  duration: string;
  calories: number;
  suitable: string[];
  ingredients: {
    name: string;
    amount: string;
  }[];
  steps: {
    id: number;
    description: string;
    image?: string;
  }[];
};

export const recipes: Recipe[] = [
  {
    id: '1',
    name: '燕麦牛奶粥',
    type: '早餐',
    image: 'https://s1.ax1x.com/2023/05/15/p9Yq7Vg.jpg',
    healthBenefits: '富含膳食纤维，有助于控制血糖',
    difficulty: '简单',
    duration: '10分钟',
    calories: 250,
    suitable: ['糖尿病', '高血压'],
    ingredients: [
      { name: '燕麦', amount: '50克' },
      { name: '牛奶', amount: '200ml' },
      { name: '红枣', amount: '2-3颗' },
    ],
    steps: [
      { id: 1, description: '将燕麦倒入锅中，加入适量清水', image: 'https://s1.ax1x.com/2023/05/15/p9YqHaQ.jpg' },
      { id: 2, description: '大火煮沸后转小火熬制5分钟', image: 'https://s1.ax1x.com/2023/05/15/p9YqbPs.jpg' },
      { id: 3, description: '加入牛奶继续小火熬制3分钟', image: 'https://s1.ax1x.com/2023/05/15/p9Yqq1g.jpg' },
      { id: 4, description: '放入红枣，继续熬制2分钟即可', image: 'https://s1.ax1x.com/2023/05/15/p9YqLnS.jpg' },
    ],
  },
  {
    id: '2',
    name: '清蒸鲈鱼配时蔬',
    type: '午餐',
    image: 'https://s1.ax1x.com/2023/05/15/p9YqXi8.jpg',
    healthBenefits: '低盐低脂，适合高血压人群',
    difficulty: '适中',
    duration: '20分钟',
    calories: 320,
    suitable: ['高血压', '高血脂'],
    ingredients: [
      { name: '鲈鱼', amount: '1条(约300g)' },
      { name: '生姜', amount: '3片' },
      { name: '葱花', amount: '适量' },
      { name: '西兰花', amount: '100g' },
    ],
    steps: [
      { id: 1, description: '鲈鱼清洗干净，划几刀，放入生姜片', image: 'https://s1.ax1x.com/2023/05/15/p9YqjU0.jpg' },
      { id: 2, description: '放入蒸锅，大火蒸制8-10分钟', image: 'https://s1.ax1x.com/2023/05/15/p9Yqv4K.jpg' },
      { id: 3, description: '西兰花焯水，摆盘', image: 'https://s1.ax1x.com/2023/05/15/p9YqxJS.jpg' },
      { id: 4, description: '撒上葱花即可食用', image: 'https://s1.ax1x.com/2023/05/15/p9YqzLQ.jpg' },
    ],
  },
  {
    id: '3',
    name: '五谷杂粮饭',
    type: '午餐',
    image: 'https://s1.ax1x.com/2023/05/15/p9YqO1g.jpg',
    healthBenefits: '营养均衡，膳食纤维丰富',
    difficulty: '简单',
    duration: '30分钟',
    calories: 280,
    suitable: ['糖尿病', '高血压', '便秘'],
    ingredients: [
      { name: '糙米', amount: '100g' },
      { name: '小米', amount: '30g' },
      { name: '燕麦', amount: '20g' },
      { name: '黑米', amount: '20g' },
      { name: '红豆', amount: '20g' },
    ],
    steps: [
      { id: 1, description: '所有食材提前浸泡2小时', image: 'https://s1.ax1x.com/2023/05/15/p9Yq5rV.jpg' },
      { id: 2, description: '放入电饭煲，加入适量清水', image: 'https://s1.ax1x.com/2023/05/15/p9YqI0J.jpg' },
      { id: 3, description: '选择杂粮模式煮制', image: 'https://s1.ax1x.com/2023/05/15/p9Yq4Hg.jpg' },
    ],
  },
];

// 常见食物数据
export type FoodItem = {
  id: string;
  name: string;
  category: string;
  calories: number;
  unit: string;
  isHealthy: boolean;
  suitableFor: string[];
  unsuitableFor: string[];
};

export const commonFoods: FoodItem[] = [
  {
    id: 'f1',
    name: '白米饭',
    category: '主食',
    calories: 116,
    unit: '碗',
    isHealthy: true,
    suitableFor: ['普通人群'],
    unsuitableFor: ['糖尿病'],
  },
  {
    id: 'f2',
    name: '全麦面包',
    category: '主食',
    calories: 65,
    unit: '片',
    isHealthy: true,
    suitableFor: ['糖尿病', '高血压'],
    unsuitableFor: [],
  },
  {
    id: 'f3',
    name: '清炒青菜',
    category: '蔬菜',
    calories: 30,
    unit: '份',
    isHealthy: true,
    suitableFor: ['所有人群'],
    unsuitableFor: [],
  },
  {
    id: 'f4',
    name: '水煮鱼',
    category: '荤菜',
    calories: 180,
    unit: '份',
    isHealthy: true,
    suitableFor: ['普通人群'],
    unsuitableFor: ['高血压'],
  },
  {
    id: 'f5',
    name: '牛奶',
    category: '饮品',
    calories: 120,
    unit: '杯',
    isHealthy: true,
    suitableFor: ['所有人群'],
    unsuitableFor: ['乳糖不耐'],
  },
]; 