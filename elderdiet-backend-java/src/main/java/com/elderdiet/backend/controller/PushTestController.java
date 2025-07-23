package com.elderdiet.backend.controller;

import com.elderdiet.backend.dto.ApiResponse;
import com.elderdiet.backend.service.JPushService;
import com.elderdiet.backend.service.PushSchedulerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 推送测试控制器
 * 仅用于开发和测试环境
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/push/test")
@RequiredArgsConstructor
public class PushTestController {

    private final PushSchedulerService pushSchedulerService;
    private final JPushService jPushService;

    /**
     * 手动触发午餐提醒推送
     */
    @PostMapping("/lunch-reminder")
    @PreAuthorize("hasAuthority('ROLE_ELDER') or hasAuthority('ROLE_CHILD')")
    public ResponseEntity<ApiResponse<Void>> triggerLunchReminder() {
        try {
            pushSchedulerService.triggerLunchReminderManually();
            return ResponseEntity.ok(ApiResponse.success("午餐提醒推送已触发"));
        } catch (Exception e) {
            log.error("触发午餐提醒推送失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("触发午餐提醒推送失败: " + e.getMessage()));
        }
    }

    /**
     * 手动触发晚餐提醒推送
     */
    @PostMapping("/dinner-reminder")
    @PreAuthorize("hasAuthority('ROLE_ELDER') or hasAuthority('ROLE_CHILD')")
    public ResponseEntity<ApiResponse<Void>> triggerDinnerReminder() {
        try {
            pushSchedulerService.triggerDinnerReminderManually();
            return ResponseEntity.ok(ApiResponse.success("晚餐提醒推送已触发"));
        } catch (Exception e) {
            log.error("触发晚餐提醒推送失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("触发晚餐提醒推送失败: " + e.getMessage()));
        }
    }

    /**
     * 获取推送统计信息
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAuthority('ROLE_ELDER') or hasAuthority('ROLE_CHILD')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPushStatistics() {
        try {
            Map<String, Object> statistics = jPushService.getPushStatistics();
            return ResponseEntity.ok(ApiResponse.success("获取推送统计成功", statistics));
        } catch (Exception e) {
            log.error("获取推送统计失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取推送统计失败: " + e.getMessage()));
        }
    }

    /**
     * 测试系统通知推送
     */
    @PostMapping("/system-notification")
    @PreAuthorize("hasAuthority('ROLE_ELDER') or hasAuthority('ROLE_CHILD')")
    public ResponseEntity<ApiResponse<Void>> testSystemNotification(
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam String userId) {
        try {
            jPushService.sendSystemNotification(title, content, java.util.List.of(userId));
            return ResponseEntity.ok(ApiResponse.success("系统通知推送已发送"));
        } catch (Exception e) {
            log.error("发送系统通知推送失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("发送系统通知推送失败: " + e.getMessage()));
        }
    }
}
