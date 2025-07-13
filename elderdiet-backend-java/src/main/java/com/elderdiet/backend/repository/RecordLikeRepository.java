package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.RecordLike;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 膳食记录点赞仓库接口
 */
@Repository
public interface RecordLikeRepository extends MongoRepository<RecordLike, String> {

    /**
     * 根据记录ID和用户ID查找点赞记录
     */
    Optional<RecordLike> findByRecordIdAndUserId(String recordId, String userId);

    /**
     * 检查用户是否点赞了指定记录
     */
    boolean existsByRecordIdAndUserId(String recordId, String userId);

    /**
     * 根据记录ID查找所有点赞记录
     */
    List<RecordLike> findByRecordId(String recordId);

    /**
     * 根据用户ID查找所有点赞记录
     */
    List<RecordLike> findByUserId(String userId);

    /**
     * 统计指定记录的点赞数
     */
    long countByRecordId(String recordId);

    /**
     * 删除指定记录的所有点赞
     */
    void deleteByRecordId(String recordId);
}