package com.elderdiet.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.ArrayList;

/**
 * 单餐实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "meals")
public class Meal {

    @NotBlank(message = "餐次类型不能为空")
    private String mealType; // breakfast, lunch, dinner

    @NotNull(message = "菜品列表不能为空")
    @Size(min = 1, message = "至少需要一个菜品")
    @Builder.Default
    private List<Dish> dishes = new ArrayList<>();

    @Size(max = 300, message = "营养摘要不能超过300字符")
    private String nutritionSummary; // 营养摘要

    @Size(max = 200, message = "用餐建议不能超过200字符")
    private String mealTips; // 用餐建议

    /**
     * 获取餐次类型的中文描述
     */
    public String getMealTypeLabel() {
        switch (mealType) {
            case "breakfast":
                return "早餐";
            case "lunch":
                return "午餐";
            case "dinner":
                return "晚餐";
            default:
                return mealType;
        }
    }

    /**
     * 获取菜品数量
     */
    public int getDishCount() {
        return dishes != null ? dishes.size() : 0;
    }
}