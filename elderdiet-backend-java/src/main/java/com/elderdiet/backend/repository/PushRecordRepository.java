package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.PushRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 推送记录Repository
 */
@Repository
public interface PushRecordRepository extends MongoRepository<PushRecord, String> {

    /**
     * 根据推送类型查找记录
     */
    List<PushRecord> findByPushType(PushRecord.PushType pushType);

    /**
     * 根据关联实体ID查找记录
     */
    List<PushRecord> findByRelatedEntityId(String relatedEntityId);

    /**
     * 根据推送状态查找记录
     */
    List<PushRecord> findByStatus(PushRecord.PushStatus status);

    /**
     * 查找指定时间范围内的推送记录
     */
    @Query("{'createdAt': {'$gte': ?0, '$lte': ?1}}")
    List<PushRecord> findByCreatedAtBetween(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 分页查询推送记录
     */
    Page<PushRecord> findByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * 根据推送类型分页查询
     */
    Page<PushRecord> findByPushTypeOrderByCreatedAtDesc(PushRecord.PushType pushType, Pageable pageable);

    /**
     * 查找失败的推送记录
     */
    @Query("{'status': {'$in': ['FAILED', 'PARTIAL']}}")
    List<PushRecord> findFailedRecords();

    /**
     * 删除指定时间之前的记录
     */
    void deleteByCreatedAtBefore(LocalDateTime dateTime);

    /**
     * 统计推送成功率
     */
    @Query(value = "{'createdAt': {'$gte': ?0, '$lte': ?1}}", 
           fields = "{'successCount': 1, 'failureCount': 1, 'targetCount': 1}")
    List<PushRecord> findStatisticsByDateRange(LocalDateTime startTime, LocalDateTime endTime);
}
