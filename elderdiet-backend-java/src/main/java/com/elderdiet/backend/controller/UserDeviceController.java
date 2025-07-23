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
            User user = userService.getCurrentUser(authentication);
            UserDeviceResponse response = userDeviceService.registerDevice(user, request);

            return ResponseEntity.ok(ApiResponse.success("设备注册成功", response));
        } catch (Exception e) {
            log.error("设备注册失败: {}", e.getMessage(), e);
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
