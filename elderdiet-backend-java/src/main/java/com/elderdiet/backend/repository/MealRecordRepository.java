package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.MealRecord;
import com.elderdiet.backend.entity.RecordVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
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
        List<MealRecord> findByUserIdInAndVisibilityOrderByCreatedAtDesc(List<String> userIds,
                        RecordVisibility visibility);

        /**
         * 根据用户ID查找膳食记录（限制数量）
         */
        List<MealRecord> findTop30ByUserIdOrderByCreatedAtDesc(String userId);

        /**
         * 根据用户ID列表和可见性查找膳食记录（限制数量）
         */
        List<MealRecord> findTop30ByUserIdInAndVisibilityOrderByCreatedAtDesc(List<String> userIds,
                        RecordVisibility visibility);

        /**
         * 根据用户ID分页查找膳食记录
         */
        Page<MealRecord> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

        /**
         * 根据用户ID列表和可见性分页查找膳食记录
         */
        Page<MealRecord> findByUserIdInAndVisibilityOrderByCreatedAtDesc(List<String> userIds,
                        RecordVisibility visibility, Pageable pageable);

        /**
         * 统计用户的膳食记录总数
         */
        long countByUserId(String userId);

        /**
         * 统计用户ID列表和可见性的膳食记录总数
         */
        long countByUserIdInAndVisibility(List<String> userIds, RecordVisibility visibility);

        /**
         * 组合查询：查询用户自己的所有记录和其他用户的FAMILY可见记录
         * 使用MongoDB的$or操作符来实现复合条件
         */
        @Query("{ '$or': [ { 'userId': ?0 }, { 'userId': { '$in': ?1 }, 'visibility': 'FAMILY' } ] }")
        Page<MealRecord> findOwnAndFamilyVisibleRecords(String userId, List<String> otherUserIds, Pageable pageable);

        /**
         * 统计用户自己的所有记录和其他用户的FAMILY可见记录数量
         */
        @Query(value = "{ '$or': [ { 'userId': ?0 }, { 'userId': { '$in': ?1 }, 'visibility': 'FAMILY' } ] }", count = true)
        long countOwnAndFamilyVisibleRecords(String userId, List<String> otherUserIds);

        /**
         * 组合查询：查询用户自己的所有记录和其他用户的FAMILY可见记录（按创建时间倒序排序）
         * 使用MongoDB的$or操作符来实现复合条件
         */
        @Query(value = "{ '$or': [ { 'userId': ?0 }, { 'userId': { '$in': ?1 }, 'visibility': 'FAMILY' } ] }", sort = "{ 'createdAt': -1 }")
        List<MealRecord> findOwnAndFamilyVisibleRecordsOrderByCreatedAtDesc(String userId, List<String> otherUserIds);

        /**
         * 根据用户ID删除所有膳食记录
         */
        void deleteByUserId(String userId);
}