package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.MealPlan;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 膳食计划Repository接口
 */
@Repository
public interface MealPlanRepository extends MongoRepository<MealPlan, String> {

    /**
     * 根据用户ID查找所有膳食计划，按创建时间倒序
     */
    List<MealPlan> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * 根据用户ID和计划日期查找膳食计划，按创建时间倒序
     */
    List<MealPlan> findByUserIdAndPlanDateOrderByCreatedAtDesc(String userId, LocalDate planDate);

    /**
     * 根据用户ID查找指定日期范围内的膳食计划，按创建时间倒序
     */
    List<MealPlan> findByUserIdAndPlanDateBetweenOrderByCreatedAtDesc(
            String userId, LocalDate startDate, LocalDate endDate);

    /**
     * 根据用户ID和状态查找膳食计划，按创建时间倒序
     */
    List<MealPlan> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);

    /**
     * 根据用户ID和喜欢状态查找膳食计划，按创建时间倒序
     */
    List<MealPlan> findByUserIdAndLikedOrderByCreatedAtDesc(String userId, Boolean liked);

    /**
     * 查找用户最近的膳食计划
     */
    Optional<MealPlan> findTopByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * 查找用户指定日期的最新膳食计划
     */
    Optional<MealPlan> findTopByUserIdAndPlanDateOrderByCreatedAtDesc(String userId, LocalDate planDate);

    /**
     * 根据用户ID删除所有膳食计划
     */
    void deleteByUserId(String userId);

    /**
     * 统计用户的膳食计划总数量
     */
    long countByUserId(String userId);

    /**
     * 统计用户喜欢的膳食计划数量
     */
    long countByUserIdAndLiked(String userId, Boolean liked);

    /**
     * 统计用户指定状态的膳食计划数量
     */
    long countByUserIdAndStatus(String userId, String status);

    /**
     * 查找用户在指定日期之前的膳食计划数量
     */
    @Query("{ 'userId': ?0, 'planDate': { '$lt': ?1 } }")
    long countByUserIdAndPlanDateBefore(String userId, LocalDate date);

    /**
     * 根据用户ID和日期范围统计膳食计划
     */
    @Query("{ 'userId': ?0, 'planDate': { '$gte': ?1, '$lte': ?2 } }")
    long countByUserIdAndPlanDateBetween(String userId, LocalDate startDate, LocalDate endDate);
}