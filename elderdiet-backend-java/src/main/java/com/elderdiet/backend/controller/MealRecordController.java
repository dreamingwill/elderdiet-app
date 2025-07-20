package com.elderdiet.backend.controller;

import com.elderdiet.backend.dto.ApiResponse;
import com.elderdiet.backend.dto.CommentRequest;
import com.elderdiet.backend.dto.MealRecordRequest;
import com.elderdiet.backend.dto.MealRecordResponse;
import com.elderdiet.backend.dto.VisibilityUpdateRequest;
import com.elderdiet.backend.entity.MealRecord;
import com.elderdiet.backend.entity.RecordComment;
import com.elderdiet.backend.entity.User;
import com.elderdiet.backend.security.JwtAuthenticationToken;
import com.elderdiet.backend.service.MealRecordService;
import com.elderdiet.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.List;

/**
 * 膳食记录控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/meal-records")
@RequiredArgsConstructor
public class MealRecordController {

    private final MealRecordService mealRecordService;
    private final UserService userService;

    /**
     * 创建膳食记录（只有老人可以调用）
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ELDER')")
    public ResponseEntity<ApiResponse<MealRecord>> createMealRecord(
            // @Valid @RequestPart("request") MealRecordRequest request, // 替换
            @RequestPart("request") String requestJson,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            Authentication authentication) {

        MealRecordRequest request;
        try {
            // 将字符串形式的 JSON 反序列化为 DTO
            request = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(requestJson, MealRecordRequest.class);
        } catch (Exception parseException) {
            log.error("解析膳食记录请求失败: {}", parseException.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error("无效的请求格式"));
        }

        try {
            // 获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 创建膳食记录
            MealRecord mealRecord = mealRecordService.createMealRecord(currentUser, request, images);

            return ResponseEntity.ok(ApiResponse.success("膳食记录创建成功", mealRecord));

        } catch (Exception e) {
            log.error("创建膳食记录失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 获取当前用户的分享墙时间线
     */
    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<List<MealRecordResponse>>> getFeed(Authentication authentication) {
        try {
            // 获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 获取分享墙时间线
            List<MealRecordResponse> feed = mealRecordService.getFeedForUser(currentUser);

            return ResponseEntity.ok(ApiResponse.success("获取分享墙时间线成功", feed));

        } catch (Exception e) {
            log.error("获取分享墙时间线失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 点赞/取消点赞膳食记录
     */
    @PostMapping("/{recordId}/toggle-like")
    public ResponseEntity<ApiResponse<Void>> toggleLike(
            @PathVariable String recordId,
            Authentication authentication) {

        try {
            // 获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 切换点赞状态
            mealRecordService.toggleLike(recordId, currentUser);

            return ResponseEntity.ok(ApiResponse.success("点赞状态切换成功"));

        } catch (Exception e) {
            log.error("切换点赞状态失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 发表评论
     */
    @PostMapping("/{recordId}/comments")
    public ResponseEntity<ApiResponse<RecordComment>> addComment(
            @PathVariable String recordId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication) {

        try {
            // 获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 添加评论
            RecordComment comment = mealRecordService.addComment(recordId, currentUser, request.getText());

            return ResponseEntity.ok(ApiResponse.success("评论发表成功", comment));

        } catch (Exception e) {
            log.error("发表评论失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 获取指定记录的所有评论
     */
    @GetMapping("/{recordId}/comments")
    public ResponseEntity<ApiResponse<List<MealRecordResponse.CommentInfo>>> getComments(
            @PathVariable String recordId,
            Authentication authentication) {

        try {
            // 获取评论列表
            List<MealRecordResponse.CommentInfo> comments = mealRecordService.getComments(recordId);

            return ResponseEntity.ok(ApiResponse.success("获取评论成功", comments));

        } catch (Exception e) {
            log.error("获取评论失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 更新膳食记录可见性（只有记录创建者可以调用）
     */
    @PutMapping("/{recordId}/visibility")
    @PreAuthorize("hasAuthority('ROLE_ELDER')")
    public ResponseEntity<ApiResponse<MealRecord>> updateRecordVisibility(
            @PathVariable String recordId,
            @Valid @RequestBody VisibilityUpdateRequest request,
            Authentication authentication) {

        try {
            User currentUser = getCurrentUser(authentication);

            // 更新可见性
            MealRecord mealRecord = mealRecordService.updateRecordVisibility(recordId, currentUser, request);

            return ResponseEntity.ok(ApiResponse.success("可见性修改成功", mealRecord));

        } catch (Exception e) {
            log.error("更新膳食记录可见性失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 获取当前认证用户
     */
    private User getCurrentUser(Authentication authentication) {
        JwtAuthenticationToken jwtAuth = (JwtAuthenticationToken) authentication;
        String userId = jwtAuth.getUserId();
        return userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }
}