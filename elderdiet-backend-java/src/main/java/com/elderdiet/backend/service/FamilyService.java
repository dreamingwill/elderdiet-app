package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.FamilyMemberDTO;
import com.elderdiet.backend.dto.ProfileDTO;
import com.elderdiet.backend.entity.FamilyLink;
import com.elderdiet.backend.entity.User;
import com.elderdiet.backend.entity.UserRole;
import com.elderdiet.backend.repository.FamilyLinkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.util.HashSet;
import java.util.Set;

/**
 * 家庭服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyLinkRepository familyLinkRepository;
    private final UserService userService;
    private final ProfileService profileService;

    /**
     * 智能链接家庭成员 - 根据目标用户的角色自动建立正确的关系
     */
    public FamilyLink linkFamilyMember(User currentUser, String targetPhone) {
        log.info("用户 {} (当前角色: {}) 尝试添加家庭成员: {}",
                currentUser.getPhone(), currentUser.getRole(), targetPhone);

        // 查找目标用户
        User targetUser = userService.findByPhone(targetPhone)
                .orElseThrow(() -> new RuntimeException("目标用户不存在"));

        log.info("找到目标用户 {} (角色: {})", targetUser.getPhone(), targetUser.getRole());

        // 不能添加自己
        if (currentUser.getId().equals(targetUser.getId())) {
            throw new RuntimeException("不能添加自己");
        }

        // 根据目标用户的角色决定关系类型
        String parentId, childId;
        String relationshipDesc;

        if (targetUser.getRole() == UserRole.ELDER) {
            // 目标是老人，建立 targetUser(老人) -> currentUser(子女) 的关系
            parentId = targetUser.getId();
            childId = currentUser.getId();
            relationshipDesc = String.format("建立关系: %s(老人) -> %s(子女)", targetUser.getPhone(), currentUser.getPhone());
        } else {
            // 目标是子女，建立 currentUser(老人) -> targetUser(子女) 的关系
            parentId = currentUser.getId();
            childId = targetUser.getId();
            relationshipDesc = String.format("建立关系: %s(老人) -> %s(子女)", currentUser.getPhone(), targetUser.getPhone());
        }

        // 检查关系是否已存在
        if (familyLinkRepository.existsByParentIdAndChildId(parentId, childId)) {
            throw new RuntimeException("该家庭关系已经存在");
        }

        // 创建家庭链接
        FamilyLink familyLink = FamilyLink.builder()
                .parentId(parentId)
                .childId(childId)
                .build();

        FamilyLink savedLink = familyLinkRepository.save(familyLink);
        log.info("成功创建家庭链接: {}", relationshipDesc);

        return savedLink;
    }

    /**
     * 链接子女用户 - 保持向后兼容性
     */
    public FamilyLink linkChild(User parent, String childPhone) {
        log.info("老人用户 {} 尝试链接子女用户: {}", parent.getPhone(), childPhone);

        // 验证发起者当前角色必须是老人（基于当前激活角色）
        if (parent.getRole() != UserRole.ELDER) {
            throw new RuntimeException("当前角色不是老人，无法添加子女");
        }

        // 使用智能链接方法
        return linkFamilyMember(parent, childPhone);
    }

    /**
     * 链接老人用户 - 保持向后兼容性
     */
    public FamilyLink linkElder(User child, String elderPhone) {
        log.info("子女用户 {} 尝试链接老人用户: {}", child.getPhone(), elderPhone);

        // 验证发起者当前角色必须是子女（基于当前激活角色）
        if (child.getRole() != UserRole.CHILD) {
            throw new RuntimeException("当前角色不是子女，无法添加老人");
        }

        // 使用智能链接方法
        return linkFamilyMember(child, elderPhone);
    }

    /**
     * 获取老人的所有子女链接
     */
    public List<FamilyLink> getChildrenLinks(String parentId) {
        return familyLinkRepository.findByParentId(parentId);
    }

    /**
     * 获取子女的所有老人链接
     */
    public List<FamilyLink> getParentsLinks(String childId) {
        return familyLinkRepository.findByChildId(childId);
    }

    /**
     * 删除家庭链接
     */
    public void unlinkChild(String parentId, String childId) {
        familyLinkRepository.findByParentIdAndChildId(parentId, childId)
                .ifPresent(familyLinkRepository::delete);
        log.info("删除家庭链接: 老人 {} -> 子女 {}", parentId, childId);
    }

    /**
     * 通用删除家庭链接方法 - 支持双向删除
     */
    public void unlinkFamilyMember(String currentUserId, String targetUserId) {
        log.info("用户 {} 尝试删除与用户 {} 的家庭链接", currentUserId, targetUserId);

        // 查找两用户之间的链接关系（当前用户作为父母）
        java.util.Optional<FamilyLink> link = familyLinkRepository.findByParentIdAndChildId(currentUserId,
                targetUserId);
        if (link.isPresent()) {
            familyLinkRepository.delete(link.get());
            log.info("删除家庭链接: 老人 {} -> 子女 {}", currentUserId, targetUserId);
            return;
        }

        // 如果没找到，尝试反向查找（当前用户作为子女）
        link = familyLinkRepository.findByParentIdAndChildId(targetUserId, currentUserId);
        if (link.isPresent()) {
            familyLinkRepository.delete(link.get());
            log.info("删除家庭链接: 老人 {} -> 子女 {}", targetUserId, currentUserId);
            return;
        }

        throw new RuntimeException("未找到家庭关系链接，无法删除");
    }

    /**
     * 获取当前用户的所有家庭成员信息
     */
    public List<FamilyMemberDTO> getFamilyMembers(User currentUser) {
        log.info("获取用户 {} 的家庭成员信息", currentUser.getPhone());

        List<FamilyMemberDTO> familyMembers = new ArrayList<>();

        // 根据用户角色获取相应的家庭成员
        if (currentUser.getRole() == UserRole.ELDER) {
            // 老人用户：获取所有子女
            List<FamilyLink> childrenLinks = getChildrenLinks(currentUser.getId());

            for (FamilyLink link : childrenLinks) {
                User child = userService.findById(link.getChildId())
                        .orElse(null);

                if (child != null) {
                    FamilyMemberDTO member = buildFamilyMemberDTO(child, "child");
                    if (member != null) {
                        familyMembers.add(member);
                    }
                }
            }

            // 新增：通过子女获取所有关联的其他老人
            // 收集所有子女ID
            List<String> childIds = childrenLinks.stream()
                    .map(FamilyLink::getChildId)
                    .collect(Collectors.toList());

            // 获取所有子女关联的老人
            Set<String> relatedElderIds = new HashSet<>();
            for (String childId : childIds) {
                List<FamilyLink> parentLinks = getParentsLinks(childId);
                // 只添加不是当前用户的老人
                parentLinks.stream()
                        .map(FamilyLink::getParentId)
                        .filter(id -> !id.equals(currentUser.getId())) // 排除自己
                        .forEach(relatedElderIds::add); // 使用Set自动去重
            }

            log.info("老人用户 {} 通过子女关联找到 {} 个其他老人", currentUser.getPhone(), relatedElderIds.size());

            // 添加关联老人到家庭成员列表
            for (String elderId : relatedElderIds) {
                User elder = userService.findById(elderId).orElse(null);
                if (elder != null) {
                    FamilyMemberDTO member = buildFamilyMemberDTO(elder, "related_elder");
                    if (member != null) {
                        familyMembers.add(member);
                    }
                }
            }
        } else if (currentUser.getRole() == UserRole.CHILD) {
            // 子女用户：获取所有老人（父母）
            List<FamilyLink> parentsLinks = getParentsLinks(currentUser.getId());

            for (FamilyLink link : parentsLinks) {
                User parent = userService.findById(link.getParentId())
                        .orElse(null);

                if (parent != null) {
                    FamilyMemberDTO member = buildFamilyMemberDTO(parent, "parent");
                    if (member != null) {
                        familyMembers.add(member);
                    }
                }
            }
        }

        log.info("为用户 {} 获取到 {} 个家庭成员", currentUser.getPhone(), familyMembers.size());
        return familyMembers;
    }

    /**
     * 构建家庭成员DTO
     */
    private FamilyMemberDTO buildFamilyMemberDTO(User user, String relationshipType) {
        try {
            // 获取用户的档案信息（绕过权限检查）
            ProfileDTO profile = profileService.getProfileByUserIdInternal(user.getId());

            return FamilyMemberDTO.builder()
                    .userId(user.getId())
                    .phone(user.getPhone())
                    .role(user.getRole().name())
                    .relationshipType(relationshipType)
                    .name(profile != null ? profile.getName() : "")
                    .age(profile != null ? profile.getAge() : null)
                    .gender(profile != null ? profile.getGender() : null)
                    .region(profile != null ? profile.getRegion() : null)
                    .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                    .createdAt(user.getCreatedAt())
                    .build();
        } catch (Exception e) {
            log.warn("构建家庭成员DTO失败，用户: {}, 错误: {}", user.getPhone(), e.getMessage());
            return null;
        }
    }
}