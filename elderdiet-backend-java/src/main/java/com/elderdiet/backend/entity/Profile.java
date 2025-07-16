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
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.time.Instant;
import java.util.List;
import java.util.ArrayList;

/**
 * 健康档案实体类
 * 对应Node.js后端的Profile模型
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
    @Indexed(unique = true, name = "userId_unique_idx") // 每个用户只能有一个健康档案，使用自定义索引名
    private String userId;

    @NotBlank(message = "姓名不能为空")
    @Size(max = 50, message = "姓名长度不能超过50字符")
    private String name;

    @NotNull(message = "年龄不能为空")
    @Min(value = 0, message = "年龄不能小于0")
    @Max(value = 120, message = "年龄不能大于120")
    private Integer age;

    @NotBlank(message = "性别不能为空")
    private String gender; // male, female, other

    @NotBlank(message = "居住地区不能为空")
    @Size(max = 100, message = "地区名称不能超过100字符")
    private String region;

    @NotNull(message = "身高不能为空")
    @Min(value = 80, message = "身高不能小于80cm")
    @Max(value = 250, message = "身高不能大于250cm")
    private Double height; // 单位: cm，改为Double以匹配Node.js

    @NotNull(message = "体重不能为空")
    @Min(value = 30, message = "体重不能小于30kg")
    @Max(value = 200, message = "体重不能大于200kg")
    private Double weight; // 单位: kg，改为Double以匹配Node.js

    @Builder.Default
    private List<String> chronicConditions = new ArrayList<>(); // 慢性疾病

    @Builder.Default
    private List<String> dietaryPreferences = new ArrayList<>(); // 饮食偏好

    @Size(max = 500, message = "备注不能超过500字符")
    @Builder.Default
    private String notes = ""; // 备注

    // 头像URL
    private String avatarUrl;

    // 聊天记录清空时间戳，用于实现"清空"功能而不删除数据
    private Instant chatClearedAt;

    // 小树成长游戏化字段
    @Builder.Default
    private Integer treeStage = 0; // 树的阶段，0-6

    @Builder.Default
    private Integer wateringProgress = 0; // 浇水进度，0或1

    @Builder.Default
    private Integer completedTrees = 0; // 已完成的树数量

    @Builder.Default
    private Integer todayWaterCount = 0; // 今日浇水次数，0-2

    private LocalDateTime lastWaterTime; // 上次浇水时间

    private LocalDateTime waterCountResetTime; // 浇水次数重置时间

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * 计算BMI值（虚拟字段，不存储到数据库）
     */
    public Double getBmi() {
        if (height != null && weight != null && height > 0) {
            double heightInMeters = height / 100.0;
            return Math.round(weight / (heightInMeters * heightInMeters) * 10.0) / 10.0;
        }
        return null;
    }

    /**
     * 获取BMI状态（虚拟字段，不存储到数据库）
     */
    public String getBmiStatus() {
        Double bmi = getBmi();
        if (bmi == null) {
            return null;
        }

        if (bmi < 18.5) {
            return "underweight"; // 偏瘦
        } else if (bmi < 24) {
            return "normal"; // 正常
        } else if (bmi < 28) {
            return "overweight"; // 超重
        } else {
            return "obese"; // 肥胖
        }
    }

    /**
     * 获取BMI状态的中文描述
     */
    public String getBmiStatusLabel() {
        String status = getBmiStatus();
        if (status == null) {
            return null;
        }

        switch (status) {
            case "underweight":
                return "偏瘦";
            case "normal":
                return "正常";
            case "overweight":
                return "超重";
            case "obese":
                return "肥胖";
            default:
                return status;
        }
    }
}