package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.MealRecordRequest;
import com.elderdiet.backend.dto.MealRecordResponse;
import com.elderdiet.backend.dto.ProfileDTO;
import com.elderdiet.backend.entity.*;
import com.elderdiet.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 膳食记录服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MealRecordService {

    private final MealRecordRepository mealRecordRepository;
    private final OssService ossService;
    private final FamilyLinkRepository familyLinkRepository;
    private final UserService userService;
    private final ProfileService profileService;
    private final RecordLikeRepository recordLikeRepository;
    private final RecordCommentRepository recordCommentRepository;
    private final GamificationService gamificationService;

    /**
     * 创建膳食记录
     */
    public MealRecord createMealRecord(User user, MealRecordRequest request, List<MultipartFile> images) {
        log.info("用户 {} 创建膳食记录", user.getPhone());

        // 验证用户角色
        if (user.getRole() != UserRole.ELDER) {
            throw new RuntimeException("只有老人用户可以创建膳食记录");
        }

        // 上传图片
        List<String> imageUrls = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                if (!image.isEmpty()) {
                    String imageUrl = ossService.uploadFile(image);
                    imageUrls.add(imageUrl);
                }
            }
        }

        // 创建膳食记录
        MealRecord mealRecord = MealRecord.builder()
                .userId(user.getId())
                .imageUrls(imageUrls)
                .caption(request.getCaption() != null ? request.getCaption() : "")
                .visibility(request.getVisibility())
                .build();

        MealRecord savedRecord = mealRecordRepository.save(mealRecord);

        // 触发小树浇水逻辑
        gamificationService.waterTree(user);

        // TODO: 如果可见性为FAMILY，触发通知逻辑
        if (request.getVisibility() == RecordVisibility.FAMILY) {
            log.info("TODO: 触发家庭通知逻辑");
        }

        log.info("膳食记录创建成功: {}", savedRecord.getId());
        return savedRecord;
    }

    /**
     * 获取用户的分享墙时间线
     */
    public List<MealRecordResponse> getFeedForUser(User user) {
        log.info("获取用户 {} 的分享墙时间线", user.getPhone());

        List<MealRecord> records = new ArrayList<>();

        switch (user.getRole()) {
            case ELDER:
                // 老人用户：查询自己发布的所有记录
                records = mealRecordRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
                break;

            case CHILD:
                // 子女用户：查询绑定的老人发布的FAMILY可见的记录
                List<FamilyLink> familyLinks = familyLinkRepository.findByChildId(user.getId());
                if (!familyLinks.isEmpty()) {
                    List<String> parentIds = familyLinks.stream()
                            .map(FamilyLink::getParentId)
                            .collect(Collectors.toList());
                    records = mealRecordRepository.findByUserIdInAndVisibilityOrderByCreatedAtDesc(
                            parentIds, RecordVisibility.FAMILY);
                }
                break;

            default:
                log.warn("未知的用户角色: {}", user.getRole());
                return Collections.emptyList();
        }

        // 转换为响应DTO
        return records.stream()
                .map(record -> convertToResponse(record, user))
                .collect(Collectors.toList());
    }

    /**
     * 切换点赞状态
     */
    @Transactional
    public void toggleLike(String recordId, User user) {
        log.info("用户 {} 切换记录 {} 的点赞状态", user.getPhone(), recordId);

        // 检查记录是否存在
        MealRecord record = mealRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("膳食记录不存在"));

        // 检查是否已经点赞
        boolean isLiked = recordLikeRepository.existsByRecordIdAndUserId(recordId, user.getId());

        if (isLiked) {
            // 取消点赞
            recordLikeRepository.findByRecordIdAndUserId(recordId, user.getId())
                    .ifPresent(recordLikeRepository::delete);

            // 更新点赞数
            record.setLikesCount(Math.max(0, record.getLikesCount() - 1));
            log.info("用户 {} 取消点赞记录 {}", user.getPhone(), recordId);
        } else {
            // 添加点赞
            RecordLike like = RecordLike.builder()
                    .recordId(recordId)
                    .userId(user.getId())
                    .build();
            recordLikeRepository.save(like);

            // 更新点赞数
            record.setLikesCount(record.getLikesCount() + 1);
            log.info("用户 {} 点赞记录 {}", user.getPhone(), recordId);
        }

        mealRecordRepository.save(record);
    }

    /**
     * 添加评论
     */
    @Transactional
    public RecordComment addComment(String recordId, User user, String text) {
        log.info("用户 {} 评论记录 {}", user.getPhone(), recordId);

        // 检查记录是否存在
        MealRecord record = mealRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("膳食记录不存在"));

        // 获取用户资料
        ProfileDTO profile = profileService.getProfileByUserId(user.getId());
        String username = (profile != null && profile.getName() != null) ? profile.getName() : user.getPhone();
        String userAvatar = (profile != null) ? profile.getAvatarUrl() : null;

        // 创建评论
        RecordComment comment = RecordComment.builder()
                .recordId(recordId)
                .userId(user.getId())
                .username(username)
                .userAvatar(userAvatar)
                .text(text)
                .build();

        RecordComment savedComment = recordCommentRepository.save(comment);

        // 更新评论数
        record.setCommentsCount(record.getCommentsCount() + 1);
        mealRecordRepository.save(record);

        log.info("评论添加成功: {}", savedComment.getId());
        return savedComment;
    }

    /**
     * 获取指定记录的所有评论
     */
    public List<MealRecordResponse.CommentInfo> getComments(String recordId) {
        List<RecordComment> comments = recordCommentRepository.findByRecordIdOrderByCreatedAtAsc(recordId);

        return comments.stream()
                .map(comment -> MealRecordResponse.CommentInfo.builder()
                        .id(comment.getId())
                        .userId(comment.getUserId())
                        .username(comment.getUsername())
                        .userAvatar(comment.getUserAvatar())
                        .text(comment.getText())
                        .createdAt(comment.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 转换MealRecord为MealRecordResponse
     */
    private MealRecordResponse convertToResponse(MealRecord record, User currentUser) {
        // 获取发布者信息
        User publisher = userService.findById(record.getUserId())
                .orElse(null);

        MealRecordResponse.UserInfo userInfo = null;
        if (publisher != null) {
            // 获取发布者资料
            ProfileDTO profile = profileService.getProfileByUserId(publisher.getId());
            String username = (profile != null && profile.getName() != null) ? profile.getName() : publisher.getPhone();
            String avatar = (profile != null) ? profile.getAvatarUrl() : null;

            userInfo = MealRecordResponse.UserInfo.builder()
                    .userId(publisher.getId())
                    .username(username)
                    .avatar(avatar)
                    .nickname(publisher.getPhone()) // 仍然使用手机号作为昵称，暂时没用
                    .build();
        }

        // 查询当前用户是否点赞
        boolean likedByCurrentUser = recordLikeRepository.existsByRecordIdAndUserId(
                record.getId(), currentUser.getId());

        // 查询评论列表
        List<MealRecordResponse.CommentInfo> comments = getComments(record.getId());

        return MealRecordResponse.builder()
                .id(record.getId())
                .userId(record.getUserId())
                .imageUrls(record.getImageUrls())
                .caption(record.getCaption())
                .visibility(record.getVisibility())
                .likesCount(record.getLikesCount())
                .commentsCount(record.getCommentsCount())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .userInfo(userInfo)
                .likedByCurrentUser(likedByCurrentUser)
                .comments(comments)
                .build();
    }
}