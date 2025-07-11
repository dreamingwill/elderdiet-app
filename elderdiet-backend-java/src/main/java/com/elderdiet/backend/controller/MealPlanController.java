package com.elderdiet.backend.controller;

import com.elderdiet.backend.dto.ApiResponse;
import com.elderdiet.backend.dto.DishReplaceRequest;
import com.elderdiet.backend.dto.MealPlanRequest;
import com.elderdiet.backend.dto.MealPlanResponse;
import com.elderdiet.backend.dto.MealPlanLikeRequest;
import com.elderdiet.backend.service.MealPlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 膳食计划控制器
 */
@RestController
@RequestMapping("/api/meal-plans")
@RequiredArgsConstructor
@Slf4j
public class MealPlanController {

    private final MealPlanService mealPlanService;

    /**
     * 生成膳食计划
     */
    @PostMapping
    public ResponseEntity<ApiResponse<MealPlanResponse>> generateMealPlan(
            @Valid @RequestBody MealPlanRequest request,
            Authentication authentication) {

        log.info("用户 {} 请求生成膳食计划，日期: {}", authentication.getName(), request.getPlanDate());

        try {
            String userId = authentication.getName();
            MealPlanResponse response = mealPlanService.generateMealPlan(request, userId);

            return ResponseEntity.ok(ApiResponse.success("膳食计划生成成功", response));

        } catch (Exception e) {
            log.error("生成膳食计划失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("生成膳食计划失败: " + e.getMessage()));
        }
    }

    /**
     * 获取指定日期的最新膳食计划
     */
    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<MealPlanResponse>> getLatestMealPlan(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate planDate,
            Authentication authentication) {

        log.info("用户 {} 请求获取最新膳食计划，日期: {}", authentication.getName(), planDate);

        try {
            String userId = authentication.getName();
            MealPlanResponse response = mealPlanService.getLatestMealPlan(userId, planDate);

            if (response == null) {
                return ResponseEntity.ok(ApiResponse.success("该日期暂无膳食计划", null));
            }

            return ResponseEntity.ok(ApiResponse.success("最新膳食计划获取成功", response));

        } catch (Exception e) {
            log.error("获取最新膳食计划失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取最新膳食计划失败: " + e.getMessage()));
        }
    }

