package com.elderdiet.backend.service;

import com.elderdiet.backend.entity.TrackUserEvent;
import com.elderdiet.backend.entity.TrackUserSession;
import com.elderdiet.backend.entity.TrackPageVisit;
import com.elderdiet.backend.repository.TrackUserEventRepository;
import com.elderdiet.backend.repository.TrackUserSessionRepository;
import com.elderdiet.backend.repository.TrackPageVisitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * 用户追踪服务
 * 提供统一的用户行为追踪功能，支持宏观的用户活跃度分析
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserTrackingService {

    private final TrackUserSessionRepository sessionRepository;
    private final TrackUserEventRepository eventRepository;
    private final TrackPageVisitRepository pageVisitRepository;

    // ========== 会话管理 ==========

    /**
     * 开始用户会话
     */
    public TrackUserSession startSession(String userId, String deviceType, String deviceModel,
            String osVersion, String appVersion, String ipAddress, String userAgent) {
        try {
            // 结束用户之前的活跃会话
            endActiveSessions(userId);

            String sessionId = UUID.randomUUID().toString();

            TrackUserSession session = TrackUserSession.builder()
                    .userId(userId)
                    .sessionId(sessionId)
                    .startTime(LocalDateTime.now())
                    .deviceType(deviceType)
                    .deviceModel(deviceModel)
                    .osVersion(osVersion)
                    .appVersion(appVersion)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .isActive(true)
                    .build();

            TrackUserSession savedSession = sessionRepository.save(session);

            // 记录会话开始事件
            trackEvent(userId, sessionId, TrackUserEvent.EventType.AUTH,
                    TrackUserEvent.AuthEvent.SESSION_START, null, "success", deviceType);

            log.info("用户会话开始: userId={}, sessionId={}, deviceType={}", userId, sessionId, deviceType);
            return savedSession;

        } catch (Exception e) {
            log.error("开始用户会话失败: userId={}", userId, e);
            throw new RuntimeException("开始用户会话失败", e);
        }
    }

    /**
     * 结束用户会话
     */
    public void endSession(String sessionId, String reason) {
        try {
            Optional<TrackUserSession> sessionOpt = sessionRepository.findBySessionId(sessionId);
            if (sessionOpt.isPresent()) {
                TrackUserSession session = sessionOpt.get();
                session.endSession(reason);
                sessionRepository.save(session);

                // 记录会话结束事件
                trackEvent(session.getUserId(), sessionId, TrackUserEvent.EventType.AUTH,
                        TrackUserEvent.AuthEvent.SESSION_END, null, "success", session.getDeviceType());

                log.info("用户会话结束: sessionId={}, reason={}, duration={}",
                        sessionId, reason, session.getDuration());
            }
        } catch (Exception e) {
            log.error("结束用户会话失败: sessionId={}", sessionId, e);
        }
    }

    /**
     * 结束用户的所有活跃会话
     */
    private void endActiveSessions(String userId) {
        try {
            List<TrackUserSession> activeSessions = sessionRepository.findByUserIdAndIsActiveTrue(userId);
            for (TrackUserSession session : activeSessions) {
                session.endSession("new_session_started");
                sessionRepository.save(session);
            }
        } catch (Exception e) {
            log.error("结束活跃会话失败: userId={}", userId, e);
        }
    }

    // ========== 事件追踪 ==========

    /**
     * 追踪用户事件
     */
    public void trackEvent(String userId, String sessionId, String eventType, String eventName,
            Map<String, Object> eventData, String result, String deviceType) {
        try {
            TrackUserEvent event = TrackUserEvent.builder()
                    .userId(userId)
                    .sessionId(sessionId)
                    .eventType(eventType)
                    .eventName(eventName)
                    .timestamp(LocalDateTime.now())
                    .eventData(eventData)
                    .result(result)
                    .deviceType(deviceType)
                    .build();

            eventRepository.save(event);

            log.debug("事件追踪成功: userId={}, eventType={}, eventName={}", userId, eventType, eventName);

        } catch (Exception e) {
            log.error("事件追踪失败: userId={}, eventType={}, eventName={}", userId, eventType, eventName, e);
        }
    }

    /**
     * 追踪认证事件
     */
    public void trackAuthEvent(String userId, String sessionId, String eventName, String result, String deviceType) {
        trackEvent(userId, sessionId, TrackUserEvent.EventType.AUTH, eventName, null, result, deviceType);
    }

    /**
     * 追踪功能使用事件
     */
    public void trackFeatureEvent(String userId, String sessionId, String eventName,
            Map<String, Object> eventData, String result, String deviceType) {
        trackEvent(userId, sessionId, TrackUserEvent.EventType.FEATURE_USE, eventName, eventData, result, deviceType);
    }

    /**
     * 追踪交互事件
     */
    public void trackInteractionEvent(String userId, String sessionId, String eventName,
            Map<String, Object> eventData, String deviceType) {
        trackEvent(userId, sessionId, TrackUserEvent.EventType.INTERACTION, eventName, eventData, "success",
                deviceType);
    }

    // ========== 页面访问追踪 ==========

    /**
     * 开始页面访问
     */
    public TrackPageVisit startPageVisit(String userId, String sessionId, String pageName,
            String pageTitle, String route, String referrer, String deviceType) {
        try {
            // 结束用户当前打开的页面
            endCurrentPageVisits(userId);

            TrackPageVisit pageVisit = TrackPageVisit.builder()
                    .userId(userId)
                    .sessionId(sessionId)
                    .pageName(pageName)
                    .pageTitle(pageTitle)
                    .route(route)
                    .enterTime(LocalDateTime.now())
                    .referrer(referrer)
                    .deviceType(deviceType)
                    .build();

            TrackPageVisit savedPageVisit = pageVisitRepository.save(pageVisit);

            // 记录页面访问事件
            Map<String, Object> eventData = Map.of(
                    "pageName", pageName,
                    "route", route != null ? route : "",
                    "referrer", referrer != null ? referrer : "");
            trackInteractionEvent(userId, sessionId, TrackUserEvent.InteractionEvent.PAGE_VIEW, eventData, deviceType);

            log.debug("页面访问开始: userId={}, pageName={}", userId, pageName);
            return savedPageVisit;

        } catch (Exception e) {
            log.error("开始页面访问失败: userId={}, pageName={}", userId, pageName, e);
            throw new RuntimeException("开始页面访问失败", e);
        }
    }

    /**
     * 结束页面访问
     */
    public void endPageVisit(String userId, String pageName, String exitReason) {
        try {
            // 查找用户当前在该页面的访问记录
            List<TrackPageVisit> currentVisits = pageVisitRepository.findByUserIdAndExitTimeIsNull(userId);

            for (TrackPageVisit visit : currentVisits) {
                if (pageName == null || pageName.equals(visit.getPageName())) {
                    visit.exitPage(exitReason);
                    pageVisitRepository.save(visit);

                    log.debug("页面访问结束: userId={}, pageName={}, duration={}",
                            userId, visit.getPageName(), visit.getDuration());
                }
            }
        } catch (Exception e) {
            log.error("结束页面访问失败: userId={}, pageName={}", userId, pageName, e);
        }
    }

    /**
     * 结束用户当前所有打开的页面
     */
    private void endCurrentPageVisits(String userId) {
        try {
            List<TrackPageVisit> currentVisits = pageVisitRepository.findByUserIdAndExitTimeIsNull(userId);
            for (TrackPageVisit visit : currentVisits) {
                visit.exitPage("navigation");
                pageVisitRepository.save(visit);
            }
        } catch (Exception e) {
            log.error("结束当前页面访问失败: userId={}", userId, e);
        }
    }

    // ========== 便捷方法 ==========

    /**
     * 获取用户当前活跃会话
     */
    public Optional<TrackUserSession> getCurrentSession(String userId) {
        return sessionRepository.findTopByUserIdOrderByStartTimeDesc(userId)
                .filter(session -> session.getIsActive());
    }

    /**
     * 获取用户最近的事件
     */
    public List<TrackUserEvent> getRecentEvents(String userId, int limit) {
        if (limit <= 10) {
            return eventRepository.findTop10ByUserIdOrderByTimestampDesc(userId);
        }
        return eventRepository.findByUserIdAndEventTypeOrderByTimestampDesc(userId, null)
                .stream()
                .limit(limit)
                .toList();
    }

    /**
     * 检查用户是否在线
     */
    public boolean isUserOnline(String userId) {
        List<TrackUserSession> activeSessions = sessionRepository.findByUserIdAndIsActiveTrue(userId);
        return !activeSessions.isEmpty();
    }
}