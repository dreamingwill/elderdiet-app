package com.elderdiet.backend.dto;

import com.elderdiet.backend.entity.UserDevice;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 用户设备响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDeviceResponse {

    private String id;

    private String deviceToken;

    private UserDevice.DevicePlatform platform;

    private Boolean pushEnabled;

    private Boolean mealRecordPushEnabled;

    private Boolean reminderPushEnabled;

    private String deviceModel;

    private String appVersion;

    private LocalDateTime lastActiveAt;

    private LocalDateTime createdAt;

    /**
     * 从UserDevice实体转换为响应DTO
     */
    public static UserDeviceResponse fromEntity(UserDevice userDevice) {
        return UserDeviceResponse.builder()
                .id(userDevice.getId())
                .deviceToken(userDevice.getDeviceToken())
                .platform(userDevice.getPlatform())
                .pushEnabled(userDevice.getPushEnabled())
                .mealRecordPushEnabled(userDevice.getMealRecordPushEnabled())
                .reminderPushEnabled(userDevice.getReminderPushEnabled())
                .deviceModel(userDevice.getDeviceModel())
                .appVersion(userDevice.getAppVersion())
                .lastActiveAt(userDevice.getLastActiveAt())
                .createdAt(userDevice.getCreatedAt())
                .build();
    }
}
