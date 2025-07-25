package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.AuthResponse;
import com.elderdiet.backend.dto.ChangePasswordRequest;
import com.elderdiet.backend.dto.LoginRequest;
import com.elderdiet.backend.dto.RegisterRequest;
import com.elderdiet.backend.dto.UserInfoResponse;
import com.elderdiet.backend.entity.User;
import com.elderdiet.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

/**
 * 认证服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

        private final UserService userService;
        private final ProfileService profileService;
        private final JwtUtil jwtUtil;

        /**
         * 用户注册
         */
        public AuthResponse register(RegisterRequest request) {
                log.info("用户注册请求: {}", request.getPhone());

                // 创建用户
                User user = userService.createUser(
                                request.getPhone(),
                                request.getPassword(),
                                request.getRole());

                // 为新用户创建空的健康档案
                try {
                        profileService.createEmptyProfile(user.getId(), request.getPhone(), request.getRole());
                        log.info("为新用户创建空档案成功: {}", request.getPhone());
                } catch (Exception e) {
                        log.error("为新用户创建空档案失败: {}, 错误: {}", request.getPhone(), e.getMessage());
                        // 继续执行，不影响注册流程
                }

                // 生成JWT令牌
                String token = jwtUtil.generateToken(
                                user.getId(),
                                user.getPhone(),
                                user.getRole());

                log.info("用户注册成功: {}", request.getPhone());

                return AuthResponse.builder()
                                .token(token)
                                .uid(user.getId())
                                .phone(user.getPhone())
                                .role(user.getRole().name())
                                .build();
        }

        /**
         * 用户登录
         */
        public AuthResponse login(LoginRequest request) {
                log.info("用户登录请求: {}", request.getPhone());

                // 查找用户
                User user = userService.findByPhone(request.getPhone())
                                .orElseThrow(() -> new BadCredentialsException("手机号或密码错误"));

                // 验证密码
                if (!userService.verifyPassword(user, request.getPassword())) {
                        throw new BadCredentialsException("手机号或密码错误");
                }

                // 生成JWT令牌
                String token = jwtUtil.generateToken(
                                user.getId(),
                                user.getPhone(),
                                user.getRole());

                log.info("用户登录成功: {}", request.getPhone());

                return AuthResponse.builder()
                                .token(token)
                                .uid(user.getId())
                                .phone(user.getPhone())
                                .role(user.getRole().name())
                                .build();
        }

        /**
         * 获取当前用户信息
         */
        public UserInfoResponse getCurrentUser(String userId) {
                log.info("获取用户信息请求: {}", userId);

                User user = userService.findById(userId)
                                .orElseThrow(() -> new RuntimeException("用户不存在"));

                return UserInfoResponse.builder()
                                .uid(user.getId())
                                .phone(user.getPhone())
                                .role(user.getRole().name())
                                .createdAt(user.getCreatedAt())
                                .updatedAt(user.getUpdatedAt())
                                .build();
        }

        /**
         * 验证JWT令牌
         */
        public boolean validateToken(String token) {
                return jwtUtil.validateToken(token);
        }

        /**
         * 从令牌中获取用户ID
         */
        public String getUserIdFromToken(String token) {
                return jwtUtil.getUidFromToken(token);
        }

        /**
         * 修改密码
         */
        public void changePassword(String userId, ChangePasswordRequest request) {
                log.info("用户修改密码请求: {}", userId);

                // 查找用户
                User user = userService.findById(userId)
                                .orElseThrow(() -> new RuntimeException("用户不存在"));

                // 验证当前密码
                if (!userService.verifyPassword(user, request.getCurrent_password())) {
                        throw new BadCredentialsException("当前密码错误");
                }

                // 更新密码
                userService.updatePassword(user, request.getNew_password());

                log.info("用户修改密码成功: {}", userId);
        }
}