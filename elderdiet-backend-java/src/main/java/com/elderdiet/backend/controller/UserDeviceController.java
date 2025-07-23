package com.elderdiet.backend.controller;

import com.elderdiet.backend.dto.ApiResponse;
import com.elderdiet.backend.dto.DeviceRegistrationRequest;
import com.elderdiet.backend.dto.PushSettingsRequest;
import com.elderdiet.backend.dto.UserDeviceResponse;
import com.elderdiet.backend.entity.User;
import com.elderdiet.backend.service.UserDeviceService;
import com.elderdiet.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

/**
 * 用户设备控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
public class UserDeviceController {

    private final UserDeviceService userDeviceService;
    private final UserService userService;

    /**
     * 注册设备
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDeviceResponse>> registerDevice(
            @Valid @RequestBody DeviceRegistrationRequest request,
            Authentication authentication) {

        try {
            // 使用Jackson将请求对象转换为JSON字符串进行调试
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String requestJson = objectMapper.writeValueAsString(request);
            log.info("收到设备注册请求，解析后的JSON: {}", requestJson);

            // 添加详细的调试日志
            log.info("解析后的请求对象各字段:");
            log.info("- deviceToken: '{}' (类型: {})", request.getDeviceToken(),
                    request.getDeviceToken() != null ? request.getDeviceToken().getClass().getSimpleName() : "null");
            log.info("- platform: {} (类型: {})", request.getPlatform(),
                    request.getPlatform() != null ? request.getPlatform().getClass().getSimpleName() : "null");
            log.info("- deviceModel: '{}' (类型: {})", request.getDeviceModel(),
                    request.getDeviceModel() != null ? request.getDeviceModel().getClass().getSimpleName() : "null");
            log.info("- appVersion: '{}' (类型: {})", request.getAppVersion(),
                    request.getAppVersion() != null ? request.getAppVersion().getClass().getSimpleName() : "null");
            log.info("- pushEnabled: {} (类型: {})", request.getPushEnabled(),
                    request.getPushEnabled() != null ? request.getPushEnabled().getClass().getSimpleName() : "null");
            log.info("- mealRecordPushEnabled: {} (类型: {})", request.getMealRecordPushEnabled(),
                    request.getMealRecordPushEnabled() != null
                            ? request.getMealRecordPushEnabled().getClass().getSimpleName()
                            : "null");
            log.info("- reminderPushEnabled: {} (类型: {})", request.getReminderPushEnabled(),
                    request.getReminderPushEnabled() != null
                            ? request.getReminderPushEnabled().getClass().getSimpleName()
                            : "null");

            // 检查deviceToken是否为空
            if (request.getDeviceToken() == null) {
                log.error("❌ deviceToken为null");
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("设备Token不能为空"));
            } else if (request.getDeviceToken().trim().isEmpty()) {
                log.error("❌ deviceToken为空字符串，原始值: '{}', 长度: {}",
                        request.getDeviceToken(), request.getDeviceToken().length());
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("设备Token不能为空"));
            } else {
                log.info("✅ deviceToken有效，长度: {}, 值: '{}'",
                        request.getDeviceToken().length(), request.getDeviceToken());
            }

            User user = userService.getCurrentUser(authentication);
            UserDeviceResponse response = userDeviceService.registerDevice(user, request);

            return ResponseEntity.ok(ApiResponse.success("设备注册成功", response));
        } catch (jakarta.validation.ConstraintViolationException e) {
            log.error("❌ 参数验证失败: {}", e.getMessage());
            // 输出具体的验证错误
            e.getConstraintViolations().forEach(violation -> {
                log.error("验证错误 - 字段: {}, 值: '{}', 错误信息: {}",
                        violation.getPropertyPath(), violation.getInvalidValue(), violation.getMessage());
            });
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("参数验证失败: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ 设备注册失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("设备注册失败: " + e.getMessage()));
        }
    }

    /**
     * 获取当前用户的所有设备
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDeviceResponse>>> getUserDevices(
            Authentication authentication) {

        try {
            User user = userService.getCurrentUser(authentication);
            List<UserDeviceResponse> devices = userDeviceService.getUserDevices(user.getId());

            return ResponseEntity.ok(ApiResponse.success("获取设备列表成功", devices));
        } catch (Exception e) {
            log.error("获取设备列表失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取设备列表失败: " + e.getMessage()));
        }
    }

    /**
     * 更新设备推送设置
     */
    @PutMapping("/{deviceToken}/settings")
    public ResponseEntity<ApiResponse<UserDeviceResponse>> updatePushSettings(
            @PathVariable String deviceToken,
            @Valid @RequestBody PushSettingsRequest request,
            Authentication authentication) {

        try {
            User user = userService.getCurrentUser(authentication);
            UserDeviceResponse response = userDeviceService.updatePushSettings(
                    user.getId(), deviceToken, request);

            return ResponseEntity.ok(ApiResponse.success("推送设置更新成功", response));
        } catch (Exception e) {
            log.error("推送设置更新失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("推送设置更新失败: " + e.getMessage()));
        }
    }

    /**
     * 删除设备
     */
    @DeleteMapping("/{deviceToken}")
    public ResponseEntity<ApiResponse<Void>> removeDevice(
            @PathVariable String deviceToken,
            Authentication authentication) {

        try {
            User user = userService.getCurrentUser(authentication);
            userDeviceService.removeDevice(user.getId(), deviceToken);

            return ResponseEntity.ok(ApiResponse.success("设备删除成功"));
        } catch (Exception e) {
            log.error("设备删除失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("设备删除失败: " + e.getMessage()));
        }
    }

    /**
     * 更新设备活跃时间
     */
    @PostMapping("/{deviceToken}/heartbeat")
    public ResponseEntity<ApiResponse<Void>> updateDeviceActiveTime(
            @PathVariable String deviceToken) {

        try {
            userDeviceService.updateDeviceActiveTime(deviceToken);
            return ResponseEntity.ok(ApiResponse.success("设备活跃时间更新成功"));
        } catch (Exception e) {
            log.error("设备活跃时间更新失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("设备活跃时间更新失败: " + e.getMessage()));
        }
    }
}
