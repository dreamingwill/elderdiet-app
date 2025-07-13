package com.elderdiet.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;

import java.time.LocalDateTime;

/**
 * 膳食记录点赞实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "record_likes")
@CompoundIndex(def = "{'recordId': 1, 'userId': 1}", unique = true)
public class RecordLike {

    @Id
    private String id;

    @Indexed
    private String recordId; // 膳食记录ID

    @Indexed
    private String userId; // 点赞用户ID

    @CreatedDate
    private LocalDateTime createdAt;
}