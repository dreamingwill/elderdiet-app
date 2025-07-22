package com.elderdiet.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 膳食记录实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "meal_records")
public class MealRecord {

    @Id
    private String id;

    @Indexed
    private String userId; // 发布者用户ID

    private List<String> imageUrls; // 图片URLs列表，支持多张图片

    @Builder.Default
    private String caption = ""; // 文字描述，可为空

    @Field(targetType = FieldType.STRING)
    private RecordVisibility visibility; // 可见性

    @Builder.Default
    private int likesCount = 0; // 点赞数

    @Builder.Default
    private int commentsCount = 0; // 评论数

    // 营养师评论相关字段
    @Builder.Default
    private Boolean shareWithNutritionist = false; // 是否分享给营养师

    private String nutritionistComment; // 营养师评论内容

    private LocalDateTime nutritionistCommentAt; // 营养师评论时间

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}