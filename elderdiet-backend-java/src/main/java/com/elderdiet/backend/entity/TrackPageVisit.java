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
import java.util.Map;

/**
 * 页面访问追踪实体类
 * 用于记录用户的页面访问情况和停留时长，支持宏观的页面使用情况分析
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "track_page_visits")
@CompoundIndexes({
        @CompoundIndex(name = "userId_pageName_enterTime", def = "{'userId': 1, 'pageName': 1, 'enterTime': -1}"),
        @CompoundIndex(name = "userId_enterTime", def = "{'userId': 1, 'enterTime': -1}"),
        @CompoundIndex(name = "pageName_enterTime", def = "{'pageName': 1, 'enterTime': -1}")
})
public class TrackPageVisit {

    @Id
    private String id;

    @NotBlank(message = "用户ID不能为空")
    @Indexed
    private String userId;

    @NotBlank(message = "会话ID不能为空")
    private String sessionId;

    @NotBlank(message = "页面名称不能为空")
    private String pageName; // 页面标识：meal-plan, chat, discovery, profile等

    private String pageTitle; // 页面标题（可选）

    private String route; // 完整路由路径

    @NotNull(message = "进入时间不能为空")
    private LocalDateTime enterTime;

    private LocalDateTime exitTime;

    // 停留时长（秒）
    private Long duration;

    // 页面相关数据
    private Map<String, Object> pageData;

    // 来源页面
    private String referrer;

    // 离开原因
    private String exitReason; // navigation, back, close, etc.

    // 设备信息
    private String deviceType; // ios, android, web
    private String platform;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * 页面名称常量
     */
    public static class PageName {
        // Tab页面
        public static final String MEAL_PLAN = "meal-plan";
        public static final String CHAT = "chat";
        public static final String DISCOVERY = "discovery";
        public static final String PROFILE = "profile";

        // 功能页面
        public static final String MEAL_RECORD = "meal-record";
        public static final String CREATE_POST = "create-post";
        public static final String SETTINGS = "settings";
        public static final String EDIT_PROFILE = "edit-profile";

        // 详情页面
        public static final String RECIPE_DETAIL = "recipe-detail";
        public static final String ARTICLE_DETAIL = "article-detail";
        public static final String ELDER_DETAILS = "elder-details";

        // 认证页面
        public static final String LOGIN = "login";
        public static final String REGISTER = "register";
        public static final String FORGOT_PASSWORD = "forgot-password";
    }

    /**
     * 计算页面停留时长（秒）
     */
    public Long calculateDuration() {
        if (exitTime != null && enterTime != null) {
            return java.time.Duration.between(enterTime, exitTime).getSeconds();
        }
        return null;
    }

    /**
     * 结束页面访问
     */
    public void exitPage(String reason) {
        this.exitTime = LocalDateTime.now();
        this.duration = calculateDuration();
        this.exitReason = reason;
    }

    /**
     * 是否为Tab页面
     */
    public boolean isTabPage() {
        return PageName.MEAL_PLAN.equals(pageName) ||
                PageName.CHAT.equals(pageName) ||
                PageName.DISCOVERY.equals(pageName) ||
                PageName.PROFILE.equals(pageName);
    }
}