package com.elderdiet.backend.exception;

import com.elderdiet.backend.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.HashMap;
import java.util.Map;
import org.springframework.security.access.AccessDeniedException;

/**
 * 全局异常处理器
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

        /**
         * 处理参数验证异常
         */
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
                        MethodArgumentNotValidException ex) {
                Map<String, String> errors = new HashMap<>();
                ex.getBindingResult().getAllErrors().forEach((error) -> {
                        String fieldName = ((FieldError) error).getField();
                        String errorMessage = error.getDefaultMessage();
                        errors.put(fieldName, errorMessage);
                });

                String message = errors.values().iterator().next(); // 取第一个错误消息
                log.warn("参数验证失败: {}", message);

                return ResponseEntity.badRequest()
                                .body(ApiResponse.error(message, errors));
        }

        /**
         * 处理绑定异常
         */
        @ExceptionHandler(BindException.class)
        public ResponseEntity<ApiResponse<Map<String, String>>> handleBindException(
                        BindException ex) {
                Map<String, String> errors = new HashMap<>();
                ex.getBindingResult().getAllErrors().forEach((error) -> {
                        String fieldName = ((FieldError) error).getField();
                        String errorMessage = error.getDefaultMessage();
                        errors.put(fieldName, errorMessage);
                });

                String message = errors.values().iterator().next(); // 取第一个错误消息
                log.warn("数据绑定失败: {}", message);

                return ResponseEntity.badRequest()
                                .body(ApiResponse.error(message, errors));
        }

        /**
         * 处理约束违反异常
         */
        @ExceptionHandler(ConstraintViolationException.class)
        public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolationException(
                        ConstraintViolationException ex) {
                Map<String, String> errors = new HashMap<>();
                for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
                        String fieldName = violation.getPropertyPath().toString();
                        String errorMessage = violation.getMessage();
                        errors.put(fieldName, errorMessage);
                }

                String message = errors.values().iterator().next(); // 取第一个错误消息
                log.warn("约束验证失败: {}", message);

                return ResponseEntity.badRequest()
                                .body(ApiResponse.error(message, errors));
        }

        /**
         * 处理认证失败异常
         */
        @ExceptionHandler(BadCredentialsException.class)
        public ResponseEntity<ApiResponse<Void>> handleBadCredentialsException(
                        BadCredentialsException ex) {
                log.warn("认证失败: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(ApiResponse.error("手机号或密码错误"));
        }

        /**
         * 处理权限不足异常
         */
        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(
                        AccessDeniedException ex) {
                log.warn("访问被拒绝: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(ApiResponse.error("没有权限执行此操作"));
        }

        /**
         * 处理用户不存在异常
         */
        @ExceptionHandler(UsernameNotFoundException.class)
        public ResponseEntity<ApiResponse<Void>> handleUsernameNotFoundException(
                        UsernameNotFoundException ex) {
                log.warn("用户不存在: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(ApiResponse.error("用户不存在"));
        }

        /**
         * 处理运行时异常
         */
        @ExceptionHandler(RuntimeException.class)
        public ResponseEntity<ApiResponse<Void>> handleRuntimeException(
                        RuntimeException ex) {
                log.error("运行时异常: ", ex);

                // 根据具体的异常消息返回不同的错误码
                if (ex.getMessage() != null) {
                        if (ex.getMessage().contains("已注册")) {
                                return ResponseEntity.status(HttpStatus.CONFLICT)
                                                .body(ApiResponse.error(ex.getMessage()));
                        }
                        if (ex.getMessage().contains("不存在")) {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ApiResponse.error(ex.getMessage()));
                        }
                }

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(ApiResponse.error("服务器内部错误"));
        }

        /**
         * 处理所有其他异常
         */
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Void>> handleGenericException(
                        Exception ex) {
                log.error("未处理的异常: ", ex);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(ApiResponse.error("服务器内部错误"));
        }
}