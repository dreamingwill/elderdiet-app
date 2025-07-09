package com.elderdiet.backend.dto;

import com.elderdiet.backend.entity.HealthArticle;
import java.time.LocalDateTime;
import java.util.List;

public class HealthArticleResponse {
    private String id;
    private String title;
    private String subtitle;
    private String category;
    private HealthArticle.Content content;
    private Integer readTime;
    private List<String> tags;
    private String coverImage;
    private Integer status;
    private Integer isFeatured;
    private Integer isCarousel;
    private Integer carouselOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 构造函数
    public HealthArticleResponse() {
    }

    public HealthArticleResponse(HealthArticle article) {
        this.id = article.getId();
        this.title = article.getTitle();
        this.subtitle = article.getSubtitle();
        this.category = article.getCategory();
        this.content = article.getContent();
        this.readTime = article.getReadTime();
        this.tags = article.getTags();
        this.coverImage = article.getCoverImage();
        this.status = article.getStatus();
        this.isFeatured = article.getIsFeatured();
        this.isCarousel = article.getIsCarousel();
        this.carouselOrder = article.getCarouselOrder();
        this.createdAt = article.getCreatedAt();
        this.updatedAt = article.getUpdatedAt();
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

    public HealthArticle.Content getContent() {
        return content;
    }

    public void setContent(HealthArticle.Content content) {
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