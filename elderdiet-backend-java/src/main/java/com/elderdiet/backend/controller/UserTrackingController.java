package com.elderdiet.backend.controller;

import com.elderdiet.backend.dto.TrackingRequest;
import com.elderdiet.backend.dto.TrackingResponse;
import com.elderdiet.backend.entity.TrackUserEvent;
import com.elderdiet.backend.entity.TrackUserSession;
import com.elderdiet.backend.entity.TrackPageVisit;
import com.elderdiet.backend.service.UserTrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.Optional;

/**
 * 用户追踪控制器
 * 提供用户行为追踪的API接口，支持宏观的用户活跃度分析
 */
@Slf4j
@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class UserTrackingController {

    private final UserTrackingService trackingService;

    // ========== 会话管理 ==========

    /**
     * 开始用户会话
     */
    @PostMapping("/session/start")
    public ResponseEntity<TrackingResponse.SessionResponse> startSession(
            @Valid @RequestBody TrackingRequest.SessionStartRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {

        try {
            String userId = authentication.getName();
            String ipAddress = getClientIpAddress(httpRequest);

            TrackUserSession session = trackingService.startSession(
                    userId,
                    request.getDeviceType(),
                    request.getDeviceModel(),
                    request.getOsVersion(),
                    request.getAppVersion(),
                    ipAddress,
                    request.getUserAgent());

            TrackingResponse.SessionResponse response = TrackingResponse.SessionResponse.builder()
                    .sessionId(session.getSessionId())
                    .userId(session.getUserId())
                    .startTime(session.getStartTime())
                    .deviceType(session.getDeviceType())
                    .isActive(session.getIsActive())
                    .status("success")
                    .message("会话开始成功")
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("开始会话失败", e);
            TrackingResponse.SessionResponse response = TrackingResponse.SessionResponse.builder()
                    .status("error")
                    .message("开始会话失败: " + e.getMessage())
                    .build();
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 结束用户会话
     */
    @PostMapping("/session/end")
    public ResponseEntity<TrackingResponse.GeneralResponse> endSession(
            @Valid @RequestBody TrackingRequest.SessionEndRequest request) {

        try {
            trackingService.endSession(request.getSessionId(), request.getReason());
            return ResponseEntity.ok(TrackingResponse.GeneralResponse.success("会话结束成功"));
        } catch (Exception e) {
            log.error("结束会话失败", e);
            return ResponseEntity.internalServerError()
                    .body(TrackingResponse.GeneralResponse.error("结束会话失败: " + e.getMessage()));
        }
    }

    /**
     * 获取当前活跃会话
     */
    @GetMapping("/session/current")
    public ResponseEntity<TrackingResponse.SessionResponse> getCurrentSession(Authentication authentication) {
        try {
            String userId = authentication.getName();
            Optional<TrackUserSession> sessionOpt = trackingService.getCurrentSession(userId);

            if (sessionOpt.isPresent()) {
                TrackUserSession session = sessionOpt.get();
                TrackingResponse.SessionResponse response = TrackingResponse.SessionResponse.builder()
                        .sessionId(session.getSessionId())
                        .userId(session.getUserId())
                        .startTime(session.getStartTime())
                        .deviceType(session.getDeviceType())
                        .isActive(session.getIsActive())
                        .status("success")
                        .message("获取当前会话成功")
                        .build();
                return ResponseEntity.ok(response);
            } else {
                TrackingResponse.SessionResponse response = TrackingResponse.SessionResponse.builder()
                        .status("success")
                        .message("当前无活跃会话")
                        .build();
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            log.error("获取当前会话失败", e);
            TrackingResponse.SessionResponse response = TrackingResponse.SessionResponse.builder()
                    .status("error")
                    .message("获取当前会话失败: " + e.getMessage())
                    .build();
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== 事件追踪 ==========

    /**
     * 追踪用户事件
     */
    @PostMapping("/event")
    public ResponseEntity<TrackingResponse.GeneralResponse> trackEvent(
            @Valid @RequestBody TrackingRequest.EventTrackRequest request,
            Authentication authentication) {

        try {
            String userId = authentication.getName();
            String sessionId = request.getSessionId();

            // 如果没有提供sessionId，尝试获取当前活跃会话
            if (sessionId == null) {
                Optional<TrackUserSession> currentSession = trackingService.getCurrentSession(userId);
                sessionId = currentSession.map(TrackUserSession::getSessionId).orElse("unknown");
            }

            trackingService.trackEvent(
                    userId,
                    sessionId,
                    request.getEventType(),
                    request.getEventName(),
                    request.getEventData(),
                    request.getResult() != null ? request.getResult() : "success",
                    request.getDeviceType());

            return ResponseEntity.ok(TrackingResponse.GeneralResponse.success("事件追踪成功"));
        } catch (Exception e) {
            log.error("事件追踪失败", e);
            return ResponseEntity.internalServerError()
                    .body(TrackingResponse.GeneralResponse.error("事件追踪失败: " + e.getMessage()));
        }
    }

    /**
     * Tab切换事件
     */
    @PostMapping("/event/tab-switch")
    public ResponseEntity<TrackingResponse.GeneralResponse> trackTabSwitch(
            @Valid @RequestBody TrackingRequest.TabSwitchRequest request,
            Authentication authentication) {

        try {
            String userId = authentication.getName();
            String sessionId = getSessionId(userId, request.getSessionId());

            Map<String, Object> eventData = Map.of(
                    "targetTab", request.getTargetTab(),
                    "previousTab", request.getPreviousTab() != null ? request.getPreviousTab() : "");

            trackingService.trackInteractionEvent(
                    userId,
                    sessionId,
                    TrackUserEvent.InteractionEvent.TAB_SWITCH,
                    eventData,
                    request.getDeviceType());

            return ResponseEntity.ok(TrackingResponse.GeneralResponse.success("Tab切换事件追踪成功"));
        } catch (Exception e) {
            log.error("Tab切换事件追踪失败", e);
            return ResponseEntity.internalServerError()
                    .body(TrackingResponse.GeneralResponse.error("Tab切换事件追踪失败: " + e.getMessage()));
        }
    }

    /**
     * 功能使用事件
     */
    @PostMapping("/event/feature")
    public ResponseEntity<TrackingResponse.GeneralResponse> trackFeatureUse(
            @Valid @RequestBody TrackingRequest.FeatureUseRequest request,
            Authentication authentication) {

        try {
            String userId = authentication.getName();
            String sessionId = getSessionId(userId, request.getSessionId());

            trackingService.trackFeatureEvent(
                    userId,
                    sessionId,
                    request.getFeatureName(),
                    request.getFeatureData(),
                    request.getResult() != null ? request.getResult() : "success",
                    request.getDeviceType());

            return ResponseEntity.ok(TrackingResponse.GeneralResponse.success("功能使用事件追踪成功"));
        } catch (Exception e) {
            log.error("功能使用事件追踪失败", e);
            return ResponseEntity.internalServerError()
                    .body(TrackingResponse.GeneralResponse.error("功能使用事件追踪失败: " + e.getMessage()));
        }
    }

    // ========== 页面访问追踪 ==========

    /**
     * 开始页面访问
     */
    @PostMapping("/page/start")
    public ResponseEntity<TrackingResponse.PageVisitResponse> startPageVisit(
            @Valid @RequestBody TrackingRequest.PageVisitStartRequest request,
            Authentication authentication) {

        try {
            String userId = authentication.getName();
            String sessionId = getSessionId(userId, request.getSessionId());

            TrackPageVisit pageVisit = trackingService.startPageVisit(
                    userId,
                    sessionId,
                    request.getPageName(),
                    request.getPageTitle(),
                    request.getRoute(),
                    request.getReferrer(),
                    request.getDeviceType());

            TrackingResponse.PageVisitResponse response = TrackingResponse.PageVisitResponse.builder()
                    .visitId(pageVisit.getId())
                    .pageName(pageVisit.getPageName())
                    .enterTime(pageVisit.getEnterTime())
                    .status("success")
                    .message("页面访问开始成功")
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("开始页面访问失败", e);
            TrackingResponse.PageVisitResponse response = TrackingResponse.PageVisitResponse.builder()
                    .status("error")
                    .message("开始页面访问失败: " + e.getMessage())
                    .build();
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 结束页面访问
     */
    @PostMapping("/page/end")
    public ResponseEntity<TrackingResponse.GeneralResponse> endPageVisit(
            @Valid @RequestBody TrackingRequest.PageVisitEndRequest request,
            Authentication authentication) {

        try {
            String userId = authentication.getName();
            trackingService.endPageVisit(userId, request.getPageName(), request.getExitReason());
            return ResponseEntity.ok(TrackingResponse.GeneralResponse.success("页面访问结束成功"));
        } catch (Exception e) {
            log.error("结束页面访问失败", e);
            return ResponseEntity.internalServerError()
                    .body(TrackingResponse.GeneralResponse.error("结束页面访问失败: " + e.getMessage()));
        }
    }

    // ========== 批量处理 ==========

    /**
     * 批量事件追踪
     */
    @PostMapping("/events/batch")
    public ResponseEntity<TrackingResponse.BatchResponse> batchTrackEvents(
            @Valid @RequestBody TrackingRequest.BatchEventRequest request,
            Authentication authentication) {

        try {
            String userId = authentication.getName();
            String sessionId = getSessionId(userId, request.getSessionId());

            int totalCount = request.getEvents().size();
            int successCount = 0;
            int failureCount = 0;

            for (TrackingRequest.EventTrackRequest event : request.getEvents()) {
                try {
                    trackingService.trackEvent(
                            userId,
                            sessionId,
                            event.getEventType(),
                            event.getEventName(),
                            event.getEventData(),
                            event.getResult() != null ? event.getResult() : "success",
                            request.getDeviceType());
                    successCount++;
                } catch (Exception e) {
                    failureCount++;
                    log.warn("批量事件追踪中单个事件失败: {}", event.getEventName(), e);
                }
            }

            String status = failureCount == 0 ? "success" : (successCount == 0 ? "error" : "partial");
            String message = String.format("批量事件追踪完成: 成功%d个，失败%d个", successCount, failureCount);

            TrackingResponse.BatchResponse response = TrackingResponse.BatchResponse.builder()
                    .totalCount(totalCount)
                    .successCount(successCount)
                    .failureCount(failureCount)
                    .status(status)
                    .message(message)
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("批量事件追踪失败", e);
            TrackingResponse.BatchResponse response = TrackingResponse.BatchResponse.builder()
                    .totalCount(0)
                    .successCount(0)
                    .failureCount(0)
                    .status("error")
                    .message("批量事件追踪失败: " + e.getMessage())
                    .build();
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ========== 辅助方法 ==========

    /**
     * 获取客户端IP地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    /**
     * 获取会话ID，如果未提供则获取当前活跃会话
     */
    private String getSessionId(String userId, String providedSessionId) {
        if (providedSessionId != null && !providedSessionId.isEmpty()) {
            return providedSessionId;
        }
        Optional<TrackUserSession> currentSession = trackingService.getCurrentSession(userId);
        return currentSession.map(TrackUserSession::getSessionId).orElse("unknown");
    }
}