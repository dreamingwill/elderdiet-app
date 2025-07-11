package com.elderdiet.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

/**
 * AI API请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiApiRequest {

    private String model;

    private List<AiMessage> messages;

    private Double temperature;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AiMessage {
        private String role;
        private Object content; // 可以是String（纯文本）或List<ContentItem>（多模态）
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ContentItem {
        private String type; // "text" or "image_url"
        private String text; // 当type为text时使用

        @JsonProperty("image_url")
        private ImageUrl imageUrl; // 当type为image_url时使用
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImageUrl {
        private String url;
    }
}