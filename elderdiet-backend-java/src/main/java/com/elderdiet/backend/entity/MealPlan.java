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
import org.springframework.data.mongodb.core.index.CompoundIndex;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 膳食计划实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "meal_plans")
public class MealPlan {

    @Id
    private String id;

    @NotBlank(message = "用户ID不能为空")
    @Indexed
    private String userId;

    @NotNull(message = "计划日期不能为空")
    @Indexed
    private LocalDate planDate;

    @NotNull(message = "早餐不能为空")
    private Meal breakfast;

    @NotNull(message = "午餐不能为空")
    private Meal lunch;

    @NotNull(message = "晚餐不能为空")
    private Meal dinner;

    @NotBlank(message = "整体推荐理由不能为空")
    @Size(max = 800, message = "整体推荐理由不能超过800字符")
    private String generatedReason; // 整体推荐理由

    @Builder.Default
    private String status = "active"; // 状态: active, archived

    @Builder.Default
    private Boolean liked = false; // 用户是否喜欢这个计划

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * 获取指定餐次的膳食
     */
    public Meal getMealByType(String mealType) {
        switch (mealType.toLowerCase()) {
            case "breakfast":
                return breakfast;
            case "lunch":
                return lunch;
            case "dinner":
                return dinner;
            default:
                throw new IllegalArgumentException("无效的餐次类型: " + mealType);
        }
    }

    /**
     * 更新指定餐次的膳食
     */
    public void updateMealByType(String mealType, Meal meal) {
        switch (mealType.toLowerCase()) {
            case "breakfast":
                this.breakfast = meal;
                break;
            case "lunch":
                this.lunch = meal;
                break;
            case "dinner":
                this.dinner = meal;
                break;
            default:
                throw new IllegalArgumentException("无效的餐次类型: " + mealType);
        }

    }

    /**
     * 检查是否为今天的计划
     */
    public boolean isToday() {
        return LocalDate.now().equals(planDate);
    }

    /**
     * 获取计划状态的中文描述
     */
    public String getStatusLabel() {
        switch (status) {
            case "active":
                return "活跃";
            case "archived":
                return "已归档";
            default:
                return status;
        }
    }

    /**
     * 切换喜欢状态
     */
    public void toggleLike() {
        this.liked = !this.liked;
    }

    /**
     * 设置喜欢状态
     */
    public void setLiked(boolean liked) {
        this.liked = liked;
    }

    /**
     * 检查是否被喜欢
     */
    public boolean isLiked() {
        return liked != null && liked;
    }
}