package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.Profile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

/**
 * 健康档案数据访问接口
 */
@Repository
public interface ProfileRepository extends MongoRepository<Profile, String> {
    
    /**
     * 根据用户ID查找健康档案
     */
    Optional<Profile> findByUserId(String userId);
    
    /**
     * 根据用户ID删除健康档案
     */
    void deleteByUserId(String userId);
    
    /**
     * 检查用户是否已有健康档案
     */
    boolean existsByUserId(String userId);
    
    /**
     * 根据年龄范围查找档案
     */
    List<Profile> findByAgeBetween(Integer minAge, Integer maxAge);
    
    /**
     * 根据性别查找档案
     */
    List<Profile> findByGender(String gender);
} 