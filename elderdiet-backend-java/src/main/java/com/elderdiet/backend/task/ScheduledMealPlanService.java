package com.elderdiet.backend.task;

import com.elderdiet.backend.dto.MealPlanRequest;
import com.elderdiet.backend.entity.MealPlan;
import com.elderdiet.backend.entity.Profile;
import com.elderdiet.backend.repository.MealPlanRepository;
import com.elderdiet.backend.repository.ProfileRepository;
import com.elderdiet.backend.service.MealPlanService;
import com.elderdiet.backend.service.MealRecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledMealPlanService {

    private final ProfileRepository profileRepository;
    private final MealPlanRepository mealPlanRepository;
    private final MealRecommendationService mealRecommendationService;
    private final MealPlanService mealPlanService;

    /**
     * 每天凌晨4点为所有用户自动生成当天的膳食计划。
     * Cron expression: second, minute, hour, day of month, month, day(s) of week
     * "0 0 4 * * ?" 每天凌晨4点触发
     */
    @Scheduled(cron = "0 0 4 * * ?")
    public void generateDailyMealPlans() {
        log.info("开始执行每日膳食计划自动生成任务...");

        List<Profile> allProfiles = profileRepository.findAll();
        LocalDate today = LocalDate.now();

        log.info("发现 {} 个用户需要检查膳食计划。", allProfiles.size());

        for (Profile profile : allProfiles) {
            try {
                // 检查用户当天是否已有膳食计划
                boolean hasPlan = mealPlanService.checkIfMealPlanExists(profile.getUserId(), today);

                if (!hasPlan) {
                    log.info("用户 {} 今天没有膳食计划，开始为其生成...", profile.getName());

                    // 创建一个默认的MealPlanRequest，可以根据需要进行定制
                    MealPlanRequest request = new MealPlanRequest();

                    // 调用核心服务生成膳食计划
                    MealPlan mealPlan = mealRecommendationService.generateCompleteMealPlan(profile, today, request);
                    mealPlan.setUserId(profile.getUserId());

                    // 保存到数据库
                    mealPlanRepository.save(mealPlan);

                    log.info("成功为用户 {} 生成并保存了 {} 的膳-食计划。", profile.getName(), today);
                } else {
                    log.info("用户 {} 在 {} 已有膳食计划，跳过生成。", profile.getName(), today);
                }
            } catch (Exception e) {
                log.error("为用户 {} 生成膳食计划时发生错误: {}", profile.getName(), e.getMessage(), e);
                // 继续处理下一个用户
            }
        }
        log.info("每日膳食计划自动生成任务执行完毕。");
    }
}