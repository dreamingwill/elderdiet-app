package com.elderdiet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 用户追踪响应DTO
 */
public class TrackingResponse {

    /**
     * 会话响应
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SessionResponse {
        private String sessionId;
        private String userId;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Long duration;
        private String deviceType;
        private Boolean isActive;
        private String status; // success, error
        private String message;
    }

    /**
     * 事件追踪响应
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EventTrackResponse {
        private String eventId;
        private String eventType;
        private String eventName;
        private LocalDateTime timestamp;
        private String status; // success, error
        private String message;
    }

    /**
     * 页面访问响应
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PageVisitResponse {
        private String visitId;
        private String pageName;
        private LocalDateTime enterTime;
        private LocalDateTime exitTime;
        private Long duration;
        private String status; // success, error
        private String message;
    }

    /**
     * 批量操作响应
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BatchResponse {
        private int totalCount;
        private int successCount;
        private int failureCount;
        private String status; // success, partial, error
        private String message;
        private java.util.List<String> errors;
    }

    /**
     * 用户活跃度统计响应
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserActivityResponse {
        private String userId;
        private LocalDateTime lastActiveTime;
        private Boolean isOnline;
        private int sessionCount;
        private int eventCount;
        private int pageViewCount;
        private Long totalDuration; // 总使用时长（秒）
        private Map<String, Object> statistics;
    }

    /**
     * 通用响应
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GeneralResponse {
        private String status; // success, error
        private String message;
        private Object data;
        private LocalDateTime timestamp;

        public static GeneralResponse success(String message) {
            return GeneralResponse.builder()
                    .status("success")
                    .message(message)
                    .timestamp(LocalDateTime.now())
                    .build();
        }

        public static GeneralResponse success(String message, Object data) {
            return GeneralResponse.builder()
                    .status("success")
                    .message(message)
                    .data(data)
                    .timestamp(LocalDateTime.now())
                    .build();
        }

        public static GeneralResponse error(String message) {
            return GeneralResponse.builder()
                    .status("error")
                    .message(message)
                    .timestamp(LocalDateTime.now())
                    .build();
        }
    }
}