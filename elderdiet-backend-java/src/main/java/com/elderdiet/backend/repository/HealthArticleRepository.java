package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.HealthArticle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthArticleRepository extends MongoRepository<HealthArticle, String> {

    /**
     * 根据状态查找文章
     */
    List<HealthArticle> findByStatus(Integer status);

    /**
     * 根据分类查找文章
     */
    List<HealthArticle> findByCategoryAndStatus(String category, Integer status);

    /**
     * 查找推荐文章
     */
    List<HealthArticle> findByIsFeaturedAndStatus(Integer isFeatured, Integer status);

    /**
     * 查找轮播图文章
     */
    List<HealthArticle> findByIsCarouselAndStatus(Integer isCarousel, Integer status);

    /**
     * 查找轮播图文章并按排序字段排序
     */
    List<HealthArticle> findByIsCarouselAndStatusOrderByCarouselOrderAsc(Integer isCarousel, Integer status);

    /**
     * 分页查找文章
     */
    Page<HealthArticle> findByStatus(Integer status, Pageable pageable);

    /**
     * 根据分类分页查找文章
     */
    Page<HealthArticle> findByCategoryAndStatus(String category, Integer status, Pageable pageable);

    /**
     * 根据推荐状态分页查找文章
     */
    Page<HealthArticle> findByIsFeaturedAndStatus(Integer isFeatured, Integer status, Pageable pageable);

    /**
     * 根据轮播状态分页查找文章
     */
    Page<HealthArticle> findByIsCarouselAndStatus(Integer isCarousel, Integer status, Pageable pageable);

    /**
     * 查找推荐文章并限制数量
     */
    @Query(value = "{'is_featured': ?0, 'status': ?1}", sort = "{'created_at': -1}")
    List<HealthArticle> findFeaturedArticlesWithLimit(Integer isFeatured, Integer status, Pageable pageable);

    /**
     * 查找所有推荐文章（用于随机选择）
     */
    List<HealthArticle> findByIsFeaturedAndStatusOrderByCreatedAtDesc(Integer isFeatured, Integer status);

    /**
     * 查找所有轮播图文章（用于随机选择）
     */
    List<HealthArticle> findByIsCarouselAndStatusOrderByCreatedAtDesc(Integer isCarousel, Integer status);

    /**
     * 获取所有分类
     */
    @Query(value = "{}", fields = "{'category': 1}")
    List<HealthArticle> findAllCategories();
}