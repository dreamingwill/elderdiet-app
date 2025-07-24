package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.ProfileDTO;
import com.elderdiet.backend.entity.Profile;
import com.elderdiet.backend.repository.ProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * ProfileService测试类
 */
@SpringBootTest
public class ProfileServiceTest {

    @Mock
    private ProfileRepository profileRepository;

    private ProfileService profileService;

    private Profile existingProfile;
    private ProfileDTO updateDTO;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        profileService = new ProfileService(profileRepository);

        // 创建现有的档案（有小树进度）
        existingProfile = Profile.builder()
                .id("profile-id")
                .userId("test-user-id")
                .name("原始姓名")
                .age(65)
                .gender("male")
                .region("原始地区")
                .height(170.0)
                .weight(70.0)
                .chronicConditions(new ArrayList<>())
                .dietaryPreferences(new ArrayList<>())
                .notes("原始备注")
                .avatarUrl(null)
                .treeStage(3)  // 重要：小树已经成长到阶段3
                .wateringProgress(1)  // 重要：有浇水进度
                .completedTrees(2)  // 重要：已完成2棵树
                .todayWaterCount(1)
                .build();

        // 创建更新DTO（不包含小树字段，模拟前端行为）
        updateDTO = ProfileDTO.builder()
                .name("更新后姓名")
                .age(66)
                .gender("female")
                .region("更新后地区")
                .height(165.0)
                .weight(65.0)
                .chronicConditions(new ArrayList<>())
                .dietaryPreferences(new ArrayList<>())
                .notes("更新后备注")
                .avatarUrl(null)
                // 注意：这里不设置小树字段，模拟前端更新档案的行为
                // 由于@Builder.Default，这些字段会被设置为默认值0
                .build();
    }

    /**
     * 测试更新健康档案时不会重置小树进度
     * 这是修复bug的关键测试
     */
    @Test
    void testUpdateProfile_ShouldNotResetTreeProgress() {
        // 设置mock行为
        when(profileRepository.findByUserId("test-user-id")).thenReturn(Optional.of(existingProfile));
        when(profileRepository.save(any(Profile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // 执行更新
        ProfileDTO result = profileService.updateProfile("test-user-id", updateDTO);

        // 验证基本信息已更新
        assertEquals("更新后姓名", result.getName());
        assertEquals(66, result.getAge());
        assertEquals("female", result.getGender());
        assertEquals("更新后地区", result.getRegion());
        assertEquals(165.0, result.getHeight());
        assertEquals(65.0, result.getWeight());
        assertEquals("更新后备注", result.getNotes());

        // 关键验证：小树进度不应该被重置
        assertEquals(3, result.getTreeStage(), "小树阶段不应该被重置");
        assertEquals(1, result.getWateringProgress(), "浇水进度不应该被重置");
        assertEquals(2, result.getCompletedTrees(), "已完成树数量不应该被重置");
        assertEquals(1, result.getTodayWaterCount(), "今日浇水次数不应该被重置");

        // 验证保存方法被调用
        verify(profileRepository, times(1)).save(any(Profile.class));
        
        // 验证保存的Profile对象保持了小树进度
        verify(profileRepository).save(argThat(profile -> 
            profile.getTreeStage().equals(3) && 
            profile.getWateringProgress().equals(1) && 
            profile.getCompletedTrees().equals(2) &&
            profile.getTodayWaterCount().equals(1)
        ));
    }

    /**
     * 测试更新不存在的档案会抛出异常
     */
    @Test
    void testUpdateProfile_ProfileNotExists_ShouldThrowException() {
        // 设置mock行为：档案不存在
        when(profileRepository.findByUserId("non-existent-user")).thenReturn(Optional.empty());

        // 验证抛出异常
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            profileService.updateProfile("non-existent-user", updateDTO);
        });

        assertEquals("健康档案不存在", exception.getMessage());
    }

    /**
     * 测试专门的小树状态更新方法仍然正常工作
     */
    @Test
    void testUpdateTreeStatus_ShouldUpdateTreeFields() {
        // 设置mock行为
        when(profileRepository.findByUserId("test-user-id")).thenReturn(Optional.of(existingProfile));
        when(profileRepository.save(any(Profile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // 执行小树状态更新
        profileService.updateTreeStatus("test-user-id", 4, 0, 3);

        // 验证小树状态更新方法被正确调用
        verify(profileRepository).save(argThat(profile -> 
            profile.getTreeStage().equals(4) && 
            profile.getWateringProgress().equals(0) && 
            profile.getCompletedTrees().equals(3)
        ));
    }
}
