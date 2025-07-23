package com.elderdiet.backend.controller;

import com.elderdiet.backend.dto.ApiResponse;
import com.elderdiet.backend.entity.PushRecord;

import com.elderdiet.backend.repository.PushRecordRepository;
import com.elderdiet.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 推送管理控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/push")
@RequiredArgsConstructor
public class PushManagementController {

    private final PushRecordRepository pushRecordRepository;
    private final UserService userService;

    /**
     * 获取用户的推送历史记录
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Page<PushRecord>>> getPushHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        try {
            // 验证用户认证
            userService.getCurrentUser(authentication);
            Pageable pageable = PageRequest.of(page, size);

            // 获取与当前用户相关的推送记录
            Page<PushRecord> pushHistory = pushRecordRepository.findByOrderByCreatedAtDesc(pageable);

            return ResponseEntity.ok(ApiResponse.success("获取推送历史成功", pushHistory));
        } catch (Exception e) {
            log.error("获取推送历史失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取推送历史失败: " + e.getMessage()));
        }
    }

    /**
     * 获取推送统计信息
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPushStatistics(
            Authentication authentication) {

        try {
            // 验证用户认证
            userService.getCurrentUser(authentication);

            // 获取最近30天的统计
            LocalDateTime startTime = LocalDateTime.now().minusDays(30);
            LocalDateTime endTime = LocalDateTime.now();

            List<PushRecord> recentRecords = pushRecordRepository.findByCreatedAtBetween(startTime, endTime);

            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalRecords", recentRecords.size());
            statistics.put("successRecords", recentRecords.stream()
                    .mapToInt(record -> record.getSuccessCount() != null ? record.getSuccessCount() : 0)
                    .sum());
            statistics.put("failedRecords", recentRecords.stream()
                    .mapToInt(record -> record.getFailureCount() != null ? record.getFailureCount() : 0)
                    .sum());

            // 按类型统计
            Map<String, Long> typeStatistics = new HashMap<>();
            for (PushRecord.PushType type : PushRecord.PushType.values()) {
                long count = recentRecords.stream()
                        .filter(record -> record.getPushType() == type)
                        .count();
                typeStatistics.put(type.name(), count);
            }
            statistics.put("typeStatistics", typeStatistics);

            return ResponseEntity.ok(ApiResponse.success("获取推送统计成功", statistics));
        } catch (Exception e) {
            log.error("获取推送统计失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取推送统计失败: " + e.getMessage()));
        }
    }

    /**
     * 获取推送记录详情
     */
    @GetMapping("/records/{recordId}")
    public ResponseEntity<ApiResponse<PushRecord>> getPushRecordDetail(
            @PathVariable String recordId,
            Authentication authentication) {

        try {
            // 验证用户认证
            userService.getCurrentUser(authentication);

            PushRecord pushRecord = pushRecordRepository.findById(recordId)
                    .orElseThrow(() -> new RuntimeException("推送记录不存在"));

            return ResponseEntity.ok(ApiResponse.success("获取推送记录详情成功", pushRecord));
        } catch (Exception e) {
            log.error("获取推送记录详情失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取推送记录详情失败: " + e.getMessage()));
        }
    }

    /**
     * 获取失败的推送记录
     */
    @GetMapping("/failed")
    @PreAuthorize("hasAuthority('ROLE_ELDER') or hasAuthority('ROLE_CHILD')")
    public ResponseEntity<ApiResponse<List<PushRecord>>> getFailedPushRecords(
            Authentication authentication) {

        try {
            // 验证用户认证
            userService.getCurrentUser(authentication);

            List<PushRecord> failedRecords = pushRecordRepository.findFailedRecords();

            return ResponseEntity.ok(ApiResponse.success("获取失败推送记录成功", failedRecords));
        } catch (Exception e) {
            log.error("获取失败推送记录失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取失败推送记录失败: " + e.getMessage()));
        }
    }

    /**
     * 检查推送服务状态
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPushServiceStatus() {
        try {
            Map<String, Object> status = new HashMap<>();

            // 检查最近的推送记录
            LocalDateTime recentTime = LocalDateTime.now().minusHours(1);
            List<PushRecord> recentRecords = pushRecordRepository.findByCreatedAtBetween(recentTime,
                    LocalDateTime.now());

            status.put("isActive", !recentRecords.isEmpty());
            status.put("recentRecordsCount", recentRecords.size());
            status.put("lastPushTime", recentRecords.isEmpty() ? null
                    : recentRecords.stream()
                            .map(PushRecord::getCreatedAt)
                            .max(LocalDateTime::compareTo)
                            .orElse(null));

            return ResponseEntity.ok(ApiResponse.success("获取推送服务状态成功", status));
        } catch (Exception e) {
            log.error("获取推送服务状态失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取推送服务状态失败: " + e.getMessage()));
        }
    }
}
