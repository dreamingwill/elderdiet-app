package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.User;
import com.elderdiet.backend.entity.UserRole;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 用户数据访问接口
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /**
     * 根据手机号查找用户
     */
    Optional<User> findByPhone(String phone);

    /**
     * 检查手机号是否存在
     */
    boolean existsByPhone(String phone);

    /**
     * 根据角色查找用户列表
     */
    List<User> findByRole(UserRole role);
}