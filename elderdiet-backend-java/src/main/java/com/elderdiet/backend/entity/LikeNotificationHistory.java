package com.elderdiet.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

/**
 * 点赞通知历史记录实体类
 * 用于记录用户对某个膳食记录的首次点赞通知，避免重复通知
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "like_notification_histories")
@CompoundIndex(def = "{'recordId': 1, 'likerId': 1}", unique = true)
public class LikeNotificationHistory {

    @Id
    private String id;

    @Indexed
    private String recordId; // 膳食记录ID

    @Indexed
    private String likerId; // 点赞者用户ID

    @Indexed
    private String recordOwnerId; // 记录发布者用户ID

    private Boolean notificationSent; // 是否已发送通知

    @CreatedDate
    private LocalDateTime createdAt; // 首次点赞时间

    /**
     * 创建点赞通知历史记录
     */
    public static LikeNotificationHistory create(String recordId, String likerId, String recordOwnerId) {
        return LikeNotificationHistory.builder()
                .recordId(recordId)
                .likerId(likerId)
                .recordOwnerId(recordOwnerId)
                .notificationSent(true)
                .build();
    }
}
