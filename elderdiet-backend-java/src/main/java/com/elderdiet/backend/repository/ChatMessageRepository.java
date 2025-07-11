package com.elderdiet.backend.repository;

import com.elderdiet.backend.entity.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 聊天消息数据访问层
 */
@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    /**
     * 根据用户ID查询最新的消息记录（按时间倒序）
     * 
     * @param userId 用户ID
     * @return 最新的消息列表
     */
    List<ChatMessage> findTop10ByUserIdOrderByTimestampDesc(String userId);

    /**
     * 根据用户ID查询所有消息记录（按时间正序）
     * 
     * @param userId 用户ID
     * @return 消息列表
     */
    List<ChatMessage> findByUserIdOrderByTimestampAsc(String userId);

    /**
     * 根据用户ID和角色查询消息记录
     * 
     * @param userId 用户ID
     * @param role   角色（user/assistant）
     * @return 消息列表
     */
    List<ChatMessage> findByUserIdAndRoleOrderByTimestampAsc(String userId, String role);

    /**
     * 删除指定用户的所有聊天记录
     * 
     * @param userId 用户ID
     */
    void deleteByUserId(String userId);

    /**
     * 根据用户ID和时间戳查询消息记录（按时间正序）
     * 
     * @param userId    用户ID
     * @param timestamp 时间戳，查询这个时间之后的消息
     * @return 消息列表
     */
    List<ChatMessage> findByUserIdAndTimestampAfterOrderByTimestampAsc(String userId, java.time.Instant timestamp);
}