package com.elderdiet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

/**
 * 健康档案DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileDTO {

    private String id;

    private String userId;

    @NotBlank(message = "姓名不能为空")
    @Size(max = 50, message = "姓名长度不能超过50字符")
    private String name;

    @NotNull(message = "年龄不能为空")
    @Min(value = 0, message = "年龄不能小于0")
    @Max(value = 120, message = "年龄不能大于120")
    private Integer age;

    @NotBlank(message = "性别不能为空")
    @Pattern(regexp = "^(male|female|other)$", message = "性别必须是 male、female 或 other")
    private String gender;

    @NotBlank(message = "居住地区不能为空")
    @Size(max = 100, message = "地区名称不能超过100字符")
    private String region;

    @NotNull(message = "身高不能为空")
    @Min(value = 80, message = "身高不能小于80cm")
    @Max(value = 250, message = "身高不能大于250cm")
    private Double height;

    @NotNull(message = "体重不能为空")
    @Min(value = 30, message = "体重不能小于30kg")
    @Max(value = 200, message = "体重不能大于200kg")
    private Double weight;

    @Builder.Default
    private List<String> chronicConditions = new ArrayList<>();

    @Builder.Default
    private List<String> dietaryPreferences = new ArrayList<>();

    @Size(max = 500, message = "备注不能超过500字符")
    @Builder.Default
    private String notes = "";

    // 头像URL
    private String avatarUrl;

    // 小树成长游戏化字段
    @Builder.Default
    private Integer treeStage = 0; // 树的阶段，0-6

    @Builder.Default
    private Integer wateringProgress = 0; // 浇水进度，0或1

    @Builder.Default
    private Integer completedTrees = 0; // 已完成的树数量

    // 计算字段（不需要验证）
    private Double bmi;
    private String bmiStatus;
    private String bmiStatusLabel;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime updatedAt;
}