package com.elderdiet.backend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "health_articles")
public class HealthArticle {

    @Id
    private String id;

    @Field("title")
    private String title;

    @Field("subtitle")
    private String subtitle;

    @Field("category")
    private String category;

    @Field("content")
    private Content content;

    @Field("read_time")
    private Integer readTime;

    @Field("tags")
    private List<String> tags;

    @Field("cover_image")
    private String coverImage;

    @Field("status")
    private Integer status;

    @Field("is_featured")
    private Integer isFeatured;

    @Field("is_carousel")
    private Integer isCarousel;

    @Field("carousel_order")
    private Integer carouselOrder;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("updated_at")
    private LocalDateTime updatedAt;

    // 内部类：内容结构
    public static class Content {
        private List<Paragraph> paragraphs;

        public List<Paragraph> getParagraphs() {
            return paragraphs;
        }

        public void setParagraphs(List<Paragraph> paragraphs) {
            this.paragraphs = paragraphs;
        }
    }

    // 内部类：段落结构
    public static class Paragraph {
        private String type; // "text" 或 "image"
        private String content; // 文本内容
        private String url; // 图片URL
        private String caption; // 图片说明
        private String altText; // 图片描述
        private Integer order; // 排序

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getCaption() {
            return caption;
        }

        public void setCaption(String caption) {
            this.caption = caption;
        }

        public String getAltText() {
            return altText;
        }

        public void setAltText(String altText) {
            this.altText = altText;
        }

        public Integer getOrder() {
            return order;
        }

        public void setOrder(Integer order) {
            this.order = order;
        }
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Content getContent() {
        return content;
    }

    public void setContent(Content content) {
        this.content = content;
    }

    public Integer getReadTime() {
        return readTime;
    }

    public void setReadTime(Integer readTime) {
        this.readTime = readTime;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Integer getIsFeatured() {
        return isFeatured;
    }

    public void setIsFeatured(Integer isFeatured) {
        this.isFeatured = isFeatured;
    }

    public Integer getIsCarousel() {
        return isCarousel;
    }

    public void setIsCarousel(Integer isCarousel) {
        this.isCarousel = isCarousel;
    }

    public Integer getCarouselOrder() {
        return carouselOrder;
    }

    public void setCarouselOrder(Integer carouselOrder) {
        this.carouselOrder = carouselOrder;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}