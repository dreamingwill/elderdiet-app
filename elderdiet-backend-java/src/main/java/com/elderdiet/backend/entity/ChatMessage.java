package com.elderdiet.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

/**
 * 聊天消息实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "chat_messages")
public class ChatMessage {

    @Id
    private String id;

    @NotBlank(message = "用户ID不能为空")
    @Indexed
    private String userId;

    @NotBlank(message = "角色不能为空")
    private String role; // "user" or "assistant"

    @NotBlank(message = "消息类型不能为空")
    private String type; // "text" or "image"

    // 文本消息内容
    private String content;

    // 图片消息的图片URL列表
    private List<String> imageUrls;

    @NotNull(message = "时间戳不能为空")
    @CreatedDate
    private Instant timestamp;

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

    /**
     * 检查是否为用户消息
     */
    public boolean isUserMessage() {
        return "user".equals(role);
    }

    /**
     * 检查是否为AI助手消息
     */
    public boolean isAssistantMessage() {
        return "assistant".equals(role);
    }
}