package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.TrackUserEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户事件追踪Repository接口
 */
@Repository
public interface TrackUserEventRepository extends MongoRepository<TrackUserEvent, String> {

    /**
     * 根据用户ID和时间范围查找事件
     */
    List<TrackUserEvent> findByUserIdAndTimestampBetweenOrderByTimestampDesc(
            String userId, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据用户ID和事件类型查找事件
     */
    List<TrackUserEvent> findByUserIdAndEventTypeOrderByTimestampDesc(
            String userId, String eventType);

    /**
     * 根据用户ID和事件名称查找事件
     */
    List<TrackUserEvent> findByUserIdAndEventNameOrderByTimestampDesc(
            String userId, String eventName);

    /**
     * 根据会话ID查找事件
     */
    List<TrackUserEvent> findBySessionIdOrderByTimestampDesc(String sessionId);

    /**
     * 统计用户在指定时间范围内的事件数量
     */
    long countByUserIdAndTimestampBetween(String userId, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 统计指定事件类型在时间范围内的数量
     */
    long countByEventTypeAndTimestampBetween(String eventType, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 统计指定事件名称在时间范围内的数量
     */
    long countByEventNameAndTimestampBetween(String eventName, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 查找用户最近的事件
     */
    List<TrackUserEvent> findTop10ByUserIdOrderByTimestampDesc(String userId);

    /**
     * 根据事件类型和时间范围查找事件
     */
    List<TrackUserEvent> findByEventTypeAndTimestampBetweenOrderByTimestampDesc(
            String eventType, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 统计用户各事件类型的数量
     */
    @Query("{ 'userId': ?0, 'timestamp': { $gte: ?1, $lte: ?2 } }")
    List<TrackUserEvent> findUserEventsInTimeRange(String userId, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据设备类型统计事件
     */
    long countByDeviceTypeAndTimestampBetween(String deviceType, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 查找热门事件（按事件名称分组统计）
     */
    @Query(value = "{ 'timestamp': { $gte: ?0, $lte: ?1 } }", fields = "{ 'eventName': 1, 'eventType': 1, 'timestamp': 1 }")
    List<TrackUserEvent> findEventsForAnalysis(LocalDateTime startTime, LocalDateTime endTime);
}