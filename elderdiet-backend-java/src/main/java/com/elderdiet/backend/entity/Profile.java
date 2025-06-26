package com.elderdiet.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 健康档案实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "profiles")
public class Profile {
    
    @Id
    private String id;
    
    @NotBlank(message = "用户ID不能为空")
    @Indexed
    private String userId;
    
    @NotBlank(message = "姓名不能为空")
    private String name;
    
    @NotNull(message = "年龄不能为空")
    @Min(value = 1, message = "年龄必须大于0")
    @Max(value = 150, message = "年龄不能超过150")
    private Integer age;
    
    @NotBlank(message = "性别不能为空")
    private String gender; // male, female, other
    
    @NotBlank(message = "地区不能为空")
    private String region;
    
    @NotNull(message = "身高不能为空")
    @Min(value = 50, message = "身高必须大于50cm")
    @Max(value = 250, message = "身高不能超过250cm")
    private Integer height; // 单位: cm
    
    @NotNull(message = "体重不能为空")
    @Min(value = 20, message = "体重必须大于20kg")
    @Max(value = 300, message = "体重不能超过300kg")
    private Integer weight; // 单位: kg
    
    private List<String> chronicConditions; // 慢性疾病
    
    private List<String> dietaryPreferences; // 饮食偏好
    
    private String notes; // 备注
    
    private Double bmi; // BMI值，自动计算
    
    private String bmiStatus; // BMI状态，自动计算
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    /**
     * 计算BMI值
     */
    public void calculateBmi() {
        if (height != null && weight != null && height > 0) {
            double heightInMeters = height / 100.0;
            this.bmi = Math.round(weight / (heightInMeters * heightInMeters) * 10.0) / 10.0;
            this.bmiStatus = getBmiStatus(this.bmi);
        }
    }
    
    /**
     * 根据BMI值获取状态
     */
    private String getBmiStatus(double bmi) {
        if (bmi < 18.5) {
            return "偏瘦";
        } else if (bmi < 24) {
            return "正常";
        } else if (bmi < 28) {
            return "偏胖";
        } else {
            return "肥胖";
        }
    }
} 