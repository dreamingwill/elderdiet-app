package com.elderdiet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

/**
 * 用户追踪请求DTO
 */
public class TrackingRequest {

    /**
     * 会话开始请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SessionStartRequest {
        @NotBlank(message = "设备类型不能为空")
        private String deviceType; // ios, android, web

        private String deviceModel;
        private String osVersion;
        private String appVersion;
        private String userAgent;
    }

    /**
     * 会话结束请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SessionEndRequest {
        @NotBlank(message = "会话ID不能为空")
        private String sessionId;

        private String reason; // logout, timeout, crash, etc.
    }

    /**
     * 事件追踪请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EventTrackRequest {
        @NotBlank(message = "事件类型不能为空")
        private String eventType; // AUTH, FEATURE_USE, INTERACTION

        @NotBlank(message = "事件名称不能为空")
        private String eventName;

        private Map<String, Object> eventData;
        private String result; // success, failure, error
        private String deviceType;
        private String sessionId;
    }

    /**
     * 页面访问开始请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PageVisitStartRequest {
        @NotBlank(message = "页面名称不能为空")
        private String pageName;

        private String pageTitle;
        private String route;
        private String referrer;
        private String deviceType;
        private String sessionId;
        private Map<String, Object> pageData;
    }

    /**
     * 页面访问结束请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PageVisitEndRequest {
        private String pageName; // 如果为空则结束所有当前页面
        private String exitReason; // navigation, back, close, etc.
    }

    /**
     * 批量事件追踪请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BatchEventRequest {
        @NotNull(message = "事件列表不能为空")
        private java.util.List<EventTrackRequest> events;

        private String sessionId;
        private String deviceType;
    }

    /**
     * Tab切换事件请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TabSwitchRequest {
        @NotBlank(message = "目标Tab不能为空")
        private String targetTab; // meal-plan, chat, discovery, profile

        private String previousTab;
        private String sessionId;
        private String deviceType;
    }

    /**
     * 功能使用事件请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FeatureUseRequest {
        @NotBlank(message = "功能名称不能为空")
        private String featureName; // generate_meal_plan, send_message, etc.

        private Map<String, Object> featureData;
        private String result; // success, failure, error
        private String sessionId;
        private String deviceType;
    }
}