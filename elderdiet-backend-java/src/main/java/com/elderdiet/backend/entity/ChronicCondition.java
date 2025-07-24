package com.elderdiet.backend.entity;

/**
 * 慢性疾病枚举
 * 涵盖老年人常见的各类慢性疾病
 */
public enum ChronicCondition {
    // 心血管系统疾病
    HYPERTENSION("hypertension", "高血压"),
    HEART_DISEASE("heart_disease", "心脏病"),
    CORONARY_HEART_DISEASE("coronary_heart_disease", "冠心病"),
    ARRHYTHMIA("arrhythmia", "心律不齐"),
    HEART_FAILURE("heart_failure", "心力衰竭"),
    HYPERLIPIDEMIA("hyperlipidemia", "高血脂"),
    ATHEROSCLEROSIS("atherosclerosis", "动脉硬化"),

    // 内分泌代谢系统疾病
    DIABETES("diabetes", "糖尿病"),
    TYPE_2_DIABETES("type_2_diabetes", "2型糖尿病"),
    THYROID_DISEASE("thyroid_disease", "甲状腺疾病"),
    HYPERTHYROIDISM("hyperthyroidism", "甲亢"),
    HYPOTHYROIDISM("hypothyroidism", "甲减"),
    GOUT("gout", "痛风"),
    OBESITY("obesity", "肥胖症"),

    // 呼吸系统疾病
    ASTHMA("asthma", "哮喘"),
    COPD("copd", "慢性阻塞性肺病"),
    CHRONIC_BRONCHITIS("chronic_bronchitis", "慢性支气管炎"),
    PULMONARY_EMPHYSEMA("pulmonary_emphysema", "肺气肿"),

    // 消化系统疾病
    GASTRITIS("gastritis", "慢性胃炎"),
    PEPTIC_ULCER("peptic_ulcer", "消化性溃疡"),
    GASTROESOPHAGEAL_REFLUX("gastroesophageal_reflux", "胃食管反流病"),
    CHRONIC_HEPATITIS("chronic_hepatitis", "慢性肝炎"),
    FATTY_LIVER("fatty_liver", "脂肪肝"),
    GALLSTONES("gallstones", "胆结石"),
    CHRONIC_CONSTIPATION("chronic_constipation", "慢性便秘"),

    // 骨骼肌肉系统疾病
    ARTHRITIS("arthritis", "关节炎"),
    RHEUMATOID_ARTHRITIS("rheumatoid_arthritis", "类风湿性关节炎"),
    OSTEOARTHRITIS("osteoarthritis", "骨关节炎"),
    OSTEOPOROSIS("osteoporosis", "骨质疏松症"),
    LUMBAR_DISC_HERNIATION("lumbar_disc_herniation", "腰椎间盘突出"),
    CERVICAL_SPONDYLOSIS("cervical_spondylosis", "颈椎病"),

    // 神经系统疾病
    STROKE("stroke", "脑卒中"),
    CEREBRAL_INFARCTION("cerebral_infarction", "脑梗塞"),
    CEREBRAL_HEMORRHAGE("cerebral_hemorrhage", "脑出血"),
    PARKINSONS_DISEASE("parkinsons_disease", "帕金森病"),
    ALZHEIMERS_DISEASE("alzheimers_disease", "阿尔茨海默病"),
    DEMENTIA("dementia", "痴呆症"),
    MIGRAINE("migraine", "偏头痛"),

    // 泌尿生殖系统疾病
    CHRONIC_KIDNEY_DISEASE("chronic_kidney_disease", "慢性肾病"),
    KIDNEY_STONES("kidney_stones", "肾结石"),
    BENIGN_PROSTATIC_HYPERPLASIA("benign_prostatic_hyperplasia", "前列腺增生"),
    URINARY_INCONTINENCE("urinary_incontinence", "尿失禁"),

    // 眼科疾病
    CATARACT("cataract", "白内障"),
    GLAUCOMA("glaucoma", "青光眼"),
    MACULAR_DEGENERATION("macular_degeneration", "黄斑变性"),
    DIABETIC_RETINOPATHY("diabetic_retinopathy", "糖尿病视网膜病变"),

    // 耳鼻喉科疾病
    HEARING_LOSS("hearing_loss", "听力下降"),
    TINNITUS("tinnitus", "耳鸣"),
    CHRONIC_SINUSITIS("chronic_sinusitis", "慢性鼻窦炎"),

    // 皮肤疾病
    CHRONIC_ECZEMA("chronic_eczema", "慢性湿疹"),
    PSORIASIS("psoriasis", "银屑病"),

    // 血液系统疾病
    ANEMIA("anemia", "贫血"),
    IRON_DEFICIENCY_ANEMIA("iron_deficiency_anemia", "缺铁性贫血"),

    // 精神心理疾病
    DEPRESSION("depression", "抑郁症"),
    ANXIETY_DISORDER("anxiety_disorder", "焦虑症"),
    INSOMNIA("insomnia", "失眠症"),

    // 肿瘤疾病
    CANCER_HISTORY("cancer_history", "肿瘤病史"),
    BENIGN_TUMOR("benign_tumor", "良性肿瘤"),

    // 其他
    OTHERS("others", "其他");

    private final String value;
    private final String label;

    ChronicCondition(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    /**
     * 根据值获取枚举
     */
    public static ChronicCondition fromValue(String value) {
        for (ChronicCondition condition : values()) {
            if (condition.value.equals(value)) {
                return condition;
            }
        }
        throw new IllegalArgumentException("Unknown chronic condition: " + value);
    }

    /**
     * 获取所有慢性疾病选项
     */
    public static ChronicCondition[] getAllConditions() {
        return values();
    }
}