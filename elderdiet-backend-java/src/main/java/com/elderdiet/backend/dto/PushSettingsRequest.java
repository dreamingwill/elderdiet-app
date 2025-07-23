package com.elderdiet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * 推送设置请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PushSettingsRequest {

    private Boolean pushEnabled;

    private Boolean mealRecordPushEnabled;

    private Boolean reminderPushEnabled;
}
