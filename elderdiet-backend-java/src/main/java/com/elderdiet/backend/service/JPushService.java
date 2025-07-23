package com.elderdiet.backend.service;

import cn.jpush.api.JPushClient;
import cn.jpush.api.push.PushResult;
import cn.jpush.api.push.model.Message;
import cn.jpush.api.push.model.Platform;
import cn.jpush.api.push.model.PushPayload;
import cn.jpush.api.push.model.audience.Audience;
import cn.jpush.api.push.model.notification.AndroidNotification;
import cn.jpush.api.push.model.notification.IosNotification;
import cn.jpush.api.push.model.notification.Notification;
import com.elderdiet.backend.config.JPushConfig;
import com.elderdiet.backend.entity.PushRecord;

import com.elderdiet.backend.entity.UserDevice;
import com.elderdiet.backend.repository.PushRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * JPush推送服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JPushService {

    private final JPushClient jPushClient;
    private final JPushConfig jPushConfig;
    private final PushRecordRepository pushRecordRepository;
    private final UserDeviceService userDeviceService;

    /**
     * 发送膳食记录通知给子女用户
     */
    public void sendMealRecordNotification(String elderName, String mealRecordId, List<String> childUserIds) {
        if (jPushClient == null) {
            log.warn("JPush客户端未初始化，跳过推送");
            return;
        }

        try {
            // 获取子女用户的启用推送设备
            List<UserDevice> devices = userDeviceService.getUsersMealRecordEnabledDevices(childUserIds);

            if (devices.isEmpty()) {
                log.info("没有找到启用膳食记录推送的设备，跳过推送");
                return;
            }

            String title = "膳食记录提醒";
            String content = String.format("%s 刚刚分享了一条膳食记录，快来看看吧！", elderName);

            // 创建推送记录
            PushRecord pushRecord = createPushRecord(
                    PushRecord.PushType.MEAL_RECORD_NOTIFICATION,
                    title, content, childUserIds, devices, mealRecordId);

            // 发送推送
            sendPushNotification(pushRecord, title, content, createMealRecordExtras(mealRecordId));

        } catch (Exception e) {
            log.error("发送膳食记录通知失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 发送膳食提醒给老人用户
     */
    public void sendMealReminder(List<String> elderUserIds) {
        if (jPushClient == null) {
            log.warn("JPush客户端未初始化，跳过推送");
            return;
        }

        try {
            // 获取老人用户的启用提醒推送设备
            List<UserDevice> devices = elderUserIds.stream()
                    .flatMap(userId -> userDeviceService.getUserReminderEnabledDevices(userId).stream())
                    .collect(Collectors.toList());

            if (devices.isEmpty()) {
                log.info("没有找到启用提醒推送的设备，跳过推送");
                return;
            }

            String title = "膳食记录提醒";
            String content = "该记录今天的膳食了，保持健康的饮食习惯！";

            // 创建推送记录
            PushRecord pushRecord = createPushRecord(
                    PushRecord.PushType.MEAL_REMINDER,
                    title, content, elderUserIds, devices, null);

            // 发送推送
            sendPushNotification(pushRecord, title, content, createReminderExtras());

        } catch (Exception e) {
            log.error("发送膳食提醒失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 发送系统通知
     */
    public void sendSystemNotification(String title, String content, List<String> userIds) {
        if (jPushClient == null) {
            log.warn("JPush客户端未初始化，跳过推送");
            return;
        }

        try {
            // 获取用户的启用推送设备
            List<UserDevice> devices = userDeviceService.getUsersMealRecordEnabledDevices(userIds);

            if (devices.isEmpty()) {
                log.info("没有找到启用推送的设备，跳过推送");
                return;
            }

            // 创建推送记录
            PushRecord pushRecord = createPushRecord(
                    PushRecord.PushType.SYSTEM_NOTIFICATION,
                    title, content, userIds, devices, null);

            // 发送推送
            sendPushNotification(pushRecord, title, content, new HashMap<>());

        } catch (Exception e) {
            log.error("发送系统通知失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 创建推送记录
     */
    private PushRecord createPushRecord(PushRecord.PushType pushType, String title, String content,
            List<String> userIds, List<UserDevice> devices, String relatedEntityId) {
        List<String> deviceTokens = devices.stream()
                .map(UserDevice::getDeviceToken)
                .collect(Collectors.toList());

        return PushRecord.builder()
                .pushType(pushType)
                .title(title)
                .content(content)
                .targetUserIds(userIds)
                .deviceTokens(deviceTokens)
                .relatedEntityId(relatedEntityId)
                .status(PushRecord.PushStatus.PENDING)
                .targetCount(devices.size())
                .build();
    }

    /**
     * 发送推送通知
     */
    private void sendPushNotification(PushRecord pushRecord, String title, String content,
            Map<String, String> extras) {
        try {
            // 保存推送记录
            pushRecord = pushRecordRepository.save(pushRecord);
            pushRecord.markAsSending();
            pushRecordRepository.save(pushRecord);

            // 构建推送载荷
            PushPayload payload = buildPushPayload(pushRecord.getDeviceTokens(), title, content, extras);

            // 发送推送
            PushResult result = jPushClient.sendPush(payload);

            if (result.isResultOK()) {
                pushRecord.markAsSuccess(String.valueOf(result.msg_id), pushRecord.getTargetCount());
                log.info("推送发送成功，消息ID: {}, 目标设备数: {}",
                        result.msg_id, pushRecord.getTargetCount());
            } else {
                pushRecord.markAsFailed("推送发送失败: " + result.getOriginalContent());
                log.error("推送发送失败: {}", result.getOriginalContent());
            }

        } catch (Exception e) {
            pushRecord.markAsFailed("推送发送异常: " + e.getMessage());
            log.error("推送发送异常: {}", e.getMessage(), e);
        } finally {
            pushRecordRepository.save(pushRecord);
        }
    }

    /**
     * 构建推送载荷
     */
    private PushPayload buildPushPayload(List<String> deviceTokens, String title, String content,
            Map<String, String> extras) {
        return PushPayload.newBuilder()
                .setPlatform(Platform.android_ios())
                .setAudience(Audience.registrationId(deviceTokens))
                .setNotification(buildNotification(title, content, extras))
                .setMessage(Message.content(content))
                .setOptions(cn.jpush.api.push.model.Options.newBuilder()
                        .setApnsProduction(jPushConfig.isProduction())
                        .setTimeToLive(jPushConfig.getTimeToLive())
                        .build())
                .build();
    }

    /**
     * 构建通知内容
     */
    private Notification buildNotification(String title, String content, Map<String, String> extras) {
        return Notification.newBuilder()
                .setAlert(content)
                .addPlatformNotification(AndroidNotification.newBuilder()
                        .setTitle(title)
                        .setAlert(content)
                        .addExtras(extras)
                        .build())
                .addPlatformNotification(IosNotification.newBuilder()
                        .setAlert(content)
                        .setSound("default")
                        .setBadge(1)
                        .addExtras(extras)
                        .build())
                .build();
    }

    /**
     * 创建膳食记录推送的额外数据
     */
    private Map<String, String> createMealRecordExtras(String mealRecordId) {
        Map<String, String> extras = new HashMap<>();
        extras.put("type", "meal_record");
        extras.put("meal_record_id", mealRecordId);
        extras.put("action", "view_meal_record");
        return extras;
    }

    /**
     * 创建提醒推送的额外数据
     */
    private Map<String, String> createReminderExtras() {
        Map<String, String> extras = new HashMap<>();
        extras.put("type", "reminder");
        extras.put("action", "create_meal_record");
        return extras;
    }

    /**
     * 获取推送统计信息
     */
    public Map<String, Object> getPushStatistics() {
        try {
            long totalRecords = pushRecordRepository.count();
            long successRecords = pushRecordRepository.findByStatus(PushRecord.PushStatus.SUCCESS).size();
            long failedRecords = pushRecordRepository.findFailedRecords().size();

            Map<String, Object> statistics = new HashMap<>();
            statistics.put("total", totalRecords);
            statistics.put("success", successRecords);
            statistics.put("failed", failedRecords);
            statistics.put("successRate", totalRecords > 0 ? (double) successRecords / totalRecords : 0.0);

            return statistics;
        } catch (Exception e) {
            log.error("获取推送统计信息失败: {}", e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * 清理过期的推送记录（保留30天）
     */
    public void cleanupOldPushRecords() {
        try {
            java.time.LocalDateTime cutoffTime = java.time.LocalDateTime.now().minusDays(30);
            pushRecordRepository.deleteByCreatedAtBefore(cutoffTime);
            log.info("清理 {} 之前的推送记录完成", cutoffTime);
        } catch (Exception e) {
            log.error("清理推送记录失败: {}", e.getMessage(), e);
        }
    }
}