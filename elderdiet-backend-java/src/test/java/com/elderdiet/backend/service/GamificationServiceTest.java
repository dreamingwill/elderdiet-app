package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.ProfileDTO;
import com.elderdiet.backend.entity.User;
import com.elderdiet.backend.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * 游戏化服务测试类
 */
@SpringBootTest
public class GamificationServiceTest {

    @Mock
    private ProfileService profileService;

    private GamificationService gamificationService;

    private User testUser;
    private ProfileDTO testProfile;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        gamificationService = new GamificationService(profileService);

        // 创建测试用户
        testUser = User.builder()
                .id("test-user-id")
                .phone("13800138000")
                .role(UserRole.ELDER)
                .build();

        // 创建测试档案
        testProfile = ProfileDTO.builder()
                .userId("test-user-id")
                .name("测试用户")
                .treeStage(0)
                .wateringProgress(0)
                .completedTrees(0)
                .todayWaterCount(0)
                .lastWaterTime(null)
                .build();
    }

    @Test
    void testWaterTree_ShouldResetDailyCountBeforeCheck() {
        // 模拟用户今日浇水次数已达上限的情况
        testProfile.setTodayWaterCount(2);
        
        // 模拟重置后的档案
        ProfileDTO resetProfile = ProfileDTO.builder()
                .userId("test-user-id")
                .name("测试用户")
                .treeStage(0)
                .wateringProgress(0)
                .completedTrees(0)
                .todayWaterCount(0) // 重置后为0
                .lastWaterTime(null)
                .build();

        // 设置mock行为
        when(profileService.getProfileByUserId("test-user-id")).thenReturn(testProfile);
        when(profileService.checkAndResetDailyWaterCount("test-user-id")).thenReturn(resetProfile);

        // 执行浇水
        gamificationService.waterTree(testUser);

        // 验证调用了重置方法
        verify(profileService, times(1)).checkAndResetDailyWaterCount("test-user-id");
        
        // 验证调用了更新浇水状态方法（因为重置后可以浇水）
        verify(profileService, times(1)).updateWateringStatus(
                eq("test-user-id"), 
                eq(1), // 浇水进度+1
                eq(1), // 今日浇水次数+1
                any(LocalDateTime.class)
        );
    }

    @Test
    void testGetTreeStatus_ShouldResetDailyCountBeforeReturn() {
        // 设置mock行为
        when(profileService.getProfileByUserId("test-user-id")).thenReturn(testProfile);
        when(profileService.checkAndResetDailyWaterCount("test-user-id")).thenReturn(testProfile);

        // 执行获取状态
        gamificationService.getTreeStatus(testUser);

        // 验证调用了重置方法
        verify(profileService, times(1)).checkAndResetDailyWaterCount("test-user-id");
    }

    @Test
    void testWaterTree_WithNullProfile_ShouldReturn() {
        // 设置mock行为：档案不存在
        when(profileService.getProfileByUserId("test-user-id")).thenReturn(null);

        // 执行浇水
        gamificationService.waterTree(testUser);

        // 验证没有调用重置方法
        verify(profileService, never()).checkAndResetDailyWaterCount(anyString());
        verify(profileService, never()).updateWateringStatus(anyString(), any(), any(), any());
    }
}
