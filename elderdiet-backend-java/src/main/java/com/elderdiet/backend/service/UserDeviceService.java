package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.DeviceRegistrationRequest;
import com.elderdiet.backend.dto.PushSettingsRequest;
import com.elderdiet.backend.dto.UserDeviceResponse;
import com.elderdiet.backend.entity.User;
import com.elderdiet.backend.entity.UserDevice;
import com.elderdiet.backend.repository.UserDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 用户设备服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserDeviceService {

    private final UserDeviceRepository userDeviceRepository;

    /**
     * 注册或更新用户设备
     */
    @Transactional
    public UserDeviceResponse registerDevice(User user, DeviceRegistrationRequest request) {
        log.info("用户 {} 注册设备，Token: {}, 平台: {}",
                user.getPhone(), request.getDeviceToken(), request.getPlatform());

        // 第一步：检查这个设备Token是否已经被其他用户使用（处理重复记录）
        List<UserDevice> devicesWithSameToken = userDeviceRepository.findAllByDeviceToken(request.getDeviceToken());
        for (UserDevice device : devicesWithSameToken) {
            if (!device.getUserId().equals(user.getId())) {
                // 设备Token被其他用户使用，删除旧记录（设备换主人了）
                log.info("设备Token {} 从用户 {} 转移到用户 {}",
                        request.getDeviceToken(),
                        device.getUserId(),
                        user.getId());
                userDeviceRepository.delete(device);
            }
        }

        // 第二步：查找当前用户是否已有相同的设备Token
        Optional<UserDevice> existingDevice = userDeviceRepository
                .findByUserIdAndDeviceToken(user.getId(), request.getDeviceToken());

        UserDevice device;
        if (existingDevice.isPresent()) {
            // 更新现有设备
            device = existingDevice.get();
            device.setPlatform(request.getPlatform());
            device.setDeviceModel(request.getDeviceModel());
            device.setAppVersion(request.getAppVersion());
            device.setPushEnabled(request.getPushEnabled());
            device.setMealRecordPushEnabled(request.getMealRecordPushEnabled());
            device.setReminderPushEnabled(request.getReminderPushEnabled());
            device.updateLastActiveTime();
            log.info("更新现有设备: {}", device.getId());
        } else {
            // 第三步：限制每个用户每个平台的设备数量（防止无限累积）
            cleanupOldDevicesForUserAndPlatform(user.getId(), request.getPlatform());

            // 创建新设备
            device = UserDevice.builder()
                    .userId(user.getId())
                    .deviceToken(request.getDeviceToken())
                    .platform(request.getPlatform())
                    .deviceModel(request.getDeviceModel())
                    .appVersion(request.getAppVersion())
                    .pushEnabled(request.getPushEnabled())
                    .mealRecordPushEnabled(request.getMealRecordPushEnabled())
                    .reminderPushEnabled(request.getReminderPushEnabled())
                    .lastActiveAt(LocalDateTime.now())
                    .build();
            log.info("创建新设备，平台: {}", request.getPlatform());
        }

        UserDevice savedDevice = userDeviceRepository.save(device);
        log.info("设备注册成功: {}", savedDevice.getId());

        // 第四步：记录用户当前的设备统计
        logUserDeviceStatistics(user.getId());

        return UserDeviceResponse.fromEntity(savedDevice);
    }

    /**
     * 获取用户的所有设备
     */
    public List<UserDeviceResponse> getUserDevices(String userId) {
        log.info("获取用户 {} 的所有设备", userId);

        List<UserDevice> devices = userDeviceRepository.findByUserId(userId);
        return devices.stream()
                .map(UserDeviceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 获取用户启用推送的设备
     */
    public List<UserDevice> getUserEnabledDevices(String userId) {
        return userDeviceRepository.findByUserIdAndPushEnabled(userId);
    }

    /**
     * 获取用户启用膳食记录推送的设备
     */
    public List<UserDevice> getUserMealRecordEnabledDevices(String userId) {
        return userDeviceRepository.findByUserIdAndMealRecordPushEnabled(userId);
    }

    /**
     * 获取用户启用提醒推送的设备
     */
    public List<UserDevice> getUserReminderEnabledDevices(String userId) {
        return userDeviceRepository.findByUserIdAndReminderPushEnabled(userId);
    }

    /**
     * 获取多个用户启用膳食记录推送的设备
     */
    public List<UserDevice> getUsersMealRecordEnabledDevices(List<String> userIds) {
        return userDeviceRepository.findByUserIdInAndMealRecordPushEnabled(userIds);
    }

    /**
     * 更新设备推送设置
     */
    @Transactional
    public UserDeviceResponse updatePushSettings(String userId, String deviceToken,
            PushSettingsRequest request) {
        log.info("更新用户 {} 设备 {} 的推送设置", userId, deviceToken);

        UserDevice device = userDeviceRepository.findByUserIdAndDeviceToken(userId, deviceToken)
                .orElseThrow(() -> new RuntimeException("设备不存在"));

        if (request.getPushEnabled() != null) {
            device.setPushEnabled(request.getPushEnabled());
        }
        if (request.getMealRecordPushEnabled() != null) {
            device.setMealRecordPushEnabled(request.getMealRecordPushEnabled());
        }
        if (request.getReminderPushEnabled() != null) {
            device.setReminderPushEnabled(request.getReminderPushEnabled());
        }

        device.updateLastActiveTime();
        UserDevice savedDevice = userDeviceRepository.save(device);

        log.info("推送设置更新成功");
        return UserDeviceResponse.fromEntity(savedDevice);
    }

    /**
     * 删除设备
     */
    @Transactional
    public void removeDevice(String userId, String deviceToken) {
        log.info("删除用户 {} 的设备: {}", userId, deviceToken);

        userDeviceRepository.findByUserIdAndDeviceToken(userId, deviceToken)
                .ifPresent(device -> {
                    userDeviceRepository.delete(device);
                    log.info("设备删除成功: {}", device.getId());
                });
    }

    /**
     * 更新设备活跃时间
     */
    @Transactional
    public void updateDeviceActiveTime(String deviceToken) {
        try {
            // 处理可能的重复记录情况
            List<UserDevice> devices = userDeviceRepository.findAllByDeviceToken(deviceToken);
            for (UserDevice device : devices) {
                device.updateLastActiveTime();
                userDeviceRepository.save(device);
            }
            if (!devices.isEmpty()) {
                log.debug("更新了 {} 个设备的活跃时间", devices.size());
            }
        } catch (Exception e) {
            log.debug("更新设备活跃时间失败: {}", e.getMessage());
        }
    }

    /**
     * 清理用户在指定平台的旧设备（保留最新的2个）
     */
    @Transactional
    public void cleanupOldDevicesForUserAndPlatform(String userId, UserDevice.DevicePlatform platform) {
        try {
            // 获取该用户该平台的所有设备，按最后活跃时间降序排列
            List<UserDevice> devices = userDeviceRepository.findByUserIdAndPlatform(userId, platform);

            // 按最后活跃时间降序排序
            devices.sort((a, b) -> {
                LocalDateTime timeA = a.getLastActiveAt() != null ? a.getLastActiveAt() : LocalDateTime.MIN;
                LocalDateTime timeB = b.getLastActiveAt() != null ? b.getLastActiveAt() : LocalDateTime.MIN;
                return timeB.compareTo(timeA);
            });

            if (devices.size() > 2) {
                // 保留最新的2个设备，删除其余的
                List<UserDevice> devicesToDelete = devices.subList(2, devices.size());
                log.info("用户 {} 在平台 {} 有 {} 个设备，删除 {} 个旧设备",
                        userId, platform, devices.size(), devicesToDelete.size());

                for (UserDevice deviceToDelete : devicesToDelete) {
                    log.info("删除旧设备: {}, Token: {}, 最后活跃: {}",
                            deviceToDelete.getId(),
                            deviceToDelete.getDeviceToken().substring(0,
                                    Math.min(10, deviceToDelete.getDeviceToken().length())) + "...",
                            deviceToDelete.getLastActiveAt());
                    userDeviceRepository.delete(deviceToDelete);
                }
            }
        } catch (Exception e) {
            log.error("清理用户 {} 平台 {} 旧设备失败: {}", userId, platform, e.getMessage());
        }
    }

    /**
     * 记录用户设备统计信息
     */
    private void logUserDeviceStatistics(String userId) {
        try {
            List<UserDevice> allDevices = userDeviceRepository.findByUserId(userId);
            long androidCount = allDevices.stream().filter(d -> d.getPlatform() == UserDevice.DevicePlatform.ANDROID)
                    .count();
            long iosCount = allDevices.stream().filter(d -> d.getPlatform() == UserDevice.DevicePlatform.IOS).count();

            log.info("用户 {} 当前设备统计 - Android: {}, iOS: {}, 总计: {}",
                    userId, androidCount, iosCount, allDevices.size());
        } catch (Exception e) {
            log.debug("记录用户设备统计失败: {}", e.getMessage());
        }
    }

    /**
     * 清理不活跃的设备（超过30天未活跃）
     */
    @Transactional
    public void cleanupInactiveDevices() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(30);
        log.info("开始清理 {} 之前不活跃的设备", cutoffTime);

        // 先统计要删除的设备数量
        long inactiveCount = userDeviceRepository.countByLastActiveAtBefore(cutoffTime);
        log.info("发现 {} 个不活跃设备需要清理", inactiveCount);

        if (inactiveCount > 0) {
            userDeviceRepository.deleteByLastActiveAtBefore(cutoffTime);
            log.info("成功清理 {} 个不活跃设备", inactiveCount);
        } else {
            log.info("没有发现需要清理的不活跃设备");
        }
    }

    /**
     * 清理重复的设备记录
     */
    @Transactional
    public void cleanupDuplicateDevices() {
        try {
            log.info("开始清理重复的设备记录");

            // 获取所有用户
            List<String> allUserIds = userDeviceRepository.findAll().stream()
                    .map(UserDevice::getUserId)
                    .distinct()
                    .collect(Collectors.toList());

            int cleanedCount = 0;
            for (String userId : allUserIds) {
                // 清理每个用户每个平台的旧设备
                cleanupOldDevicesForUserAndPlatform(userId, UserDevice.DevicePlatform.ANDROID);
                cleanupOldDevicesForUserAndPlatform(userId, UserDevice.DevicePlatform.IOS);
                cleanedCount++;
            }

            log.info("重复设备清理完成，处理了 {} 个用户", cleanedCount);

        } catch (Exception e) {
            log.error("清理重复设备失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 获取设备总数
     */
    public long getTotalDeviceCount() {
        return userDeviceRepository.count();
    }

    /**
     * 紧急清理重复的 deviceToken 记录
     */
    @Transactional
    public void emergencyCleanupDuplicateTokens() {
        try {
            log.info("开始紧急清理重复的 deviceToken 记录");

            List<UserDevice> allDevices = userDeviceRepository.findAll();
            Map<String, List<UserDevice>> tokenGroups = allDevices.stream()
                    .collect(Collectors.groupingBy(UserDevice::getDeviceToken));

            int duplicateCount = 0;
            for (Map.Entry<String, List<UserDevice>> entry : tokenGroups.entrySet()) {
                List<UserDevice> devices = entry.getValue();
                if (devices.size() > 1) {
                    // 保留最新的一个，删除其他的
                    devices.sort((a, b) -> {
                        LocalDateTime timeA = a.getLastActiveAt() != null ? a.getLastActiveAt() : LocalDateTime.MIN;
                        LocalDateTime timeB = b.getLastActiveAt() != null ? b.getLastActiveAt() : LocalDateTime.MIN;
                        return timeB.compareTo(timeA);
                    });

                    // 删除除了第一个（最新的）之外的所有记录
                    for (int i = 1; i < devices.size(); i++) {
                        UserDevice deviceToDelete = devices.get(i);
                        log.info("删除重复的设备记录: Token={}, User={}, LastActive={}",
                                deviceToDelete.getDeviceToken().substring(0, 10) + "...",
                                deviceToDelete.getUserId(),
                                deviceToDelete.getLastActiveAt());
                        userDeviceRepository.delete(deviceToDelete);
                        duplicateCount++;
                    }
                }
            }

            log.info("紧急清理完成，删除了 {} 个重复记录", duplicateCount);

        } catch (Exception e) {
            log.error("紧急清理重复记录失败: {}", e.getMessage(), e);
        }
    }
}
