package com.elderdiet.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 用户事件追踪实体类
 * 用于记录用户的关键操作行为，支持宏观的用户活跃度分析
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "track_user_events")
@CompoundIndexes({
        @CompoundIndex(name = "userId_eventType_timestamp", def = "{'userId': 1, 'eventType': 1, 'timestamp': -1}"),
        @CompoundIndex(name = "userId_timestamp", def = "{'userId': 1, 'timestamp': -1}"),
        @CompoundIndex(name = "eventType_timestamp", def = "{'eventType': 1, 'timestamp': -1}")
})
public class TrackUserEvent {

    @Id
    private String id;

    @NotBlank(message = "用户ID不能为空")
    @Indexed
    private String userId;

    @NotBlank(message = "会话ID不能为空")
    private String sessionId;

    @NotBlank(message = "事件类型不能为空")
    private String eventType; // 事件类型：AUTH, FEATURE_USE, INTERACTION

    @NotBlank(message = "事件名称不能为空")
    private String eventName; // 具体事件名：login, generate_meal_plan, send_message等

    @NotNull(message = "事件时间不能为空")
    private LocalDateTime timestamp;

    // 事件相关数据（JSON格式存储）
    private Map<String, Object> eventData;

    // 事件结果
    private String result; // success, failure, error

    // 设备信息
    private String deviceType; // ios, android, web
    private String platform;

    @CreatedDate
    private LocalDateTime createdAt;

    /**
     * 事件类型枚举
     */
    public static class EventType {
        // 认证相关事件
        public static final String AUTH = "AUTH";
        // 功能使用事件
        public static final String FEATURE_USE = "FEATURE_USE";
        // 用户交互事件
        public static final String INTERACTION = "INTERACTION";
    }

    /**
     * 认证事件名称
     */
    public static class AuthEvent {
        public static final String LOGIN = "login";
        public static final String LOGOUT = "logout";
        public static final String REGISTER = "register";
        public static final String SESSION_START = "session_start";
        public static final String SESSION_END = "session_end";
    }

    /**
     * 功能使用事件名称
     */
    public static class FeatureEvent {
        public static final String GENERATE_MEAL_PLAN = "generate_meal_plan";
        public static final String SEND_MESSAGE = "send_message";
        public static final String CREATE_MEAL_RECORD = "create_meal_record";
        public static final String LIKE_RECORD = "like_record";
        public static final String COMMENT_RECORD = "comment_record";
        public static final String VIEW_ARTICLE = "view_article";
        public static final String VIEW_RECIPE = "view_recipe";
        public static final String UPDATE_PROFILE = "update_profile";
    }

    /**
     * 交互事件名称
     */
    public static class InteractionEvent {
        public static final String TAB_SWITCH = "tab_switch";
        public static final String PAGE_VIEW = "page_view";
        public static final String BUTTON_CLICK = "button_click";
        public static final String SEARCH = "search";
        public static final String SHARE = "share";
    }
}