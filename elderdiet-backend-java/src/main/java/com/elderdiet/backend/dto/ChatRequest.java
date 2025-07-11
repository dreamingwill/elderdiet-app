package com.elderdiet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * 聊天请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequest {

    @NotBlank(message = "消息类型不能为空")
    private String type; // "text" or "image"

    // 文本消息内容（当type为text时必填）
    private String content;

    // 图片URL列表（当type为image时必填）
    private List<String> imageUrls;

    /**
     * 检查是否为文本消息
     */
    public boolean isTextMessage() {
        return "text".equals(type);
    }

    /**
     * 检查是否为图片消息
     */
    public boolean isImageMessage() {
        return "image".equals(type);
    }
}