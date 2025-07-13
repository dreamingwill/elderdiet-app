package com.elderdiet.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

/**
 * 膳食记录评论实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "record_comments")
public class RecordComment {

    @Id
    private String id;

    @Indexed
    private String recordId; // 膳食记录ID

    @Indexed
    private String userId; // 评论用户ID

    private String username; // 评论用户名

    private String userAvatar; // 评论用户头像

    private String text; // 评论内容

    @CreatedDate
    private LocalDateTime createdAt;
}