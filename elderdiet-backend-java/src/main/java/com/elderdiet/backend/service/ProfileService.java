package com.elderdiet.backend.service;

import com.elderdiet.backend.entity.Profile;
import com.elderdiet.backend.entity.ChronicCondition;
import com.elderdiet.backend.dto.ProfileDTO;
import com.elderdiet.backend.dto.ChronicConditionOptionDTO;
import com.elderdiet.backend.entity.UserRole;
import com.elderdiet.backend.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * 健康档案服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;

    /**
     * 根据用户ID获取健康档案
     */
    public ProfileDTO getProfileByUserId(String userId) {
        log.info("获取用户健康档案, userId: {}", userId);

        Profile profile = profileRepository.findByUserId(userId)
                .orElse(null);

        if (profile == null) {
            log.warn("用户健康档案不存在, userId: {}", userId);
            return null;
        }

        return convertToDTO(profile);
    }

    /**
     * 创建健康档案
     */
    @Transactional
    public ProfileDTO createProfile(String userId, ProfileDTO profileDTO) {
        log.info("创建用户健康档案, userId: {}", userId);

        // 检查是否已存在档案
        if (profileRepository.existsByUserId(userId)) {
            throw new RuntimeException("健康档案已存在，请使用更新接口");
        }

        Profile profile = convertToEntity(profileDTO);
        profile.setUserId(userId);

        Profile savedProfile = profileRepository.save(profile);
        log.info("健康档案创建成功, userId: {}, profileId: {}", userId, savedProfile.getId());

        return convertToDTO(savedProfile);
    }

    /**
     * 更新健康档案
     */
    @Transactional
    public ProfileDTO updateProfile(String userId, ProfileDTO profileDTO) {
        log.info("更新用户健康档案, userId: {}", userId);

        Profile existingProfile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("健康档案不存在"));

        // 更新字段
        updateProfileFields(existingProfile, profileDTO);

        Profile updatedProfile = profileRepository.save(existingProfile);
        log.info("健康档案更新成功, userId: {}, profileId: {}", userId, updatedProfile.getId());

        return convertToDTO(updatedProfile);
    }

    /**
     * 删除健康档案
     */
    @Transactional
    public void deleteProfile(String userId) {
        log.info("删除用户健康档案, userId: {}", userId);

        if (!profileRepository.existsByUserId(userId)) {
            throw new RuntimeException("健康档案不存在");
        }

        profileRepository.deleteByUserId(userId);
        log.info("健康档案删除成功, userId: {}", userId);
    }

    /**
     * 获取慢性疾病选项
     */
    public List<ChronicConditionOptionDTO> getChronicConditionOptions() {
        return Arrays.stream(ChronicCondition.values())
                .map(condition -> ChronicConditionOptionDTO.builder()
                        .value(condition.getValue())
                        .label(condition.getLabel())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 将Entity转换为DTO
     */
    private ProfileDTO convertToDTO(Profile profile) {
        return ProfileDTO.builder()
                .id(profile.getId())
                .userId(profile.getUserId())
                .name(profile.getName())
                .age(profile.getAge())
                .gender(profile.getGender())
                .region(profile.getRegion())
                .height(profile.getHeight())
                .weight(profile.getWeight())
                .chronicConditions(
                        profile.getChronicConditions() != null ? new ArrayList<>(profile.getChronicConditions())
                                : new ArrayList<>())
                .dietaryPreferences(
                        profile.getDietaryPreferences() != null ? new ArrayList<>(profile.getDietaryPreferences())
                                : new ArrayList<>())
                .notes(profile.getNotes() != null ? profile.getNotes() : "")
                .avatarUrl(profile.getAvatarUrl())
                .treeStage(profile.getTreeStage())
                .wateringProgress(profile.getWateringProgress())
                .completedTrees(profile.getCompletedTrees())
                .todayWaterCount(profile.getTodayWaterCount())
                .lastWaterTime(profile.getLastWaterTime())
                .bmi(profile.getBmi())
                .bmiStatus(profile.getBmiStatus())
                .bmiStatusLabel(profile.getBmiStatusLabel())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    /**
     * 将DTO转换为Entity
     */
    private Profile convertToEntity(ProfileDTO dto) {
        return Profile.builder()
                .name(dto.getName())
                .age(dto.getAge())
                .gender(dto.getGender())
                .region(dto.getRegion())
                .height(dto.getHeight())
                .weight(dto.getWeight())
                .chronicConditions(dto.getChronicConditions() != null ? new ArrayList<>(dto.getChronicConditions())
                        : new ArrayList<>())
                .dietaryPreferences(dto.getDietaryPreferences() != null ? new ArrayList<>(dto.getDietaryPreferences())
                        : new ArrayList<>())
                .notes(dto.getNotes() != null ? dto.getNotes() : "")
                .avatarUrl(dto.getAvatarUrl())
                .build();
    }

    /**
     * 更新Profile字段
     */
    private void updateProfileFields(Profile profile, ProfileDTO dto) {
        profile.setName(dto.getName());
        profile.setAge(dto.getAge());
        profile.setGender(dto.getGender());
        profile.setRegion(dto.getRegion());
        profile.setHeight(dto.getHeight());
        profile.setWeight(dto.getWeight());
        profile.setChronicConditions(
                dto.getChronicConditions() != null ? new ArrayList<>(dto.getChronicConditions()) : new ArrayList<>());
        profile.setDietaryPreferences(
                dto.getDietaryPreferences() != null ? new ArrayList<>(dto.getDietaryPreferences()) : new ArrayList<>());
        profile.setNotes(dto.getNotes() != null ? dto.getNotes() : "");
        // 头像URL字段可以通过普通更新或专门的头像上传接口更新
        if (dto.getAvatarUrl() != null) {
            profile.setAvatarUrl(dto.getAvatarUrl());
        }
        // 注意：小树相关字段（treeStage, wateringProgress, completedTrees等）
        // 不在此方法中更新，它们只能通过专门的游戏化服务方法更新，
        // 以防止普通的档案更新操作意外重置小树的成长进度
    }

    /**
     * 更新小树状态（仅供GamificationService使用）
     */
    @Transactional
    public void updateTreeStatus(String userId, Integer treeStage, Integer wateringProgress, Integer completedTrees) {
        log.info("更新用户小树状态, userId: {}, stage: {}, progress: {}, completed: {}",
                userId, treeStage, wateringProgress, completedTrees);

        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("健康档案不存在"));

        if (treeStage != null) {
            profile.setTreeStage(treeStage);
        }
        if (wateringProgress != null) {
            profile.setWateringProgress(wateringProgress);
        }
        if (completedTrees != null) {
            profile.setCompletedTrees(completedTrees);
        }

        profileRepository.save(profile);
        log.info("小树状态更新成功, userId: {}", userId);
    }

    /**
     * 检查并重置每日浇水次数（仅供GamificationService使用）
     */
    @Transactional
    public ProfileDTO checkAndResetDailyWaterCount(String userId) {
        log.info("检查用户每日浇水次数重置, userId: {}", userId);

        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("健康档案不存在"));

        LocalDateTime now = LocalDateTime.now();
        boolean needReset = false;

        // 检查是否需要重置每日浇水次数
        if (profile.getWaterCountResetTime() == null) {
            // 老用户数据兼容：如果没有重置时间，设置为明天0点并重置计数
            needReset = true;
            log.info("用户 {} 没有重置时间记录，进行兼容性重置", userId);
        } else if (now.isAfter(profile.getWaterCountResetTime())) {
            // 当前时间已过重置时间，需要重置
            needReset = true;
            log.info("用户 {} 已过重置时间，进行每日重置", userId);
        }

        if (needReset) {
            // 重置今日浇水次数
            profile.setTodayWaterCount(0);

            // 设置下一个重置时间为明天的0点
            LocalDateTime tomorrow = now.plusDays(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            profile.setWaterCountResetTime(tomorrow);

            profileRepository.save(profile);
            log.info("用户 {} 每日浇水次数已重置，下次重置时间: {}", userId, tomorrow);
        }

        return convertToDTO(profile);
    }

    /**
     * 更新小树浇水状态（仅供GamificationService使用）
     */
    @Transactional
    public void updateWateringStatus(String userId, Integer wateringProgress, Integer todayWaterCount,
            LocalDateTime lastWaterTime) {
        log.info("更新用户浇水状态, userId: {}, progress: {}, todayCount: {}, lastTime: {}",
                userId, wateringProgress, todayWaterCount, lastWaterTime);

        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("健康档案不存在"));

        if (wateringProgress != null) {
            profile.setWateringProgress(wateringProgress);
        }
        if (todayWaterCount != null) {
            profile.setTodayWaterCount(todayWaterCount);
        }
        if (lastWaterTime != null) {
            profile.setLastWaterTime(lastWaterTime);
        }

        profileRepository.save(profile);
        log.info("浇水状态更新成功, userId: {}", userId);
    }

    /**
     * 内部方法：获取用户档案，绕过权限检查（供FamilyService使用）
     */
    public ProfileDTO getProfileByUserIdInternal(String userId) {
        log.info("内部调用：获取用户健康档案, userId: {}", userId);

        Profile profile = profileRepository.findByUserId(userId)
                .orElse(null);

        if (profile == null) {
            log.warn("用户健康档案不存在, userId: {}", userId);
            return null;
        }

        return convertToDTO(profile);
    }

    /**
     * 更新用户头像
     */
    @Transactional
    public ProfileDTO updateUserAvatar(String userId, String avatarUrl) {
        log.info("更新用户头像, userId: {}, avatarUrl: {}", userId, avatarUrl);

        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("健康档案不存在"));

        profile.setAvatarUrl(avatarUrl);

        Profile updatedProfile = profileRepository.save(profile);
        log.info("头像更新成功, userId: {}", userId);

        return convertToDTO(updatedProfile);
    }

    /**
     * 创建空的默认档案（供注册时使用）
     */
    @Transactional
    public void createEmptyProfile(String userId, String phone, UserRole role) {
        log.info("为新用户创建空的健康档案, userId: {}", userId);

        // 检查是否已存在档案
        if (profileRepository.existsByUserId(userId)) {
            log.warn("用户已有健康档案，跳过创建, userId: {}", userId);
            return;
        }

        // 获取手机号后四位作为昵称后缀
        String phoneLastFour = phone.substring(Math.max(0, phone.length() - 4));
        String defaultName = (role == UserRole.ELDER ? "大树" : "小树") + phoneLastFour;

        // 设置明天0点为第一次重置时间
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        Profile profile = Profile.builder()
                .userId(userId)
                .name(defaultName)
                .age(null)
                .gender(null)
                .region("")
                .height(null)
                .weight(null)
                .chronicConditions(new ArrayList<>())
                .dietaryPreferences(new ArrayList<>())
                .notes("")
                .avatarUrl(null)
                .treeStage(0)
                .wateringProgress(0)
                .completedTrees(0)
                .todayWaterCount(0)
                .waterCountResetTime(tomorrow)
                .build();

        profileRepository.save(profile);
        log.info("空档案创建成功, userId: {}", userId);
    }
}