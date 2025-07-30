package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.UserDevice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 用户设备Repository
 */
@Repository
public interface UserDeviceRepository extends MongoRepository<UserDevice, String> {

    /**
     * 根据用户ID查找所有设备
     */
    List<UserDevice> findByUserId(String userId);

    /**
     * 根据用户ID查找启用推送的设备
     */
    @Query("{'userId': ?0, 'pushEnabled': true}")
    List<UserDevice> findByUserIdAndPushEnabled(String userId);

    /**
     * 根据用户ID和设备Token查找设备
     */
    Optional<UserDevice> findByUserIdAndDeviceToken(String userId, String deviceToken);

    /**
     * 根据设备Token查找设备
     */
    Optional<UserDevice> findByDeviceToken(String deviceToken);

    /**
     * 根据设备Token查找所有设备（处理重复情况）
     */
    List<UserDevice> findAllByDeviceToken(String deviceToken);

    /**
     * 查找启用膳食记录推送的设备
     */
    @Query("{'userId': ?0, 'pushEnabled': true, 'mealRecordPushEnabled': true}")
    List<UserDevice> findByUserIdAndMealRecordPushEnabled(String userId);

    /**
     * 查找启用提醒推送的设备
     */
    @Query("{'userId': ?0, 'pushEnabled': true, 'reminderPushEnabled': true}")
    List<UserDevice> findByUserIdAndReminderPushEnabled(String userId);

    /**
     * 查找多个用户的启用推送设备
     */
    @Query("{'userId': {'$in': ?0}, 'pushEnabled': true}")
    List<UserDevice> findByUserIdInAndPushEnabled(List<String> userIds);

    /**
     * 查找多个用户的启用膳食记录推送设备
     */
    @Query("{'userId': {'$in': ?0}, 'pushEnabled': true, 'mealRecordPushEnabled': true}")
    List<UserDevice> findByUserIdInAndMealRecordPushEnabled(List<String> userIds);

    /**
     * 删除指定时间之前不活跃的设备
     */
    void deleteByLastActiveAtBefore(LocalDateTime dateTime);

    /**
     * 根据用户ID删除所有设备
     */
    void deleteByUserId(String userId);

    /**
     * 检查用户是否有设备
     */
    boolean existsByUserId(String userId);

    /**
     * 检查设备Token是否存在
     */
    boolean existsByDeviceToken(String deviceToken);

    /**
     * 根据用户ID和平台查找设备
     */
    List<UserDevice> findByUserIdAndPlatform(String userId, UserDevice.DevicePlatform platform);

    /**
     * 统计指定时间之前不活跃的设备数量
     */
    long countByLastActiveAtBefore(LocalDateTime dateTime);
}
