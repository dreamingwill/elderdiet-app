package com.elderdiet.backend.dto;

import com.elderdiet.backend.entity.Meal;
import com.elderdiet.backend.entity.MealPlan;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 膳食计划响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealPlanResponse {

    private String id;
    private String userId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate planDate;

    private Meal breakfast;
    private Meal lunch;
    private Meal dinner;

    private String generatedReason;
    private String status;
    private Boolean liked;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    /**
     * 从实体转换为DTO
     */
    public static MealPlanResponse fromEntity(MealPlan mealPlan) {
        return MealPlanResponse.builder()
                .id(mealPlan.getId())
                .userId(mealPlan.getUserId())
                .planDate(mealPlan.getPlanDate())
                .breakfast(mealPlan.getBreakfast())
                .lunch(mealPlan.getLunch())
                .dinner(mealPlan.getDinner())
                .generatedReason(mealPlan.getGeneratedReason())
                .status(mealPlan.getStatus())
                .liked(mealPlan.getLiked())
                .createdAt(mealPlan.getCreatedAt())
                .updatedAt(mealPlan.getUpdatedAt())
                .build();
    }
}