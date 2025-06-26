package com.elderdiet.backend.controller;

import com.elderdiet.backend.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 健康检查控制器
 */
@RestController
@RequestMapping("/api/v1")
public class HealthController {
    
    /**
     * 健康检查端点
     * GET /api/v1/health
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Void>> health() {
        return ResponseEntity.ok(ApiResponse.success("服务运行正常"));
    }
} 