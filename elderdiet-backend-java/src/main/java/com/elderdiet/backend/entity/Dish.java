package com.elderdiet.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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

    @NotBlank(message = "推荐理由不能为空")
    @Size(max = 500, message = "推荐理由不能超过500字符")
    private String recommendationReason; // 针对用户健康状况的推荐理由

}