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

        // 查找是否已存在相同的设备Token
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
            log.info("创建新设备");
        }

        UserDevice savedDevice = userDeviceRepository.save(device);
        log.info("设备注册成功: {}", savedDevice.getId());

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
        userDeviceRepository.findByDeviceToken(deviceToken)
                .ifPresent(device -> {
                    device.updateLastActiveTime();
                    userDeviceRepository.save(device);
                });
    }

    /**
     * 清理不活跃的设备（超过30天未活跃）
     */
    @Transactional
    public void cleanupInactiveDevices() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(30);
        log.info("清理 {} 之前不活跃的设备", cutoffTime);
        
        userDeviceRepository.deleteByLastActiveAtBefore(cutoffTime);
        log.info("不活跃设备清理完成");
    }
}
