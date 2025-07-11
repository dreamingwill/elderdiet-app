package com.elderdiet.backend.controller;

import com.elderdiet.backend.dto.ApiResponse;
import com.elderdiet.backend.dto.ChatRequest;
import com.elderdiet.backend.dto.ChatResponse;
import com.elderdiet.backend.entity.ChatMessage;
import com.elderdiet.backend.service.ChatService;
import com.elderdiet.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;

/**
 * 聊天控制器
 */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

        private final ChatService chatService;
        private final JwtUtil jwtUtil;

        /**
         * 发送聊天消息
         */
        @PostMapping
        public ResponseEntity<ApiResponse<ChatResponse>> sendMessage(
                        @Valid @RequestBody ChatRequest request,
                        HttpServletRequest httpRequest) {

                try {
                        log.info("收到聊天消息请求: type={}, content={}", request.getType(),
                                        request.getContent() != null
                                                        ? request.getContent().substring(0,
                                                                        Math.min(request.getContent().length(), 50))
                                                        : "null");

                        // 从请求头中获取JWT token
                        String token = extractTokenFromRequest(httpRequest);
                        if (token == null) {
                                log.warn("聊天请求缺少认证token");
                                return ResponseEntity.status(401)
                                                .body(ApiResponse.<ChatResponse>builder()
                                                                .success(false)
                                                                .message("未提供认证token")
                                                                .build());
                        }

                        // 验证token并获取用户ID
                        if (!jwtUtil.validateToken(token)) {
                                log.warn("聊天请求使用了无效的认证token");
                                return ResponseEntity.status(401)
                                                .body(ApiResponse.<ChatResponse>builder()
                                                                .success(false)
                                                                .message("无效的认证token")
                                                                .build());
                        }

                        String userId = jwtUtil.getUidFromToken(token);
                        log.info("用户 {} 发送聊天消息", userId);

                        // 验证请求内容
                        if (request.isTextMessage()
                                        && (request.getContent() == null || request.getContent().trim().isEmpty())) {
                                log.warn("文本消息内容为空");
                                return ResponseEntity.badRequest()
                                                .body(ApiResponse.<ChatResponse>builder()
                                                                .success(false)
                                                                .message("文本消息内容不能为空")
                                                                .build());
                        }

                        if (request.isImageMessage()
                                        && (request.getImageUrls() == null || request.getImageUrls().isEmpty())) {
                                log.warn("图片消息缺少图片URL");
                                return ResponseEntity.badRequest()
                                                .body(ApiResponse.<ChatResponse>builder()
                                                                .success(false)
                                                                .message("图片消息必须包含至少一个图片URL")
                                                                .build());
                        }

                        // 处理聊天消息
                        ChatResponse response = chatService.handleChatMessage(request, userId);
                        log.info("聊天消息处理成功，响应长度: {}", response.getResponse().length());

                        return ResponseEntity.ok(ApiResponse.<ChatResponse>builder()
                                        .success(true)
                                        .message("消息发送成功")
                                        .data(response)
                                        .build());

                } catch (IllegalArgumentException e) {
                        log.error("聊天消息请求参数错误: {}", e.getMessage());
                        return ResponseEntity.badRequest()
                                        .body(ApiResponse.<ChatResponse>builder()
                                                        .success(false)
                                                        .message("请求参数错误: " + e.getMessage())
                                                        .build());
                } catch (Exception e) {
                        log.error("发送聊天消息时出错: {}", e.getMessage(), e);
                        return ResponseEntity.status(500)
                                        .body(ApiResponse.<ChatResponse>builder()
                                                        .success(false)
                                                        .message("服务器内部错误，请稍后重试")
                                                        .build());
                }
        }

        /**
         * 获取聊天历史记录
         */
        @GetMapping("/history")
        public ResponseEntity<ApiResponse<List<ChatMessage>>> getChatHistory(
                        @RequestParam(value = "since_timestamp", required = false) Long sinceTimestamp,
                        HttpServletRequest httpRequest) {

                try {
                        // 从请求头中获取JWT token
                        String token = extractTokenFromRequest(httpRequest);
                        if (token == null) {
                                return ResponseEntity.status(401)
                                                .body(ApiResponse.<List<ChatMessage>>builder()
                                                                .success(false)
                                                                .message("未提供认证token")
                                                                .build());
                        }

                        // 验证token并获取用户ID
                        if (!jwtUtil.validateToken(token)) {
                                return ResponseEntity.status(401)
                                                .body(ApiResponse.<List<ChatMessage>>builder()
                                                                .success(false)
                                                                .message("无效的认证token")
                                                                .build());
                        }

                        String userId = jwtUtil.getUidFromToken(token);

                        // 获取聊天历史记录
                        List<ChatMessage> messages;
                        if (sinceTimestamp != null) {
                                java.time.Instant instant = java.time.Instant.ofEpochMilli(sinceTimestamp);
                                messages = chatService.getChatMessages(userId, instant);
                        } else {
                                messages = chatService.getChatMessages(userId);
                        }

                        return ResponseEntity.ok(ApiResponse.<List<ChatMessage>>builder()
                                        .success(true)
                                        .message("获取聊天历史成功")
                                        .data(messages)
                                        .build());

                } catch (Exception e) {
                        log.error("获取聊天历史时出错: {}", e.getMessage(), e);
                        return ResponseEntity.status(500)
                                        .body(ApiResponse.<List<ChatMessage>>builder()
                                                        .success(false)
                                                        .message("服务器内部错误: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * 清空聊天历史记录
         */
        @DeleteMapping("/history")
        public ResponseEntity<ApiResponse<Void>> clearChatHistory(
                        HttpServletRequest httpRequest) {

                try {
                        // 从请求头中获取JWT token
                        String token = extractTokenFromRequest(httpRequest);
                        if (token == null) {
                                return ResponseEntity.status(401)
                                                .body(ApiResponse.<Void>builder()
                                                                .success(false)
                                                                .message("未提供认证token")
                                                                .build());
                        }

                        // 验证token并获取用户ID
                        if (!jwtUtil.validateToken(token)) {
                                return ResponseEntity.status(401)
                                                .body(ApiResponse.<Void>builder()
                                                                .success(false)
                                                                .message("无效的认证token")
                                                                .build());
                        }

                        String userId = jwtUtil.getUidFromToken(token);

                        // 清空聊天历史记录
                        chatService.clearChatHistory(userId);

                        return ResponseEntity.ok(ApiResponse.<Void>builder()
                                        .success(true)
                                        .message("聊天历史清空成功")
                                        .build());

                } catch (Exception e) {
                        log.error("清空聊天历史时出错: {}", e.getMessage(), e);
                        return ResponseEntity.status(500)
                                        .body(ApiResponse.<Void>builder()
                                                        .success(false)
                                                        .message("服务器内部错误: " + e.getMessage())
                                                        .build());
                }
        }

        /**
         * 从请求头中提取JWT token
         */
        private String extractTokenFromRequest(HttpServletRequest request) {
                String bearerToken = request.getHeader("Authorization");
                if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                        return bearerToken.substring(7);
                }
                return null;
        }
}