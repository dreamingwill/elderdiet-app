package com.elderdiet.backend.service;

import com.elderdiet.backend.entity.User;
import com.elderdiet.backend.entity.UserRole;
import com.elderdiet.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.elderdiet.backend.entity.UserDevice;

/**
 * 推送定时任务服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PushSchedulerService {

    private final JPushService jPushService;
    private final UserRepository userRepository;
    private final UserDeviceService userDeviceService;

    /**
     * 每日12:30推送膳食提醒
     * cron表达式: 秒 分 时 日 月 周
     * 0 30 12 * * ? 表示每天12:30:00执行
     */
    @Scheduled(cron = "0 30 12 * * ?", zone = "Asia/Shanghai")
    public void sendLunchReminder() {
        log.info("开始执行午餐提醒推送任务 - {}", getCurrentTimeString());
        sendMealReminder("午餐");
    }

    /**
     * 每日18:30推送膳食提醒
     * 0 30 18 * * ? 表示每天18:30:00执行
     */
    @Scheduled(cron = "0 30 18 * * ?", zone = "Asia/Shanghai")
    public void sendDinnerReminder() {
        log.info("开始执行晚餐提醒推送任务 - {}", getCurrentTimeString());
        sendMealReminder("晚餐");
    }

    /**
     * 发送膳食提醒
     */
    private void sendMealReminder(String mealType) {
        try {
            // 获取所有老人用户
            List<User> elderUsers = userRepository.findByRole(UserRole.ELDER);
            log.info("开始发送{}提醒，总老人用户数: {}", mealType, elderUsers.size());

            if (elderUsers.isEmpty()) {
                log.info("没有找到老人用户，跳过{}提醒推送", mealType);
                return;
            }

            // 过滤出有启用提醒推送设备的用户，并统计设备数量
            List<String> elderUserIds = new ArrayList<>();
            int totalDeviceCount = 0;

            for (User user : elderUsers) {
                List<UserDevice> userDevices = userDeviceService.getUserReminderEnabledDevices(user.getId());
                if (!userDevices.isEmpty()) {
                    elderUserIds.add(user.getId());
                    totalDeviceCount += userDevices.size();
                    log.debug("用户 {} 有 {} 个启用提醒推送的设备", user.getPhone(), userDevices.size());
                }
            }

            if (elderUserIds.isEmpty()) {
                log.info("没有找到启用提醒推送的老人用户，跳过{}提醒推送", mealType);
                return;
            }

            log.info("准备发送{}提醒 - 目标用户: {}, 目标设备: {}", mealType, elderUserIds.size(), totalDeviceCount);

            // 发送推送提醒
            jPushService.sendMealReminder(elderUserIds);

            log.info("{}提醒推送任务完成，推送用户数: {}, 设备数: {}", mealType, elderUserIds.size(), totalDeviceCount);

        } catch (Exception e) {
            log.error("{}提醒推送任务执行失败: {}", mealType, e.getMessage(), e);
        }
    }

    /**
     * 检查用户是否有启用提醒推送的设备
     */
    private boolean hasReminderEnabledDevices(String userId) {
        try {
            return !userDeviceService.getUserReminderEnabledDevices(userId).isEmpty();
        } catch (Exception e) {
            log.debug("检查用户 {} 的提醒推送设备失败: {}", userId, e.getMessage());
            return false;
        }
    }

    /**
     * 每天凌晨2点清理过期数据
     * 0 0 2 * * ? 表示每天02:00:00执行
     */
    @Scheduled(cron = "0 0 2 * * ?", zone = "Asia/Shanghai")
    public void cleanupExpiredData() {
        log.info("开始执行数据清理任务 - {}", getCurrentTimeString());

        try {
            // 统计清理前的设备数量
            long deviceCountBefore = userDeviceService.getTotalDeviceCount();
            log.info("清理前设备总数: {}", deviceCountBefore);

            // 清理不活跃的设备
            userDeviceService.cleanupInactiveDevices();

            // 清理重复的设备记录
            userDeviceService.cleanupDuplicateDevices();

            // 清理过期的推送记录
            jPushService.cleanupOldPushRecords();

            // 统计清理后的设备数量
            long deviceCountAfter = userDeviceService.getTotalDeviceCount();
            log.info("清理后设备总数: {}, 共清理: {} 个设备", deviceCountAfter, deviceCountBefore - deviceCountAfter);

            log.info("数据清理任务完成");

        } catch (Exception e) {
            log.error("数据清理任务执行失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 每小时执行一次推送统计（用于监控）
     * 0 0 * * * ? 表示每小时的0分0秒执行
     */
    @Scheduled(cron = "0 0 * * * ?", zone = "Asia/Shanghai")
    public void logPushStatistics() {
        try {
            var statistics = jPushService.getPushStatistics();
            log.info("推送统计 - 总数: {}, 成功: {}, 失败: {}, 成功率: {:.2f}%",
                    statistics.get("total"),
                    statistics.get("success"),
                    statistics.get("failed"),
                    ((Double) statistics.get("successRate")) * 100);
        } catch (Exception e) {
            log.debug("获取推送统计失败: {}", e.getMessage());
        }
    }

    /**
     * 获取当前时间字符串
     */
    private String getCurrentTimeString() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    /**
     * 手动触发午餐提醒（用于测试）
     */
    public void triggerLunchReminderManually() {
        log.info("手动触发午餐提醒推送");
        sendMealReminder("午餐");
    }

    /**
     * 手动触发晚餐提醒（用于测试）
     */
    public void triggerDinnerReminderManually() {
        log.info("手动触发晚餐提醒推送");
        sendMealReminder("晚餐");
    }
}