    /**
     * 获取指定日期的所有膳食计划
     */
    @GetMapping("/by-date")
    public ResponseEntity<ApiResponse<List<MealPlanResponse>>> getMealPlansByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate planDate,
            Authentication authentication) {

        log.info("用户 {} 请求获取指定日期的所有膳食计划，日期: {}", authentication.getName(), planDate);

        try {
            String userId = authentication.getName();
            List<MealPlanResponse> response = mealPlanService.getMealPlansByDate(userId, planDate);

            return ResponseEntity.ok(ApiResponse.success("膳食计划获取成功", response));

        } catch (Exception e) {
            log.error("获取膳食计划失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取膳食计划失败: " + e.getMessage()));
        }
    }

    /**
     * 获取膳食计划历史
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<MealPlanResponse>>> getMealPlanHistory(
            Authentication authentication) {

        log.info("用户 {} 请求获取膳食计划历史", authentication.getName());

        try {
            String userId = authentication.getName();
            List<MealPlanResponse> response = mealPlanService.getMealPlanHistory(userId);

            return ResponseEntity.ok(ApiResponse.success("膳食计划历史获取成功", response));

        } catch (Exception e) {
            log.error("获取膳食计划历史失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取膳食计划历史失败: " + e.getMessage()));
        }
    }

    /**
     * 获取指定日期范围的膳食计划
     */
    @GetMapping("/range")
    public ResponseEntity<ApiResponse<List<MealPlanResponse>>> getMealPlansByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {

        log.info("用户 {} 请求获取膳食计划，日期范围: {} 到 {}", authentication.getName(), startDate, endDate);

        try {
            String userId = authentication.getName();
            List<MealPlanResponse> response = mealPlanService.getMealPlansByDateRange(userId, startDate, endDate);

            return ResponseEntity.ok(ApiResponse.success("膳食计划获取成功", response));

        } catch (Exception e) {
            log.error("获取膳食计划失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取膳食计划失败: " + e.getMessage()));
        }
    }

    /**
     * 更换菜品
     */
    @PutMapping("/replace-dish")
    public ResponseEntity<ApiResponse<MealPlanResponse>> replaceDish(
            @Valid @RequestBody DishReplaceRequest request,
            Authentication authentication) {

        log.info("用户 {} 请求更换菜品，计划ID: {}, 餐次: {}, 菜品索引: {}",
                authentication.getName(), request.getMealPlanId(), request.getMealType(), request.getDishIndex());

        try {
            String userId = authentication.getName();
            MealPlanResponse response = mealPlanService.replaceDish(request, userId);

            return ResponseEntity.ok(ApiResponse.success("菜品更换成功", response));

        } catch (Exception e) {
            log.error("更换菜品失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("更换菜品失败: " + e.getMessage()));
        }
    }

    /**
     * 删除膳食计划
     */
    @DeleteMapping("/{mealPlanId}")
    public ResponseEntity<ApiResponse<String>> deleteMealPlan(
            @PathVariable String mealPlanId,
            Authentication authentication) {

        log.info("用户 {} 请求删除膳食计划: {}", authentication.getName(), mealPlanId);

        try {
            String userId = authentication.getName();
            mealPlanService.deleteMealPlan(mealPlanId, userId);

            return ResponseEntity.ok(ApiResponse.success("膳食计划删除成功"));

        } catch (Exception e) {
            log.error("删除膳食计划失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("删除膳食计划失败: " + e.getMessage()));
        }
    }

    /**
     * 归档膳食计划
     */
    @PutMapping("/{mealPlanId}/archive")
    public ResponseEntity<ApiResponse<MealPlanResponse>> archiveMealPlan(
            @PathVariable String mealPlanId,
            Authentication authentication) {

        log.info("用户 {} 请求归档膳食计划: {}", authentication.getName(), mealPlanId);

        try {
            String userId = authentication.getName();
            MealPlanResponse response = mealPlanService.archiveMealPlan(mealPlanId, userId);

            return ResponseEntity.ok(ApiResponse.success("膳食计划归档成功", response));

        } catch (Exception e) {
            log.error("归档膳食计划失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("归档膳食计划失败: " + e.getMessage()));
        }
    }

    /**
     * 获取今日最新膳食计划
     */
    @GetMapping("/today")
    public ResponseEntity<ApiResponse<MealPlanResponse>> getTodayLatestMealPlan(
            Authentication authentication) {

        log.info("用户 {} 请求获取今日最新膳食计划", authentication.getName());

        try {
            String userId = authentication.getName();
            LocalDate today = LocalDate.now();
            MealPlanResponse response = mealPlanService.getLatestMealPlan(userId, today);

            if (response == null) {
                return ResponseEntity.ok(ApiResponse.success("今日暂无膳食计划", null));
            }

            return ResponseEntity.ok(ApiResponse.success("今日最新膳食计划获取成功", response));

        } catch (Exception e) {
            log.error("获取今日最新膳食计划失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取今日最新膳食计划失败: " + e.getMessage()));
        }
    }

    /**
     * 获取今日所有膳食计划
     */
    @GetMapping("/today/all")
    public ResponseEntity<ApiResponse<List<MealPlanResponse>>> getTodayAllMealPlans(
            Authentication authentication) {

        log.info("用户 {} 请求获取今日所有膳食计划", authentication.getName());

        try {
            String userId = authentication.getName();
            LocalDate today = LocalDate.now();
            List<MealPlanResponse> response = mealPlanService.getMealPlansByDate(userId, today);

            return ResponseEntity.ok(ApiResponse.success("今日所有膳食计划获取成功", response));

        } catch (Exception e) {
            log.error("获取今日所有膳食计划失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取今日所有膳食计划失败: " + e.getMessage()));
        }
    }

    /**
     * 一键生成今日膳食计划
     */
    @PostMapping("/generate-today")
    public ResponseEntity<ApiResponse<MealPlanResponse>> generateTodayMealPlan(
            Authentication authentication) {

        log.info("用户 {} 请求一键生成今日膳食计划", authentication.getName());

        try {
            String userId = authentication.getName();
            LocalDate today = LocalDate.now();

            // 构建请求
            MealPlanRequest request = MealPlanRequest.builder()
                    .planDate(today)
                    .build();

            MealPlanResponse response = mealPlanService.generateMealPlan(request, userId);

            return ResponseEntity.ok(ApiResponse.success("今日膳食计划生成成功", response));

        } catch (Exception e) {
            log.error("生成今日膳食计划失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("生成今日膳食计划失败: " + e.getMessage()));
        }
    }

    /**
     * 设置膳食计划喜欢状态
     */
    @PutMapping("/like")
    public ResponseEntity<ApiResponse<MealPlanResponse>> setMealPlanLike(
            @Valid @RequestBody MealPlanLikeRequest request,
            Authentication authentication) {

        log.info("用户 {} 设置膳食计划 {} 的喜欢状态为: {}",
                authentication.getName(), request.getMealPlanId(), request.getLiked());

        try {
            String userId = authentication.getName();
            MealPlanResponse response = mealPlanService.setMealPlanLike(request, userId);

            return ResponseEntity.ok(ApiResponse.success("喜欢状态设置成功", response));

        } catch (Exception e) {
            log.error("设置喜欢状态失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("设置喜欢状态失败: " + e.getMessage()));
        }
    }

    /**
     * 切换膳食计划喜欢状态
     */
    @PutMapping("/{mealPlanId}/toggle-like")
    public ResponseEntity<ApiResponse<MealPlanResponse>> toggleMealPlanLike(
            @PathVariable String mealPlanId,
            Authentication authentication) {

        log.info("用户 {} 切换膳食计划 {} 的喜欢状态", authentication.getName(), mealPlanId);

        try {
            String userId = authentication.getName();
            MealPlanResponse response = mealPlanService.toggleMealPlanLike(mealPlanId, userId);

            return ResponseEntity.ok(ApiResponse.success("喜欢状态切换成功", response));

        } catch (Exception e) {
            log.error("切换喜欢状态失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("切换喜欢状态失败: " + e.getMessage()));
        }
    }

    /**
     * 获取用户喜欢的膳食计划
     */
    @GetMapping("/liked")
    public ResponseEntity<ApiResponse<List<MealPlanResponse>>> getLikedMealPlans(
            Authentication authentication) {

        log.info("用户 {} 请求获取喜欢的膳食计划", authentication.getName());

        try {
            String userId = authentication.getName();
            List<MealPlanResponse> response = mealPlanService.getLikedMealPlans(userId);

            return ResponseEntity.ok(ApiResponse.success("喜欢的膳食计划获取成功", response));

        } catch (Exception e) {
            log.error("获取喜欢的膳食计划失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取喜欢的膳食计划失败: " + e.getMessage()));
        }
    }

    /**
     * 获取膳食计划统计信息
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getMealPlanStats(
            Authentication authentication) {

        log.info("用户 {} 请求获取膳食计划统计信息", authentication.getName());

        try {
            String userId = authentication.getName();
            Map<String, Long> response = mealPlanService.getMealPlanStats(userId);

            return ResponseEntity.ok(ApiResponse.success("膳食计划统计信息获取成功", response));

        } catch (Exception e) {
            log.error("获取膳食计划统计信息失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("获取膳食计划统计信息失败: " + e.getMessage()));
        }
    }
}