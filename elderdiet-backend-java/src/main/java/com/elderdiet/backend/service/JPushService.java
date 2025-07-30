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
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 混合推送服务
 * 支持JPush Registration ID和Expo Push Token两种推送方式
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JPushService {

    private final JPushClient jPushClient;
    private final JPushConfig jPushConfig;
    private final PushRecordRepository pushRecordRepository;
    private final UserDeviceService userDeviceService;
    private final RestTemplate restTemplate;

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
     * 发送评论通知给膳食记录发布者
     */
    public void sendCommentNotification(String commenterName, String mealRecordId, String recordOwnerId) {
        if (jPushClient == null) {
            log.warn("JPush客户端未初始化，跳过推送");
            return;
        }

        try {
            // 获取记录发布者的启用推送设备
            List<UserDevice> devices = userDeviceService.getUsersMealRecordEnabledDevices(List.of(recordOwnerId));

            if (devices.isEmpty()) {
                log.info("记录发布者没有启用推送的设备，跳过推送");
                return;
            }

            String title = "新评论提醒";
            String content = String.format("%s 评论了你的膳食记录", commenterName);

            // 创建推送记录
            PushRecord pushRecord = createPushRecord(
                    PushRecord.PushType.COMMENT_NOTIFICATION,
                    title, content, List.of(recordOwnerId), devices, mealRecordId);

            // 发送推送
            sendPushNotification(pushRecord, title, content, createCommentExtras(mealRecordId));

            log.info("成功发送评论通知，评论者: {}, 记录发布者: {}", commenterName, recordOwnerId);

        } catch (Exception e) {
            log.error("发送评论通知失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 发送点赞通知给膳食记录发布者
     */
    public void sendLikeNotification(String likerName, String mealRecordId, String recordOwnerId) {
        if (jPushClient == null) {
            log.warn("JPush客户端未初始化，跳过推送");
            return;
        }

        try {
            // 获取记录发布者的启用推送设备
            List<UserDevice> devices = userDeviceService.getUsersMealRecordEnabledDevices(List.of(recordOwnerId));

            if (devices.isEmpty()) {
                log.info("记录发布者没有启用推送的设备，跳过推送");
                return;
            }

            String title = "新点赞提醒";
            String content = String.format("%s 赞了你的膳食记录", likerName);

            // 创建推送记录
            PushRecord pushRecord = createPushRecord(
                    PushRecord.PushType.LIKE_NOTIFICATION,
                    title, content, List.of(recordOwnerId), devices, mealRecordId);

            // 发送推送
            sendPushNotification(pushRecord, title, content, createLikeExtras(mealRecordId));

            log.info("成功发送点赞通知，点赞者: {}, 记录发布者: {}", likerName, recordOwnerId);

        } catch (Exception e) {
            log.error("发送点赞通知失败: {}", e.getMessage(), e);
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
     * 过滤iOS设备，只保留Android设备
     * 用于防止iOS设备接收推送导致崩溃
     */
    private List<String> filterOutIOSDevices(List<String> deviceTokens, List<UserDevice> devices) {
        // 创建deviceToken到platform的映射
        Map<String, UserDevice.DevicePlatform> tokenToPlatformMap = new HashMap<>();
        for (UserDevice device : devices) {
            tokenToPlatformMap.put(device.getDeviceToken(), device.getPlatform());
        }

        // 只保留Android设备的token
        return deviceTokens.stream()
                .filter(token -> {
                    UserDevice.DevicePlatform platform = tokenToPlatformMap.get(token);
                    return platform == UserDevice.DevicePlatform.ANDROID;
                })
                .collect(Collectors.toList());
    }

    /**
     * 发送推送通知
     */
    private void sendPushNotification(PushRecord pushRecord, String title, String content,
            Map<String, String> extras) {
        try {
            // 记录开始发送推送
            log.info("开始发送推送通知，标题: {}, 目标设备数: {} (iOS设备将被过滤掉以避免崩溃)",
                    title, pushRecord.getDeviceTokens().size());

            // 保存推送记录
            pushRecord = pushRecordRepository.save(pushRecord);
            pushRecord.markAsSending();
            pushRecordRepository.save(pushRecord);

            // 获取设备信息以过滤iOS设备
            List<UserDevice> devices = userDeviceService.findDevicesByTokens(pushRecord.getDeviceTokens());

            // 过滤掉iOS设备，只向Android设备发送推送
            List<String> androidDeviceTokens = filterOutIOSDevices(pushRecord.getDeviceTokens(), devices);

            // 如果没有Android设备，则标记为成功并返回
            if (androidDeviceTokens.isEmpty()) {
                pushRecord.markAsSuccess("No Android devices to send", 0);
                log.info("没有Android设备接收推送，跳过发送");
                return;
            }

            // 构建推送载荷
            PushPayload payload = buildPushPayload(androidDeviceTokens, title, content, extras);

            // 发送推送
            PushResult result = jPushClient.sendPush(payload);

            if (result.isResultOK()) {
                pushRecord.markAsSuccess(String.valueOf(result.msg_id), androidDeviceTokens.size());
                log.info("推送发送成功，消息ID: {}, 目标设备数: {}",
                        result.msg_id, androidDeviceTokens.size());
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
        // 修改: 只针对Android平台发送推送，禁用iOS推送以避免iOS设备崩溃问题
        return PushPayload.newBuilder()
                .setPlatform(Platform.android()) // 只针对Android平台
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
        // 修改: 只构建Android通知，不再构建iOS通知
        return Notification.newBuilder()
                .setAlert(content)
                .addPlatformNotification(AndroidNotification.newBuilder()
                        .setTitle(title)
                        .setAlert(content)
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
     * 创建评论推送的额外数据
     */
    private Map<String, String> createCommentExtras(String mealRecordId) {
        Map<String, String> extras = new HashMap<>();
        extras.put("type", "comment");
        extras.put("meal_record_id", mealRecordId);
        extras.put("action", "view_meal_record");
        return extras;
    }

    /**
     * 创建点赞推送的额外数据
     */
    private Map<String, String> createLikeExtras(String mealRecordId) {
        Map<String, String> extras = new HashMap<>();
        extras.put("type", "like");
        extras.put("meal_record_id", mealRecordId);
        extras.put("action", "view_meal_record");
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