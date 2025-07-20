package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.ProfileDTO;
import com.elderdiet.backend.entity.Profile;
import com.elderdiet.backend.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;

/**
 * 游戏化服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GamificationService {

    private final ProfileService profileService;

    // 小树的最大阶段（0-6，共7个阶段）
    private static final int MAX_TREE_STAGE = 6;

    // 每次成长需要的浇水次数
    private static final int WATERING_REQUIRED = 2;

    // 每日最大浇水次数
    private static final int MAX_DAILY_WATERING = 2;

    // 浇水间隔时间（小时）
    private static final int WATERING_INTERVAL_HOURS = 3;

    /**
     * 给小树浇水
     */
    @Transactional
    public void waterTree(User user) {
        log.info("用户 {} 尝试给小树浇水", user.getPhone());

        try {
            // 获取用户的健康档案
            ProfileDTO profile = profileService.getProfileByUserId(user.getId());
            if (profile == null) {
                log.warn("用户 {} 的健康档案不存在，跳过浇水", user.getPhone());
                return;
            }

            // 先检查是否需要重置每日浇水次数
            profile = profileService.checkAndResetDailyWaterCount(user.getId());

            // 检查今日浇水次数是否已达上限
            int todayWaterCount = profile.getTodayWaterCount() != null ? profile.getTodayWaterCount() : 0;
            if (todayWaterCount >= MAX_DAILY_WATERING) {
                log.info("用户 {} 今日浇水次数已达上限 ({}/{})", user.getPhone(), todayWaterCount, MAX_DAILY_WATERING);
                return;
            }

            // 检查距离上次浇水是否已经过了规定的间隔时间
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime lastWaterTime = profile.getLastWaterTime();

            if (lastWaterTime != null && todayWaterCount > 0) {
                Duration timeSinceLastWater = Duration.between(lastWaterTime, now);
                if (timeSinceLastWater.toHours() < WATERING_INTERVAL_HOURS) {
                    log.info("用户 {} 距离上次浇水时间不足 {} 小时，跳过浇水",
                            user.getPhone(), WATERING_INTERVAL_HOURS);
                    return;
                }
            }

            // 增加浇水进度
            int currentProgress = profile.getWateringProgress();
            int newProgress = currentProgress + 1;

            // 更新今日浇水次数和最后浇水时间
            todayWaterCount++;

            log.info("用户 {} 浇水进度: {} -> {}, 今日浇水次数: {}/{}",
                    user.getPhone(), currentProgress, newProgress, todayWaterCount, MAX_DAILY_WATERING);

            if (newProgress >= WATERING_REQUIRED) {
                // 浇水次数足够，小树成长
                growTree(profile, user);
                // 重置浇水进度，但保留今日浇水次数和最后浇水时间
                profileService.updateWateringStatus(user.getId(), 0, todayWaterCount, now);
            } else {
                // 更新浇水进度、今日浇水次数和最后浇水时间
                profileService.updateWateringStatus(user.getId(), newProgress, todayWaterCount, now);
                log.info("用户 {} 浇水进度更新为: {}", user.getPhone(), newProgress);
            }

        } catch (Exception e) {
            log.error("用户 {} 浇水失败: {}", user.getPhone(), e.getMessage());
            // 不抛出异常，避免影响主要功能
        }
    }

    /**
     * 小树成长逻辑
     */
    private void growTree(ProfileDTO profile, User user) {
        int currentStage = profile.getTreeStage();

        if (currentStage >= MAX_TREE_STAGE) {
            // 树已经达到最大阶段，完成一颗树
            completeTree(profile, user);
        } else {
            // 树成长到下一阶段
            int newStage = currentStage + 1;

            // 更新树的阶段和重置浇水进度
            profileService.updateTreeStatus(user.getId(), newStage, 0, null);

            log.info("用户 {} 的小树成长到阶段: {} -> {}", user.getPhone(), currentStage, newStage);

            if (newStage == MAX_TREE_STAGE) {
                log.info("用户 {} 的小树已达到最终形态！", user.getPhone());
            }
        }
    }

    /**
     * 完成一颗树
     */
    private void completeTree(ProfileDTO profile, User user) {
        int completedCount = profile.getCompletedTrees();
        int newCompletedCount = completedCount + 1;

        // 更新已完成树的数量，重置树的阶段和浇水进度，开始新一轮成长
        profileService.updateTreeStatus(user.getId(), 0, 0, newCompletedCount);

        log.info("恭喜用户 {} 完成了第 {} 颗小树！开始新的成长周期。",
                user.getPhone(), newCompletedCount);
    }

    /**
     * 获取小树状态信息
     */
    public TreeStatus getTreeStatus(User user) {
        try {
            ProfileDTO profile = profileService.getProfileByUserId(user.getId());
            if (profile == null) {
                log.warn("用户 {} 的健康档案不存在", user.getPhone());
                return getDefaultTreeStatus();
            }

            // 检查并重置每日浇水次数
            profile = profileService.checkAndResetDailyWaterCount(user.getId());
            int todayWaterCount = profile.getTodayWaterCount() != null ? profile.getTodayWaterCount() : 0;

            return TreeStatus.builder()
                    .treeStage(profile.getTreeStage())
                    .wateringProgress(profile.getWateringProgress())
                    .completedTrees(profile.getCompletedTrees())
                    .todayWaterCount(todayWaterCount)
                    .progressToNextStage(calculateProgressToNextStage(profile))
                    .isMaxStage(profile.getTreeStage() >= MAX_TREE_STAGE)
                    .stageDescription(getStageDescription(profile.getTreeStage()))
                    .build();

        } catch (Exception e) {
            log.error("获取用户 {} 的小树状态失败: {}", user.getPhone(), e.getMessage());
            return getDefaultTreeStatus();
        }
    }

    /**
     * 获取默认小树状态
     */
    private TreeStatus getDefaultTreeStatus() {
        return TreeStatus.builder()
                .treeStage(0)
                .wateringProgress(0)
                .completedTrees(0)
                .todayWaterCount(0)
                .progressToNextStage(0.0)
                .isMaxStage(false)
                .stageDescription("种子")
                .build();
    }

    /**
     * 计算到下一阶段的进度百分比
     */
    private double calculateProgressToNextStage(ProfileDTO profile) {
        if (profile.getTreeStage() >= MAX_TREE_STAGE) {
            return 100.0; // 已达到最大阶段
        }

        return (double) profile.getWateringProgress() / WATERING_REQUIRED * 100.0;
    }

    /**
     * 获取阶段描述
     */
    private String getStageDescription(int stage) {
        switch (stage) {
            case 0:
                return "种子";
            case 1:
                return "发芽";
            case 2:
                return "幼苗";
            case 3:
                return "小树";
            case 4:
                return "茁壮成长";
            case 5:
                return "枝繁叶茂";
            case 6:
                return "参天大树";
            default:
                return "未知阶段";
        }
    }

    /**
     * 小树状态DTO
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TreeStatus {
        private Integer treeStage; // 当前树的阶段
        private Integer wateringProgress; // 当前浇水进度
        private Integer completedTrees; // 已完成的树数量
        private Double progressToNextStage; // 到下一阶段的进度百分比
        private Boolean isMaxStage; // 是否已达到最大阶段
        private String stageDescription; // 阶段描述
        private Integer todayWaterCount; // 今日浇水次数 0～2
    }
}