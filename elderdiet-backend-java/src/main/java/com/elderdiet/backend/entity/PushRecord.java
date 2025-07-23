package com.elderdiet.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 推送记录实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "push_records")
public class PushRecord {

    @Id
    private String id;

    @Field(targetType = FieldType.STRING)
    private PushType pushType; // 推送类型

    private String title; // 推送标题

    private String content; // 推送内容

    private List<String> targetUserIds; // 目标用户ID列表

    private List<String> deviceTokens; // 设备Token列表

    @Indexed
    private String relatedEntityId; // 关联实体ID（如膳食记录ID）

    @Field(targetType = FieldType.STRING)
    private PushStatus status; // 推送状态

    private String jpushMessageId; // JPush消息ID

    private Integer targetCount; // 目标设备数量

    private Integer successCount; // 成功推送数量

    private Integer failureCount; // 失败推送数量

    private String errorMessage; // 错误信息

    @CreatedDate
    private LocalDateTime createdAt;

    private LocalDateTime sentAt; // 发送时间

    /**
     * 推送类型枚举
     */
    public enum PushType {
        MEAL_RECORD_NOTIFICATION, // 膳食记录通知
        MEAL_REMINDER,           // 膳食提醒
        SYSTEM_NOTIFICATION      // 系统通知
    }

    /**
     * 推送状态枚举
     */
    public enum PushStatus {
        PENDING,    // 待发送
        SENDING,    // 发送中
        SUCCESS,    // 发送成功
        FAILED,     // 发送失败
        PARTIAL     // 部分成功
    }

    /**
     * 标记为发送中
     */
    public void markAsSending() {
        this.status = PushStatus.SENDING;
        this.sentAt = LocalDateTime.now();
    }

    /**
     * 标记为发送成功
     */
    public void markAsSuccess(String jpushMessageId, int successCount) {
        this.status = PushStatus.SUCCESS;
        this.jpushMessageId = jpushMessageId;
        this.successCount = successCount;
        this.failureCount = 0;
    }

    /**
     * 标记为发送失败
     */
    public void markAsFailed(String errorMessage) {
        this.status = PushStatus.FAILED;
        this.errorMessage = errorMessage;
        this.successCount = 0;
        this.failureCount = this.targetCount;
    }

    /**
     * 标记为部分成功
     */
    public void markAsPartial(String jpushMessageId, int successCount, int failureCount) {
        this.status = PushStatus.PARTIAL;
        this.jpushMessageId = jpushMessageId;
        this.successCount = successCount;
        this.failureCount = failureCount;
    }
}
