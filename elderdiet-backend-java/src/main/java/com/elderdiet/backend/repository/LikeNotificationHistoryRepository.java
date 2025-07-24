package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.LikeNotificationHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 点赞通知历史记录Repository
 */
@Repository
public interface LikeNotificationHistoryRepository extends MongoRepository<LikeNotificationHistory, String> {

    /**
     * 根据记录ID和点赞者ID查找通知历史
     */
    Optional<LikeNotificationHistory> findByRecordIdAndLikerId(String recordId, String likerId);

    /**
     * 检查是否已存在通知历史记录
     */
    boolean existsByRecordIdAndLikerId(String recordId, String likerId);

    /**
     * 删除指定记录的所有通知历史
     */
    void deleteByRecordId(String recordId);

    /**
     * 删除指定用户的所有通知历史
     */
    void deleteByLikerId(String likerId);
}
