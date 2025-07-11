package com.elderdiet.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.ArrayList;

/**
 * 菜品实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "dishes")
public class Dish {

    @NotBlank(message = "菜品名称不能为空")
    @Size(max = 100, message = "菜品名称不能超过100字符")
    private String name;

    @Builder.Default
    private List<String> ingredients = new ArrayList<>(); // 食材列表

    @NotBlank(message = "推荐理由不能为空")
    @Size(max = 500, message = "推荐理由不能超过500字符")
    private String recommendationReason; // 针对用户健康状况的推荐理由

    @Size(max = 200, message = "制作说明不能超过200字符")
    private String preparationNotes; // 制作说明

    @Builder.Default
    private List<String> tags = new ArrayList<>(); // 标签: 如"低盐"、"高蛋白"、"易消化"等

    /**
     * 检查是否适合特定健康状况
     */
    public boolean isSuitableForCondition(String condition) {
        if (tags == null)
            return true;

        // 根据慢性病标签判断适宜性
        switch (condition.toLowerCase()) {
            case "diabetes":
                return tags.contains("低糖") || tags.contains("控糖");
            case "hypertension":
                return tags.contains("低盐") || tags.contains("控盐");
            case "hyperlipidemia":
                return tags.contains("低脂") || tags.contains("控脂");
            default:
                return true;
        }
    }
}