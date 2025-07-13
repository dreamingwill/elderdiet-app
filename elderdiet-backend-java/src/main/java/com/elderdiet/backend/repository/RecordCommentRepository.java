package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.RecordComment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 膳食记录评论仓库接口
 */
@Repository
public interface RecordCommentRepository extends MongoRepository<RecordComment, String> {

    /**
     * 根据记录ID查找所有评论（按创建时间排序）
     */
    List<RecordComment> findByRecordIdOrderByCreatedAtAsc(String recordId);

    /**
     * 根据用户ID查找所有评论
     */
    List<RecordComment> findByUserId(String userId);

    /**
     * 统计指定记录的评论数
     */
    long countByRecordId(String recordId);

    /**
     * 删除指定记录的所有评论
     */
    void deleteByRecordId(String recordId);
}