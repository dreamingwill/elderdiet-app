package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.MealRecord;
import com.elderdiet.backend.entity.RecordVisibility;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 膳食记录仓库接口
 */
@Repository
public interface MealRecordRepository extends MongoRepository<MealRecord, String> {

    /**
     * 根据用户ID查找膳食记录
     */
    List<MealRecord> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * 根据用户ID和可见性查找膳食记录
     */
    List<MealRecord> findByUserIdAndVisibilityOrderByCreatedAtDesc(String userId, RecordVisibility visibility);

    /**
     * 根据用户ID列表查找膳食记录
     */
    List<MealRecord> findByUserIdInOrderByCreatedAtDesc(List<String> userIds);

    /**
     * 根据用户ID列表和可见性查找膳食记录
     */
    List<MealRecord> findByUserIdInAndVisibilityOrderByCreatedAtDesc(List<String> userIds, RecordVisibility visibility);

    /**
     * 根据用户ID查找膳食记录（限制数量）
     */
    List<MealRecord> findTop30ByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * 根据用户ID列表和可见性查找膳食记录（限制数量）
     */
    List<MealRecord> findTop30ByUserIdInAndVisibilityOrderByCreatedAtDesc(List<String> userIds,
            RecordVisibility visibility);
}