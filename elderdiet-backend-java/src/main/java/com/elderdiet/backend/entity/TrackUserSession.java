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
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * 用户会话追踪实体类
 * 用于记录用户的登录会话信息，包括会话开始、结束时间和设备信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "track_user_sessions")
@CompoundIndexes({
        @CompoundIndex(name = "userId_startTime", def = "{'userId': 1, 'startTime': -1}"),
        @CompoundIndex(name = "userId_isActive", def = "{'userId': 1, 'isActive': 1}")
})
public class TrackUserSession {

    @Id
    private String id;

    @NotBlank(message = "用户ID不能为空")
    @Indexed
    private String userId;

    @NotBlank(message = "会话ID不能为空")
    @Indexed(unique = true)
    private String sessionId;

    @NotNull(message = "会话开始时间不能为空")
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    // 会话持续时长（秒）
    private Long duration;

    // 设备信息
    private String deviceType; // ios, android, web
    private String deviceModel;
    private String osVersion;
    private String appVersion;

    // 网络信息
    private String ipAddress;
    private String userAgent;

    // 会话状态
    @Builder.Default
    private Boolean isActive = true; // 是否为活跃会话

    // 会话结束原因
    private String endReason; // logout, timeout, crash, etc.

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * 计算会话持续时长（秒）
     */
    public Long calculateDuration() {
        if (endTime != null && startTime != null) {
            return java.time.Duration.between(startTime, endTime).getSeconds();
        }
        return null;
    }

    /**
     * 结束会话
     */
    public void endSession(String reason) {
        this.endTime = LocalDateTime.now();
        this.duration = calculateDuration();
        this.isActive = false;
        this.endReason = reason;
    }
}