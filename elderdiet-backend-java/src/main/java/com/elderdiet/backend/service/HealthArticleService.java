package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.HealthArticleResponse;
import com.elderdiet.backend.entity.HealthArticle;
import com.elderdiet.backend.repository.HealthArticleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class HealthArticleService {

    @Autowired
    private HealthArticleRepository healthArticleRepository;

    /**
     * 获取文章列表（分页）
     */
    public Page<HealthArticleResponse> getArticles(Integer page, Integer limit, String category, Integer isFeatured,
            Integer isCarousel) {
        Pageable pageable = PageRequest.of(page != null ? page : 0, limit != null ? limit : 10);

        Page<HealthArticle> articles;
        if (category != null && !category.isEmpty()) {
            articles = healthArticleRepository.findByCategoryAndStatus(category, 1, pageable);
        } else if (isFeatured != null) {
            articles = healthArticleRepository.findByIsFeaturedAndStatus(isFeatured, 1, pageable);
        } else if (isCarousel != null) {
            articles = healthArticleRepository.findByIsCarouselAndStatus(isCarousel, 1, pageable);
        } else {
            articles = healthArticleRepository.findByStatus(1, pageable);
        }

        return articles.map(HealthArticleResponse::new);
    }

    /**
     * 获取单篇文章详情
     */
    public Optional<HealthArticleResponse> getArticle(String id) {
        Optional<HealthArticle> article = healthArticleRepository.findById(id);
        return article.map(HealthArticleResponse::new);
    }

    /**
     * 获取轮播图文章
     */
    public List<HealthArticleResponse> getCarouselArticles() {
        List<HealthArticle> articles = healthArticleRepository.findByIsCarouselAndStatusOrderByCarouselOrderAsc(1, 1);
        return articles.stream()
                .map(HealthArticleResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 获取推荐文章
     */
    public List<HealthArticleResponse> getFeaturedArticles(Integer limit) {
        int pageSize = limit != null ? limit : 10;
        Pageable pageable = PageRequest.of(0, pageSize);

        List<HealthArticle> articles = healthArticleRepository.findFeaturedArticlesWithLimit(1, 1, pageable);
        return articles.stream()
                .map(HealthArticleResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 获取文章分类
     */
    public List<String> getCategories() {
        List<HealthArticle> articles = healthArticleRepository.findAllCategories();
        return articles.stream()
                .map(HealthArticle::getCategory)
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * 根据分类获取文章
     */
    public List<HealthArticleResponse> getArticlesByCategory(String category) {
        List<HealthArticle> articles = healthArticleRepository.findByCategoryAndStatus(category, 1);
        return articles.stream()
                .map(HealthArticleResponse::new)
                .collect(Collectors.toList());
    }
}