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
     * 链接子女用户
     */
    public FamilyLink linkChild(User parent, String childPhone) {
        log.info("老人用户 {} 尝试链接子女用户: {}", parent.getPhone(), childPhone);

        // 验证发起者角色必须是老人
        if (parent.getRole() != UserRole.ELDER) {
            throw new RuntimeException("只有老人用户可以发起链接");
        }

        // 查找子女用户
        User child = userService.findByPhone(childPhone)
                .orElseThrow(() -> new RuntimeException("子女用户不存在"));

        // 验证被链接的用户必须是子女
        if (child.getRole() != UserRole.CHILD) {
            throw new RuntimeException("只能链接子女用户");
        }

        // 检查是否已经绑定
        if (familyLinkRepository.existsByParentIdAndChildId(parent.getId(), child.getId())) {
            throw new RuntimeException("该子女用户已经绑定");
        }

        // 创建家庭链接
        FamilyLink familyLink = FamilyLink.builder()
                .parentId(parent.getId())
                .childId(child.getId())
                .build();

        FamilyLink savedLink = familyLinkRepository.save(familyLink);
        log.info("成功创建家庭链接: 老人 {} -> 子女 {}", parent.getPhone(), childPhone);

        return savedLink;
    }

    /**
     * 链接老人用户
     */
    public FamilyLink linkElder(User child, String elderPhone) {
        log.info("子女用户 {} 尝试链接老人用户: {}", child.getPhone(), elderPhone);

        // 验证发起者角色必须是子女
        if (child.getRole() != UserRole.CHILD) {
            throw new RuntimeException("只有子女用户可以发起链接");
        }

        // 查找老人用户
        User elder = userService.findByPhone(elderPhone)
                .orElseThrow(() -> new RuntimeException("老人用户不存在"));

        // 验证被链接的用户必须是老人
        if (elder.getRole() != UserRole.ELDER) {
            throw new RuntimeException("只能链接老人用户");
        }

        // 检查是否已经绑定
        if (familyLinkRepository.existsByParentIdAndChildId(elder.getId(), child.getId())) {
            throw new RuntimeException("该老人用户已经绑定");
        }

        // 创建家庭链接
        FamilyLink familyLink = FamilyLink.builder()
                .parentId(elder.getId())
                .childId(child.getId())
                .build();

        FamilyLink savedLink = familyLinkRepository.save(familyLink);
        log.info("成功创建家庭链接: 老人 {} <- 子女 {}", elderPhone, child.getPhone());

        return savedLink;
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