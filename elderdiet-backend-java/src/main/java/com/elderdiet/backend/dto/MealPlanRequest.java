package com.elderdiet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

/**
 * 膳食计划请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealPlanRequest {

    @NotNull(message = "计划日期不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate planDate;

    // 可选：指定偏好
    private List<String> preferredIngredients; // 偏好食材
    private List<String> avoidIngredients; // 避免食材
    private String specialRequirements; // 特殊要求

    // 可选：餐次偏好
    private String breakfastPreference; // 早餐偏好
    private String lunchPreference; // 午餐偏好
    private String dinnerPreference; // 晚餐偏好
}