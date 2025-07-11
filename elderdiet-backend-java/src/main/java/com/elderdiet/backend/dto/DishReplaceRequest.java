package com.elderdiet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

/**
 * 菜品更换请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DishReplaceRequest {

    @NotBlank(message = "膳食计划ID不能为空")
    private String mealPlanId;

    @NotBlank(message = "餐次类型不能为空")
    private String mealType; // breakfast, lunch, dinner

    @NotNull(message = "菜品索引不能为空")
    @Min(value = 0, message = "菜品索引不能小于0")
    private Integer dishIndex; // 要替换的菜品在餐次中的索引

    private String preferredIngredient; // 偏好食材
    private String avoidIngredient; // 避免食材
    private String specialRequirement; // 特殊要求
    private String replaceReason; // 更换原因
}