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

import java.time.LocalDateTime;

/**
 * 家庭链接实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "family_links")
public class FamilyLink {

    @Id
    private String id;

    @Indexed
    private String parentId; // 老人用户ID

    @Indexed
    private String childId; // 子女用户ID

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}