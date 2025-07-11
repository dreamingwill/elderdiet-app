package com.elderdiet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 膳食计划喜欢操作请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealPlanLikeRequest {

    @NotBlank(message = "膳食计划ID不能为空")
    private String mealPlanId;

    @NotNull(message = "喜欢状态不能为空")
    private Boolean liked; // true表示喜欢，false表示取消喜欢
}