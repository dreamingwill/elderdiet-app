package com.elderdiet.backend.entity;

/**
 * 慢性疾病枚举
 * 对应Node.js后端的CHRONIC_CONDITIONS常量
 */
public enum ChronicCondition {
    HYPERTENSION("hypertension", "高血压"),
    DIABETES("diabetes", "糖尿病"),
    HEART_DISEASE("heart_disease", "心脏病"),
    ASTHMA("asthma", "哮喘"),
    ARTHRITIS("arthritis", "关节炎"),
    HYPERLIPIDEMIA("hyperlipidemia", "高血脂"),
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