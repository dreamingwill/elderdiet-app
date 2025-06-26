package com.elderdiet.backend.service;

import com.elderdiet.backend.entity.Profile;
import com.elderdiet.backend.entity.ChronicCondition;
import com.elderdiet.backend.dto.ProfileDTO;
import com.elderdiet.backend.dto.ChronicConditionOptionDTO;
import com.elderdiet.backend.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                .chronicConditions(profile.getChronicConditions() != null ? 
                        new ArrayList<>(profile.getChronicConditions()) : new ArrayList<>())
                .dietaryPreferences(profile.getDietaryPreferences() != null ? 
                        new ArrayList<>(profile.getDietaryPreferences()) : new ArrayList<>())
                .notes(profile.getNotes() != null ? profile.getNotes() : "")
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
                .chronicConditions(dto.getChronicConditions() != null ? 
                        new ArrayList<>(dto.getChronicConditions()) : new ArrayList<>())
                .dietaryPreferences(dto.getDietaryPreferences() != null ? 
                        new ArrayList<>(dto.getDietaryPreferences()) : new ArrayList<>())
                .notes(dto.getNotes() != null ? dto.getNotes() : "")
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
        profile.setChronicConditions(dto.getChronicConditions() != null ? 
                new ArrayList<>(dto.getChronicConditions()) : new ArrayList<>());
        profile.setDietaryPreferences(dto.getDietaryPreferences() != null ? 
                new ArrayList<>(dto.getDietaryPreferences()) : new ArrayList<>());
        profile.setNotes(dto.getNotes() != null ? dto.getNotes() : "");
    }
} 