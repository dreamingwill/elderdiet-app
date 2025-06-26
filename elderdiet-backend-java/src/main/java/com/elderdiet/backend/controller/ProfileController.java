package com.elderdiet.backend.controller;

import com.elderdiet.backend.dto.ApiResponse;
import com.elderdiet.backend.dto.ProfileDTO;
import com.elderdiet.backend.dto.ChronicConditionOptionDTO;
import com.elderdiet.backend.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 健康档案控制器
 * 对应Node.js后端的profile.route.ts
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
@Validated
public class ProfileController {
    
    private final ProfileService profileService;
    
    /**
     * 获取用户健康档案
     * GET /api/v1/profiles/:userId
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<ProfileDTO>> getProfile(@PathVariable String userId) {
        try {
            // 权限检查：只能访问自己的档案
            String currentUserId = getCurrentUserId();
            if (!userId.equals(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.<ProfileDTO>builder()
                                .success(false)
                                .message("无权访问其他用户的健康档案")
                                .timestamp(LocalDateTime.now())
                                .build());
            }
            
            ProfileDTO profile = profileService.getProfileByUserId(userId);
            if (profile == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.<ProfileDTO>builder()
                                .success(false)
                                .message("健康档案不存在")
                                .timestamp(LocalDateTime.now())
                                .build());
            }
            
            return ResponseEntity.ok(ApiResponse.<ProfileDTO>builder()
                    .success(true)
                    .message("获取健康档案成功")
                    .data(profile)
                    .timestamp(LocalDateTime.now())
                    .build());
                    
        } catch (Exception e) {
            log.error("获取健康档案失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<ProfileDTO>builder()
                            .success(false)
                            .message("服务器内部错误")
                            .timestamp(LocalDateTime.now())
                            .build());
        }
    }
    
    /**
     * 创建健康档案
     * POST /api/v1/profiles
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProfileDTO>> createProfile(@Valid @RequestBody ProfileDTO profileDTO) {
        try {
            String userId = getCurrentUserId();
            ProfileDTO createdProfile = profileService.createProfile(userId, profileDTO);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.<ProfileDTO>builder()
                            .success(true)
                            .message("创建健康档案成功")
                            .data(createdProfile)
                            .timestamp(LocalDateTime.now())
                            .build());
                            
        } catch (RuntimeException e) {
            if (e.getMessage().contains("已存在")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.<ProfileDTO>builder()
                                .success(false)
                                .message(e.getMessage())
                                .timestamp(LocalDateTime.now())
                                .build());
            }
            throw e;
        } catch (Exception e) {
            log.error("创建健康档案失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<ProfileDTO>builder()
                            .success(false)
                            .message("服务器内部错误")
                            .timestamp(LocalDateTime.now())
                            .build());
        }
    }
    
    /**
     * 更新健康档案
     * PUT /api/v1/profiles/:userId
     */
    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<ProfileDTO>> updateProfile(
            @PathVariable String userId,
            @Valid @RequestBody ProfileDTO profileDTO) {
        try {
            // 权限检查：只能更新自己的档案
            String currentUserId = getCurrentUserId();
            if (!userId.equals(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.<ProfileDTO>builder()
                                .success(false)
                                .message("无权访问其他用户的健康档案")
                                .timestamp(LocalDateTime.now())
                                .build());
            }
            
            ProfileDTO updatedProfile = profileService.updateProfile(userId, profileDTO);
            
            return ResponseEntity.ok(ApiResponse.<ProfileDTO>builder()
                    .success(true)
                    .message("更新健康档案成功")
                    .data(updatedProfile)
                    .timestamp(LocalDateTime.now())
                    .build());
                    
        } catch (RuntimeException e) {
            if (e.getMessage().contains("不存在")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.<ProfileDTO>builder()
                                .success(false)
                                .message(e.getMessage())
                                .timestamp(LocalDateTime.now())
                                .build());
            }
            throw e;
        } catch (Exception e) {
            log.error("更新健康档案失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<ProfileDTO>builder()
                            .success(false)
                            .message("服务器内部错误")
                            .timestamp(LocalDateTime.now())
                            .build());
        }
    }
    
    /**
     * 删除健康档案
     * DELETE /api/v1/profiles/:userId
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteProfile(@PathVariable String userId) {
        try {
            // 权限检查：只能删除自己的档案
            String currentUserId = getCurrentUserId();
            if (!userId.equals(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.<Void>builder()
                                .success(false)
                                .message("无权访问其他用户的健康档案")
                                .timestamp(LocalDateTime.now())
                                .build());
            }
            
            profileService.deleteProfile(userId);
            
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("删除健康档案成功")
                    .timestamp(LocalDateTime.now())
                    .build());
                    
        } catch (RuntimeException e) {
            if (e.getMessage().contains("不存在")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.<Void>builder()
                                .success(false)
                                .message(e.getMessage())
                                .timestamp(LocalDateTime.now())
                                .build());
            }
            throw e;
        } catch (Exception e) {
            log.error("删除健康档案失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Void>builder()
                            .success(false)
                            .message("服务器内部错误")
                            .timestamp(LocalDateTime.now())
                            .build());
        }
    }
    
    /**
     * 获取慢性疾病选项
     * GET /api/v1/profiles/options/chronic-conditions
     */
    @GetMapping("/options/chronic-conditions")
    public ResponseEntity<ApiResponse<List<ChronicConditionOptionDTO>>> getChronicConditionOptions() {
        try {
            List<ChronicConditionOptionDTO> options = profileService.getChronicConditionOptions();
            
            return ResponseEntity.ok(ApiResponse.<List<ChronicConditionOptionDTO>>builder()
                    .success(true)
                    .message("获取慢性疾病选项成功")
                    .data(options)
                    .timestamp(LocalDateTime.now())
                    .build());
                    
        } catch (Exception e) {
            log.error("获取慢性疾病选项失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<ChronicConditionOptionDTO>>builder()
                            .success(false)
                            .message("服务器内部错误")
                            .timestamp(LocalDateTime.now())
                            .build());
        }
    }
    
    /**
     * 获取当前用户ID
     */
    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("用户未认证");
        }
        
        // 从JWT token中获取用户ID
        Object principal = authentication.getPrincipal();
        if (principal instanceof String) {
            return (String) principal;
        }
        
        throw new RuntimeException("无法获取用户ID");
    }
} 