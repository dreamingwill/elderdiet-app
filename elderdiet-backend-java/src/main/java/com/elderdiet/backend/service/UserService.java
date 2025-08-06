package com.elderdiet.backend.service;

import com.elderdiet.backend.entity.User;
import com.elderdiet.backend.entity.UserRole;
import com.elderdiet.backend.repository.UserRepository;
import com.elderdiet.backend.repository.FamilyLinkRepository;
import com.elderdiet.backend.security.JwtAuthenticationToken;
import com.elderdiet.backend.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * 用户服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final FamilyLinkRepository familyLinkRepository;

    /**
     * Spring Security 用户详情加载
     */
    @Override
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + phone));
    }

    /**
     * 根据手机号查找用户
     */
    public Optional<User> findByPhone(String phone) {
        return userRepository.findByPhone(phone);
    }

    /**
     * 根据ID查找用户
     */
    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    /**
     * 检查手机号是否已存在
     */
    public boolean existsByPhone(String phone) {
        return userRepository.existsByPhone(phone);
    }

    /**
     * 创建新用户
     */
    public User createUser(String phone, String password, UserRole role) {
        // 检查用户是否已存在
        if (existsByPhone(phone)) {
            throw new RuntimeException("该手机号已注册");
        }

        // 加密密码
        String encodedPassword = PasswordUtil.encode(password);

        // 创建用户
        User user = User.builder()
                .phone(phone)
                .passwordHash(encodedPassword)
                .role(role)
                .build();

        User savedUser = userRepository.save(user);
        log.info("创建新用户成功: {}", phone);
        return savedUser;
    }

    /**
     * 验证用户密码
     */
    public boolean verifyPassword(User user, String rawPassword) {
        return PasswordUtil.matches(rawPassword, user.getPasswordHash());
    }

    /**
     * 更新用户密码
     */
    public void updatePassword(User user, String newPassword) {
        // 加密新密码
        String encodedPassword = PasswordUtil.encode(newPassword);

        // 更新用户密码
        user.setPasswordHash(encodedPassword);
        userRepository.save(user);

        log.info("用户密码更新成功: {}", user.getPhone());
    }

    /**
     * 更新用户信息
     */
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    /**
     * 删除用户
     */
    public void deleteUser(String id) {
        userRepository.deleteById(id);
        log.info("删除用户成功: {}", id);
    }

    /**
     * 从Authentication中获取当前用户
     */
    public User getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            throw new RuntimeException("用户未认证");
        }

        String userId;
        if (authentication instanceof JwtAuthenticationToken) {
            // 从JWT认证Token中获取用户ID
            userId = (String) authentication.getPrincipal();
        } else {
            throw new RuntimeException("不支持的认证类型");
        }

        return findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }

    /**
     * 检查用户是否有家庭关系
     */
    public boolean hasAnyFamilyLinks(String userId) {
        return familyLinkRepository.findByParentId(userId).size() > 0 ||
                familyLinkRepository.findByChildId(userId).size() > 0;
    }

    /**
     * 获取用户可以切换到的角色
     */
    public UserRole getAlternateRole(UserRole currentRole) {
        return currentRole == UserRole.ELDER ? UserRole.CHILD : UserRole.ELDER;
    }

    /**
     * 切换用户角色
     */
    @Transactional
    public User changeRole(User user, String confirmationText) {
        log.info("用户 {} 尝试切换角色，当前角色: {}", user.getPhone(), user.getRole());

        // 验证确认字符串
        if (!"CHANGE_ROLE".equals(confirmationText)) {
            throw new RuntimeException("确认字符串不正确，请输入 'CHANGE_ROLE'");
        }

        // 检查用户是否有家庭关系
        if (hasAnyFamilyLinks(user.getId())) {
            throw new RuntimeException("请先解除所有家庭关系后再切换角色");
        }

        // 获取要切换到的角色
        UserRole newRole = getAlternateRole(user.getRole());

        // 更新用户角色
        user.setRole(newRole);
        User updatedUser = userRepository.save(user);

        log.info("用户 {} 成功切换角色: {} -> {}", user.getPhone(), user.getRole(), newRole);

        return updatedUser;
    }
}