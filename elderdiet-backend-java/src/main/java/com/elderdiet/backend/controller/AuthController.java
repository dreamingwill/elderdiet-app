package com.elderdiet.backend.controller;

import com.elderdiet.backend.dto.*;
import com.elderdiet.backend.security.JwtAuthenticationToken;
import com.elderdiet.backend.entity.User;
import com.elderdiet.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * 认证控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;

    /**
     * 用户注册
     * POST /api/v1/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse authResponse = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("注册成功", authResponse));
        } catch (RuntimeException e) {
            log.error("用户注册失败: {}", e.getMessage());
            if (e.getMessage().contains("已注册")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error(e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }

    /**
     * 用户登录
     * POST /api/v1/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse authResponse = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success("登录成功", authResponse));
        } catch (BadCredentialsException e) {
            log.error("用户登录失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("手机号或密码错误"));
        } catch (Exception e) {
            log.error("登录过程中发生错误: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }

    /**
     * 获取当前用户信息
     * GET /api/v1/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserInfoResponse>> getCurrentUser(
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            UserInfoResponse userInfo = authService.getCurrentUser(user.getId());
            return ResponseEntity.ok(ApiResponse.success("获取用户信息成功", userInfo));
        } catch (Exception e) {
            log.error("获取用户信息失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("用户不存在"));
        }
    }

    /**
     * 用户退出登录
     * POST /api/v1/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // JWT是无状态的，客户端删除token即可实现退出
        // 这里可以实现token黑名单等高级功能
        return ResponseEntity.ok(ApiResponse.success("退出登录成功"));
    }

    /**
     * 修改密码
     * POST /api/v1/auth/change-password
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        try {
            // 从认证信息中获取用户ID
            String userId;
            if (authentication instanceof JwtAuthenticationToken) {
                userId = (String) authentication.getPrincipal();
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("认证信息无效"));
            }

            authService.changePassword(userId, request);
            return ResponseEntity.ok(ApiResponse.success("密码修改成功"));
        } catch (BadCredentialsException e) {
            log.error("修改密码失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("当前密码错误"));
        } catch (Exception e) {
            log.error("修改密码过程中发生错误: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }

    /**
     * 验证关联关系（忘记密码第一步）
     * POST /api/v1/auth/verify-relationship
     */
    @PostMapping("/verify-relationship")
    public ResponseEntity<ApiResponse<VerifyRelationshipResponse>> verifyRelationship(
            @Valid @RequestBody VerifyRelationshipRequest request) {
        try {
            VerifyRelationshipResponse response = authService.verifyRelationship(request);
            return ResponseEntity.ok(ApiResponse.success("关联关系验证成功", response));
        } catch (RuntimeException e) {
            log.error("验证关联关系失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("验证关联关系过程中发生错误: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }

    /**
     * 重置密码（忘记密码第二步）
     * POST /api/v1/auth/reset-password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request);
            return ResponseEntity.ok(ApiResponse.success("密码重置成功"));
        } catch (RuntimeException e) {
            log.error("重置密码失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("重置密码过程中发生错误: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }

    /**
     * 删除账号（注销账号）
     * DELETE /api/v1/auth/delete-account
     */
    @PostMapping("/delete-account")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @Valid @RequestBody DeleteAccountRequest request) {
        try {
            authService.deleteAccount(request);
            return ResponseEntity.ok(ApiResponse.success("账号删除成功"));
        } catch (RuntimeException e) {
            log.error("删除账号失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("删除账号过程中发生错误: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("服务器内部错误"));
        }
    }
}