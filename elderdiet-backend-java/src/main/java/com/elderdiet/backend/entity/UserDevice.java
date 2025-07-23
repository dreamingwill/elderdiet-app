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
import org.springframework.data.mongodb.core.index.CompoundIndex;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * 用户设备实体类
 * 用于存储用户设备的推送Token信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "user_devices")
@CompoundIndex(def = "{'userId': 1, 'deviceToken': 1}", unique = true)
public class UserDevice {

    @Id
    private String id;

    @NotBlank(message = "用户ID不能为空")
    @Indexed
    private String userId;

    @NotBlank(message = "设备Token不能为空")
    @Indexed
    private String deviceToken; // JPush Registration ID

    @NotNull(message = "平台类型不能为空")
    @Field(targetType = FieldType.STRING)
    private DevicePlatform platform; // "ANDROID" 或 "IOS"

    @Builder.Default
    private Boolean pushEnabled = true; // 是否启用推送

    @Builder.Default
    private Boolean mealRecordPushEnabled = true; // 膳食记录推送

    @Builder.Default
    private Boolean reminderPushEnabled = true; // 定时提醒推送

    private String deviceModel; // 设备型号

    private String appVersion; // 应用版本

    private LocalDateTime lastActiveAt; // 最后活跃时间

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * 设备平台枚举
     */
    public enum DevicePlatform {
        ANDROID,
        IOS
    }

    /**
     * 更新最后活跃时间
     */
    public void updateLastActiveTime() {
        this.lastActiveAt = LocalDateTime.now();
    }

    /**
     * 检查是否可以接收推送
     */
    public boolean canReceivePush() {
        return pushEnabled != null && pushEnabled;
    }

    /**
     * 检查是否可以接收膳食记录推送
     */
    public boolean canReceiveMealRecordPush() {
        return canReceivePush() && mealRecordPushEnabled != null && mealRecordPushEnabled;
    }

    /**
     * 检查是否可以接收提醒推送
     */
    public boolean canReceiveReminderPush() {
        return canReceivePush() && reminderPushEnabled != null && reminderPushEnabled;
    }
}
