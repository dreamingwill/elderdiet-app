package com.elderdiet.backend.dto;

import com.elderdiet.backend.entity.UserDevice;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonProperty("deviceToken") // 明确指定JSON字段名，覆盖SNAKE_CASE策略
    private String deviceToken;

    @NotNull(message = "平台类型不能为空")
    private UserDevice.DevicePlatform platform;

    @JsonProperty("deviceModel") // 明确指定JSON字段名
    private String deviceModel;

    @JsonProperty("appVersion") // 明确指定JSON字段名
    private String appVersion;

    @Builder.Default
    @JsonProperty("pushEnabled") // 明确指定JSON字段名
    private Boolean pushEnabled = true;

    @Builder.Default
    @JsonProperty("mealRecordPushEnabled") // 明确指定JSON字段名
    private Boolean mealRecordPushEnabled = true;

    @Builder.Default
    @JsonProperty("reminderPushEnabled") // 明确指定JSON字段名
    private Boolean reminderPushEnabled = true;
}
