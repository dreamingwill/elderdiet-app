package com.elderdiet.backend.controller;

import com.elderdiet.backend.dto.ApiResponse;
import com.elderdiet.backend.dto.HealthArticleResponse;
import com.elderdiet.backend.service.HealthArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/health-articles")
@CrossOrigin(origins = "*")
public class HealthArticleController {

    @Autowired
    private HealthArticleService healthArticleService;

    /**
     * 获取文章列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<HealthArticleResponse>>> getArticles(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer isFeatured,
            @RequestParam(required = false) Integer isCarousel) {

        try {
            Page<HealthArticleResponse> articles = healthArticleService.getArticles(page, limit, category, isFeatured,
                    isCarousel);

            return ResponseEntity.ok(ApiResponse.success("获取文章列表成功", articles));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("获取文章列表失败: " + e.getMessage()));
        }
    }

    /**
     * 获取单篇文章详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HealthArticleResponse>> getArticle(@PathVariable String id) {
        try {
            return healthArticleService.getArticle(id)
                    .map(article -> ResponseEntity.ok(ApiResponse.success("获取文章详情成功", article)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("获取文章详情失败: " + e.getMessage()));
        }
    }

    /**
     * 获取轮播图文章
     */
    @GetMapping("/carousel")
    public ResponseEntity<ApiResponse<List<HealthArticleResponse>>> getCarouselArticles() {
        try {
            List<HealthArticleResponse> articles = healthArticleService.getCarouselArticles();

            return ResponseEntity.ok(ApiResponse.success("获取轮播图文章成功", articles));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("获取轮播图文章失败: " + e.getMessage()));
        }
    }

    /**
     * 获取推荐文章
     */
    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<HealthArticleResponse>>> getFeaturedArticles(
            @RequestParam(required = false) Integer limit) {
        try {
            List<HealthArticleResponse> articles = healthArticleService.getFeaturedArticles(limit);

            return ResponseEntity.ok(ApiResponse.success("获取推荐文章成功", articles));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("获取推荐文章失败: " + e.getMessage()));
        }
    }

    /**
     * 获取文章分类
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        try {
            List<String> categories = healthArticleService.getCategories();

            return ResponseEntity.ok(ApiResponse.success("获取文章分类成功", categories));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("获取文章分类失败: " + e.getMessage()));
        }
    }

    /**
     * 根据分类获取文章
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<HealthArticleResponse>>> getArticlesByCategory(
            @PathVariable String category) {
        try {
            List<HealthArticleResponse> articles = healthArticleService.getArticlesByCategory(category);

            return ResponseEntity.ok(ApiResponse.success("获取分类文章成功", articles));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("获取分类文章失败: " + e.getMessage()));
        }
    }
}