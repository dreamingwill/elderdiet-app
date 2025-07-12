package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.FamilyLink;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 家庭链接仓库接口
 */
@Repository
public interface FamilyLinkRepository extends MongoRepository<FamilyLink, String> {

    /**
     * 根据老人ID查找所有家庭链接
     */
    List<FamilyLink> findByParentId(String parentId);

    /**
     * 根据子女ID查找家庭链接
     */
    List<FamilyLink> findByChildId(String childId);

    /**
     * 根据老人ID和子女ID查找家庭链接
     */
    Optional<FamilyLink> findByParentIdAndChildId(String parentId, String childId);

    /**
     * 检查是否存在指定的家庭链接
     */
    boolean existsByParentIdAndChildId(String parentId, String childId);
}