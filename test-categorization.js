// 测试慢性疾病分类逻辑

// 慢性疾病分类映射
const CHRONIC_CONDITION_CATEGORIES = {
  '心血管系统': [
    'hypertension', 'heart_disease', 'coronary_heart_disease', 
    'arrhythmia', 'heart_failure', 'hyperlipidemia', 'atherosclerosis'
  ],
  '内分泌代谢': [
    'diabetes', 'type_2_diabetes', 'thyroid_disease', 
    'hyperthyroidism', 'hypothyroidism', 'gout', 'obesity'
  ],
  '呼吸系统': [
    'asthma', 'copd', 'chronic_bronchitis', 'pulmonary_emphysema'
  ],
  '消化系统': [
    'gastritis', 'peptic_ulcer', 'gastroesophageal_reflux', 
    'chronic_hepatitis', 'fatty_liver', 'gallstones', 'chronic_constipation'
  ],
  '骨骼肌肉': [
    'arthritis', 'rheumatoid_arthritis', 'osteoarthritis', 
    'osteoporosis', 'lumbar_disc_herniation', 'cervical_spondylosis'
  ],
  '神经系统': [
    'stroke', 'cerebral_infarction', 'cerebral_hemorrhage', 
    'parkinsons_disease', 'alzheimers_disease', 'dementia', 'migraine'
  ],
  '泌尿生殖': [
    'chronic_kidney_disease', 'kidney_stones', 
    'benign_prostatic_hyperplasia', 'urinary_incontinence'
  ],
  '眼科疾病': [
    'cataract', 'glaucoma', 'macular_degeneration', 'diabetic_retinopathy'
  ],
  '耳鼻喉科': [
    'hearing_loss', 'tinnitus', 'chronic_sinusitis'
  ],
  '皮肤疾病': [
    'chronic_eczema', 'psoriasis'
  ],
  '血液系统': [
    'anemia', 'iron_deficiency_anemia'
  ],
  '精神心理': [
    'depression', 'anxiety_disorder', 'insomnia'
  ],
  '肿瘤疾病': [
    'cancer_history', 'benign_tumor'
  ],
  '其他': [
    'chronic_fatigue_syndrome', 'fibromyalgia', 'others'
  ]
};

// 模拟后端返回的慢性疾病选项
const mockChronicConditionsOptions = [
  { value: 'hypertension', label: '高血压' },
  { value: 'diabetes', label: '糖尿病' },
  { value: 'heart_disease', label: '心脏病' },
  { value: 'asthma', label: '哮喘' },
  { value: 'arthritis', label: '关节炎' },
  { value: 'stroke', label: '脑卒中' },
  { value: 'chronic_kidney_disease', label: '慢性肾病' },
  { value: 'cataract', label: '白内障' },
  { value: 'hearing_loss', label: '听力下降' },
  { value: 'chronic_eczema', label: '慢性湿疹' },
  { value: 'anemia', label: '贫血' },
  { value: 'depression', label: '抑郁症' },
  { value: 'cancer_history', label: '肿瘤病史' },
  { value: 'others', label: '其他' }
];

// 根据分类组织慢性疾病选项
function getCategorizedConditions(chronicConditionsOptions) {
  const categorized = {};
  
  // 初始化所有分类
  Object.keys(CHRONIC_CONDITION_CATEGORIES).forEach(category => {
    categorized[category] = [];
  });

  // 将选项分配到对应分类
  chronicConditionsOptions.forEach(option => {
    let assigned = false;
    for (const [category, values] of Object.entries(CHRONIC_CONDITION_CATEGORIES)) {
      if (values.includes(option.value)) {
        categorized[category].push(option);
        assigned = true;
        break;
      }
    }
    // 如果没有找到对应分类，放入"其他"
    if (!assigned) {
      categorized['其他'].push(option);
    }
  });

  return categorized;
}

// 测试分类功能
console.log('=== 慢性疾病分类测试 ===');
const categorized = getCategorizedConditions(mockChronicConditionsOptions);

Object.entries(categorized).forEach(([category, options]) => {
  if (options.length > 0) {
    console.log(`\n${category}:`);
    options.forEach(option => {
      console.log(`  - ${option.label} (${option.value})`);
    });
  }
});

console.log('\n=== 统计信息 ===');
console.log(`总分类数: ${Object.keys(CHRONIC_CONDITION_CATEGORIES).length}`);
console.log(`总疾病数: ${mockChronicConditionsOptions.length}`);
console.log(`已分类疾病数: ${Object.values(categorized).reduce((sum, arr) => sum + arr.length, 0)}`);
