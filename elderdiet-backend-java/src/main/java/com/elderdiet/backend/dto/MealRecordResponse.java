package com.elderdiet.backend.dto;

import com.elderdiet.backend.entity.RecordVisibility;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 膳食记录响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealRecordResponse {

    private String id;
    private String userId;
    private List<String> imageUrls;
    private String caption;
    private RecordVisibility visibility;
    private int likesCount;
    private int commentsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 聚合信息
    private UserInfo userInfo; // 发布者信息
    private boolean likedByCurrentUser; // 当前用户是否点赞
    private List<CommentInfo> comments; // 评论列表

    /**
     * 用户信息
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        private String userId;
        private String username; // 用户名（手机号）错误！ 应该用发布者的profile的name
        private String avatar; // 头像URL 用profile的avatarUrl
        private String nickname; // 昵称 暂时没用
    }

    /**
     * 评论信息
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommentInfo {
        private String id; // 评论的id
        private String userId; // 评论者的userId
        private String username; // 评论者的profile的name
        private String userAvatar; // 评论者的profile的avatarUrl
        private String text; // 评论内容
        private LocalDateTime createdAt;
    }
}