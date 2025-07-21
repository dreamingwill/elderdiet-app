package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.HealthArticleResponse;
import com.elderdiet.backend.entity.HealthArticle;
import com.elderdiet.backend.repository.HealthArticleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Collections;
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
     * 获取轮播图文章（带随机性）
     */
    public List<HealthArticleResponse> getCarouselArticles() {
        // 获取所有轮播图文章
        List<HealthArticle> allCarouselArticles = healthArticleRepository
                .findByIsCarouselAndStatusOrderByCreatedAtDesc(1, 1);

        // 如果轮播图文章数量较少（<=5），直接返回所有文章但随机排序
        if (allCarouselArticles.size() <= 5) {
            Collections.shuffle(allCarouselArticles);
            return allCarouselArticles.stream()
                    .map(HealthArticleResponse::new)
                    .collect(Collectors.toList());
        }

        // 如果轮播图文章较多，随机选择5个
        Collections.shuffle(allCarouselArticles);
        return allCarouselArticles.stream()
                .limit(5) // 轮播图通常显示3-5个
                .map(HealthArticleResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 获取推荐文章（带随机性）
     */
    public List<HealthArticleResponse> getFeaturedArticles(Integer limit) {
        int requestedSize = limit != null ? limit : 10;

        // 获取所有推荐文章
        List<HealthArticle> allFeaturedArticles = healthArticleRepository
                .findByIsFeaturedAndStatusOrderByCreatedAtDesc(1, 1);

        // 如果推荐文章数量不足，直接返回所有文章
        if (allFeaturedArticles.size() <= requestedSize) {
            return allFeaturedArticles.stream()
                    .map(HealthArticleResponse::new)
                    .collect(Collectors.toList());
        }

        // 如果推荐文章数量较多，为了增加随机性，获取比请求数量多一些的文章
        // 然后从中随机选择，这样既保证了随机性，又避免了获取过多数据
        int fetchSize = Math.min(allFeaturedArticles.size(), requestedSize * 3); // 获取3倍数量或全部
        List<HealthArticle> candidateArticles = allFeaturedArticles.subList(0, fetchSize);

        // 随机打乱候选文章列表
        Collections.shuffle(candidateArticles);

        // 取前N个文章
        return candidateArticles.stream()
                .limit(requestedSize)
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