package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.MealRecordRequest;
import com.elderdiet.backend.dto.MealRecordResponse;
import com.elderdiet.backend.dto.ProfileDTO;
import com.elderdiet.backend.dto.VisibilityUpdateRequest;
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
    private final NutritionistCommentService nutritionistCommentService;
    private final JPushService jPushService;
    private final FamilyService familyService;

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
                .shareWithNutritionist(
                        request.getShareWithNutritionist() != null ? request.getShareWithNutritionist() : false)
                .build();

        MealRecord savedRecord = mealRecordRepository.save(mealRecord);

        // 触发小树浇水逻辑
        gamificationService.waterTree(user);

        // 如果可见性为FAMILY，触发推送通知给子女用户
        if (request.getVisibility() == RecordVisibility.FAMILY) {
            log.info("膳食记录设置为家庭可见，开始推送通知给子女用户");
            // 异步执行推送，避免阻塞用户操作
            new Thread(() -> {
                try {
                    sendMealRecordNotificationToChildren(user, savedRecord);
                } catch (Exception e) {
                    log.error("发送膳食记录推送通知失败: {}", e.getMessage(), e);
                }
            }).start();
        }

        // 如果用户选择分享给营养师，异步生成营养师评论
        if (savedRecord.getShareWithNutritionist()) {
            log.info("用户选择分享给营养师，开始生成营养师评论");
            // 异步执行，避免阻塞用户操作
            new Thread(() -> {
                try {
                    nutritionistCommentService.generateNutritionistComment(savedRecord.getId(), user.getId());
                } catch (Exception e) {
                    log.error("异步生成营养师评论失败: {}", e.getMessage(), e);
                }
            }).start();
        }

        log.info("膳食记录创建成功: {}", savedRecord.getId());
        return savedRecord;
    }

    /**
     * 获取用户的分享墙时间线（最多显示最近的30条）
     */
    public List<MealRecordResponse> getFeedForUser(User user) {
        log.info("获取用户 {} 的分享墙时间线", user.getPhone());

        List<MealRecord> records = new ArrayList<>();

        switch (user.getRole()) {
            case ELDER:
                // 老人用户：查询自己发布的最近30条记录
                records = mealRecordRepository.findTop30ByUserIdOrderByCreatedAtDesc(user.getId());
                break;

            case CHILD:
                // 子女用户：查询绑定的老人发布的FAMILY可见的最近30条记录
                List<FamilyLink> familyLinks = familyLinkRepository.findByChildId(user.getId());
                if (!familyLinks.isEmpty()) {
                    List<String> parentIds = familyLinks.stream()
                            .map(FamilyLink::getParentId)
                            .collect(Collectors.toList());
                    records = mealRecordRepository.findTop30ByUserIdInAndVisibilityOrderByCreatedAtDesc(
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
                .shareWithNutritionist(record.getShareWithNutritionist())
                .nutritionistComment(record.getNutritionistComment())
                .nutritionistCommentAt(record.getNutritionistCommentAt())
                .userInfo(userInfo)
                .likedByCurrentUser(likedByCurrentUser)
                .comments(comments)
                .build();
    }

    /**
     * 更新膳食记录的可见性
     */
    @Transactional
    public MealRecord updateRecordVisibility(String recordId, User user, VisibilityUpdateRequest request) {
        log.info("用户 {} 更新膳食记录 {} 的可见性为 {}", user.getPhone(), recordId, request.getVisibility());

        // 查找膳食记录
        MealRecord record = mealRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("膳食记录不存在"));

        // 验证权限：只有记录的创建者可以修改可见性
        if (!record.getUserId().equals(user.getId())) {
            throw new RuntimeException("无权限修改此膳食记录");
        }

        // 更新可见性
        record.setVisibility(request.getVisibility());
        MealRecord updatedRecord = mealRecordRepository.save(record);

        log.info("膳食记录 {} 的可见性已更新为 {}", recordId, request.getVisibility());
        return updatedRecord;
    }

    /**
     * 生成营养师评论（公开方法，供Controller调用）
     */
    public void generateNutritionistComment(String recordId, String userId) {
        // 异步执行，避免阻塞用户操作
        new Thread(() -> {
            try {
                nutritionistCommentService.generateNutritionistComment(recordId, userId);
            } catch (Exception e) {
                log.error("异步生成营养师评论失败: {}", e.getMessage(), e);
            }
        }).start();
    }

    /**
     * 根据ID获取膳食记录
     */
    public MealRecord getMealRecordById(String recordId) {
        return mealRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("膳食记录不存在"));
    }

    /**
     * 发送膳食记录通知给子女用户
     */
    private void sendMealRecordNotificationToChildren(User elderUser, MealRecord mealRecord) {
        try {
            // 获取老人的所有子女链接
            List<FamilyLink> childrenLinks = familyService.getChildrenLinks(elderUser.getId());

            if (childrenLinks.isEmpty()) {
                log.info("老人用户 {} 没有关联的子女用户，跳过推送", elderUser.getPhone());
                return;
            }

            // 获取子女用户ID列表
            List<String> childUserIds = childrenLinks.stream()
                    .map(FamilyLink::getChildId)
                    .collect(Collectors.toList());

            // 获取老人的姓名（用于推送内容）
            String elderName = getElderDisplayName(elderUser);

            // 发送推送通知
            jPushService.sendMealRecordNotification(elderName, mealRecord.getId(), childUserIds);

            log.info("成功发送膳食记录推送通知，老人: {}, 子女数量: {}",
                    elderUser.getPhone(), childUserIds.size());

        } catch (Exception e) {
            log.error("发送膳食记录推送通知失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 获取老人的显示名称
     */
    private String getElderDisplayName(User elderUser) {
        try {
            // 尝试获取用户档案中的姓名
            ProfileDTO profile = profileService.getProfileByUserIdInternal(elderUser.getId());
            if (profile != null && profile.getName() != null && !profile.getName().trim().isEmpty()) {
                return profile.getName();
            }
        } catch (Exception e) {
            log.debug("获取用户档案失败，使用默认名称: {}", e.getMessage());
        }

        // 如果没有设置姓名，使用手机号的后4位
        String phone = elderUser.getPhone();
        if (phone != null && phone.length() >= 4) {
            return "用户" + phone.substring(phone.length() - 4);
        }

        return "家人";
    }
}