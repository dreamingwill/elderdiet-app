package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.DishReplaceRequest;
import com.elderdiet.backend.dto.MealPlanRequest;
import com.elderdiet.backend.dto.MealPlanResponse;
import com.elderdiet.backend.dto.MealPlanLikeRequest;
import com.elderdiet.backend.entity.MealPlan;
import com.elderdiet.backend.entity.Profile;
import com.elderdiet.backend.entity.Meal;
import com.elderdiet.backend.entity.Dish;
import com.elderdiet.backend.repository.MealPlanRepository;
import com.elderdiet.backend.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

/**
 * 膳食计划服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MealPlanService {

    private final MealPlanRepository mealPlanRepository;
    private final ProfileRepository profileRepository;
    private final MealRecommendationService mealRecommendationService;

    /**
     * 生成膳食计划
     */
    @Transactional
    public MealPlanResponse generateMealPlan(MealPlanRequest request, String userId) {
        log.info("开始为用户 {} 生成 {} 的膳食计划", userId, request.getPlanDate());

        try {
            // 1. 获取用户健康档案
            Profile userProfile = profileRepository.findByUserId(userId)
                    .orElseThrow(() -> new IllegalArgumentException("用户健康档案不存在，请先完善健康档案"));

            // 2. 调用LLM生成膳食推荐
            MealPlan generatedPlan = mealRecommendationService.generateCompleteMealPlan(
                    userProfile, request.getPlanDate(), request);

            // 3. 设置用户ID和保存
            generatedPlan.setUserId(userId);

            // 4. 保存到数据库
            MealPlan savedPlan = mealPlanRepository.save(generatedPlan);

            log.info("膳食计划生成成功，ID: {}", savedPlan.getId());
            return MealPlanResponse.fromEntity(savedPlan);

        } catch (Exception e) {
            log.error("生成膳食计划时出错: {}", e.getMessage(), e);
            throw new IllegalArgumentException("生成膳食计划失败: " + e.getMessage(), e);
        }
    }

    /**
     * 更换菜品
     */
    @Transactional
    public MealPlanResponse replaceDish(DishReplaceRequest request, String userId) {
        log.info("开始为用户 {} 更换菜品，计划ID: {}, 餐次: {}, 菜品索引: {}",
                userId, request.getMealPlanId(), request.getMealType(), request.getDishIndex());

        try {
            // 1. 查找膳食计划
            MealPlan mealPlan = mealPlanRepository.findById(request.getMealPlanId())
                    .orElseThrow(() -> new IllegalArgumentException("膳食计划不存在"));

            // 2. 验证用户权限
            if (!mealPlan.getUserId().equals(userId)) {
                throw new IllegalArgumentException("无权访问该膳食计划");
            }

            // 3. 获取用户健康档案
            Profile userProfile = profileRepository.findByUserId(userId)
                    .orElseThrow(() -> new IllegalArgumentException("用户健康档案不存在"));

            // 4. 获取目标餐次
            Meal targetMeal = mealPlan.getMealByType(request.getMealType());

            // 5. 验证菜品索引
            if (request.getDishIndex() >= targetMeal.getDishes().size()) {
                throw new IllegalArgumentException("菜品索引超出范围");
            }

            // 6. 获取要替换的菜品
            Dish originalDish = targetMeal.getDishes().get(request.getDishIndex());

            // 7. 调用LLM生成新菜品
            Dish newDish = mealRecommendationService.generateReplacementDish(
                    userProfile, targetMeal, originalDish, request);

            // 8. 替换菜品
            targetMeal.getDishes().set(request.getDishIndex(), newDish);

            // 9. 更新膳食计划
            mealPlan.updateMealByType(request.getMealType(), targetMeal);

            // 10. 保存更新
            MealPlan savedPlan = mealPlanRepository.save(mealPlan);

            log.info("菜品替换成功，原菜品: {}, 新菜品: {}", originalDish.getName(), newDish.getName());
            return MealPlanResponse.fromEntity(savedPlan);

        } catch (Exception e) {
            log.error("更换菜品时出错: {}", e.getMessage(), e);
            throw new IllegalArgumentException("更换菜品失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取用户指定日期的最新膳食计划
     */
    public MealPlanResponse getLatestMealPlan(String userId, LocalDate planDate) {
        log.info("获取用户 {} 在 {} 的最新膳食计划", userId, planDate);

        Optional<MealPlan> mealPlan = mealPlanRepository.findTopByUserIdAndPlanDateOrderByCreatedAtDesc(userId,
                planDate);
        if (mealPlan.isPresent()) {
            return MealPlanResponse.fromEntity(mealPlan.get());
        }

        return null;
    }

    /**
     * 获取用户指定日期的所有膳食计划
     */
    public List<MealPlanResponse> getMealPlansByDate(String userId, LocalDate planDate) {
        log.info("获取用户 {} 在 {} 的所有膳食计划", userId, planDate);

        List<MealPlan> mealPlans = mealPlanRepository.findByUserIdAndPlanDateOrderByCreatedAtDesc(userId, planDate);
        return mealPlans.stream()
                .map(MealPlanResponse::fromEntity)
                .toList();
    }

    /**
     * 获取用户的膳食计划历史
     */
    public List<MealPlanResponse> getMealPlanHistory(String userId) {
        log.info("获取用户 {} 的膳食计划历史", userId);

        List<MealPlan> mealPlans = mealPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return mealPlans.stream()
                .map(MealPlanResponse::fromEntity)
                .toList();
    }

    /**
     * 获取用户指定日期范围内的膳食计划
     */
    public List<MealPlanResponse> getMealPlansByDateRange(String userId, LocalDate startDate, LocalDate endDate) {
        log.info("获取用户 {} 在 {} 到 {} 的膳食计划", userId, startDate, endDate);

        List<MealPlan> mealPlans = mealPlanRepository.findByUserIdAndPlanDateBetweenOrderByCreatedAtDesc(
                userId, startDate, endDate);
        return mealPlans.stream()
                .map(MealPlanResponse::fromEntity)
                .toList();
    }

    /**
     * 删除膳食计划
     */
    @Transactional
    public void deleteMealPlan(String mealPlanId, String userId) {
        log.info("删除用户 {} 的膳食计划: {}", userId, mealPlanId);

        MealPlan mealPlan = mealPlanRepository.findById(mealPlanId)
                .orElseThrow(() -> new IllegalArgumentException("膳食计划不存在"));

        // 验证用户权限
        if (!mealPlan.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权删除该膳食计划");
        }

        mealPlanRepository.deleteById(mealPlanId);
        log.info("膳食计划删除成功: {}", mealPlanId);
    }

    /**
     * 归档膳食计划
     */
    @Transactional
    public MealPlanResponse archiveMealPlan(String mealPlanId, String userId) {
        log.info("归档用户 {} 的膳食计划: {}", userId, mealPlanId);

        MealPlan mealPlan = mealPlanRepository.findById(mealPlanId)
                .orElseThrow(() -> new IllegalArgumentException("膳食计划不存在"));

        // 验证用户权限
        if (!mealPlan.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权归档该膳食计划");
        }

        mealPlan.setStatus("archived");
        MealPlan savedPlan = mealPlanRepository.save(mealPlan);

        log.info("膳食计划归档成功: {}", mealPlanId);
        return MealPlanResponse.fromEntity(savedPlan);
    }

    /**
     * 设置膳食计划喜欢状态
     */
    @Transactional
    public MealPlanResponse setMealPlanLike(MealPlanLikeRequest request, String userId) {
        log.info("用户 {} 设置膳食计划 {} 的喜欢状态为: {}", userId, request.getMealPlanId(), request.getLiked());

        MealPlan mealPlan = mealPlanRepository.findById(request.getMealPlanId())
                .orElseThrow(() -> new IllegalArgumentException("膳食计划不存在"));

        // 验证用户权限
        if (!mealPlan.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权修改该膳食计划");
        }

        mealPlan.setLiked(request.getLiked());
        MealPlan savedPlan = mealPlanRepository.save(mealPlan);

        log.info("膳食计划喜欢状态更新成功: {}", request.getMealPlanId());
        return MealPlanResponse.fromEntity(savedPlan);
    }

    /**
     * 切换膳食计划喜欢状态
     */
    @Transactional
    public MealPlanResponse toggleMealPlanLike(String mealPlanId, String userId) {
        log.info("用户 {} 切换膳食计划 {} 的喜欢状态", userId, mealPlanId);

        MealPlan mealPlan = mealPlanRepository.findById(mealPlanId)
                .orElseThrow(() -> new IllegalArgumentException("膳食计划不存在"));

        // 验证用户权限
        if (!mealPlan.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权修改该膳食计划");
        }

        mealPlan.toggleLike();
        MealPlan savedPlan = mealPlanRepository.save(mealPlan);

        log.info("膳食计划喜欢状态切换成功: {}，新状态: {}", mealPlanId, savedPlan.isLiked());
        return MealPlanResponse.fromEntity(savedPlan);
    }

    /**
     * 获取用户喜欢的膳食计划
     */
    public List<MealPlanResponse> getLikedMealPlans(String userId) {
        log.info("获取用户 {} 喜欢的膳食计划", userId);

        List<MealPlan> mealPlans = mealPlanRepository.findByUserIdAndLikedOrderByCreatedAtDesc(userId, true);
        return mealPlans.stream()
                .map(MealPlanResponse::fromEntity)
                .toList();
    }

    /**
     * 获取膳食计划统计信息
     */
    public Map<String, Long> getMealPlanStats(String userId) {
        log.info("获取用户 {} 的膳食计划统计信息", userId);

        Map<String, Long> stats = new HashMap<>();
        stats.put("total", mealPlanRepository.countByUserId(userId));
        stats.put("liked", mealPlanRepository.countByUserIdAndLiked(userId, true));

        return stats;
    }
}