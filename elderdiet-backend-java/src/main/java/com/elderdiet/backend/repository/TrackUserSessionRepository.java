package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.TrackUserSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 用户会话追踪Repository接口
 */
@Repository
public interface TrackUserSessionRepository extends MongoRepository<TrackUserSession, String> {

    /**
     * 根据会话ID查找会话
     */
    Optional<TrackUserSession> findBySessionId(String sessionId);

    /**
     * 根据用户ID和活跃状态查找会话
     */
    List<TrackUserSession> findByUserIdAndIsActiveTrue(String userId);

    /**
     * 根据用户ID查找最近的会话
     */
    Optional<TrackUserSession> findTopByUserIdOrderByStartTimeDesc(String userId);

    /**
     * 根据用户ID和时间范围查找会话
     */
    List<TrackUserSession> findByUserIdAndStartTimeBetweenOrderByStartTimeDesc(
            String userId, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据时间范围查找所有会话
     */
    List<TrackUserSession> findByStartTimeBetweenOrderByStartTimeDesc(
            LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 统计用户在指定时间范围内的会话数量
     */
    long countByUserIdAndStartTimeBetween(String userId, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 统计指定时间范围内的活跃用户数量
     */
    @Query("{ 'startTime': { $gte: ?0, $lte: ?1 } }")
    List<TrackUserSession> findSessionsInTimeRange(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 查找用户的活跃会话
     */
    @Query("{ 'userId': ?0, 'isActive': true }")
    List<TrackUserSession> findActiveSessionsByUserId(String userId);

    /**
     * 根据设备类型统计会话
     */
    long countByDeviceTypeAndStartTimeBetween(String deviceType, LocalDateTime startTime, LocalDateTime endTime);
}