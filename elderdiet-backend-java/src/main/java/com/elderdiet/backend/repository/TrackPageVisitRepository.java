package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.TrackPageVisit;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 页面访问追踪Repository接口
 */
@Repository
public interface TrackPageVisitRepository extends MongoRepository<TrackPageVisit, String> {

    /**
     * 根据用户ID和时间范围查找页面访问记录
     */
    List<TrackPageVisit> findByUserIdAndEnterTimeBetweenOrderByEnterTimeDesc(
            String userId, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据用户ID和页面名称查找访问记录
     */
    List<TrackPageVisit> findByUserIdAndPageNameOrderByEnterTimeDesc(
            String userId, String pageName);

    /**
     * 根据会话ID查找页面访问记录
     */
    List<TrackPageVisit> findBySessionIdOrderByEnterTimeDesc(String sessionId);

    /**
     * 查找用户最近的页面访问记录
     */
    Optional<TrackPageVisit> findTopByUserIdOrderByEnterTimeDesc(String userId);

    /**
     * 查找用户当前打开的页面（没有退出时间的）
     */
    List<TrackPageVisit> findByUserIdAndExitTimeIsNull(String userId);

    /**
     * 统计用户在指定时间范围内的页面访问次数
     */
    long countByUserIdAndEnterTimeBetween(String userId, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 统计指定页面在时间范围内的访问次数
     */
    long countByPageNameAndEnterTimeBetween(String pageName, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据页面名称和时间范围查找访问记录
     */
    List<TrackPageVisit> findByPageNameAndEnterTimeBetweenOrderByEnterTimeDesc(
            String pageName, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 查找Tab页面的访问记录
     */
    @Query("{ 'pageName': { $in: ['meal-plan', 'chat', 'discovery', 'profile'] }, " +
            "'enterTime': { $gte: ?0, $lte: ?1 } }")
    List<TrackPageVisit> findTabPageVisits(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 统计用户各页面的访问次数
     */
    @Query("{ 'userId': ?0, 'enterTime': { $gte: ?1, $lte: ?2 } }")
    List<TrackPageVisit> findUserPageVisitsInTimeRange(String userId, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据设备类型统计页面访问
     */
    long countByDeviceTypeAndEnterTimeBetween(String deviceType, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 查找热门页面（按访问次数）
     */
    @Query(value = "{ 'enterTime': { $gte: ?0, $lte: ?1 } }", fields = "{ 'pageName': 1, 'duration': 1, 'enterTime': 1 }")
    List<TrackPageVisit> findPageVisitsForAnalysis(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 查找有停留时长的页面访问记录（用于分析页面停留情况）
     */
    List<TrackPageVisit> findByDurationIsNotNullAndEnterTimeBetween(
            LocalDateTime startTime, LocalDateTime endTime);
}