package com.elderdiet.backend.dto;

import com.elderdiet.backend.entity.UserDevice;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 设备注册请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceRegistrationRequest {

    @NotBlank(message = "设备Token不能为空")
    private String deviceToken;

    @NotNull(message = "平台类型不能为空")
    private UserDevice.DevicePlatform platform;

    private String deviceModel;

    private String appVersion;

    @Builder.Default
    private Boolean pushEnabled = true;

    @Builder.Default
    private Boolean mealRecordPushEnabled = true;

    @Builder.Default
    private Boolean reminderPushEnabled = true;
}
