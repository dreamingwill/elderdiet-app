package com.elderdiet.backend.service;

import com.elderdiet.backend.entity.FamilyLink;
import com.elderdiet.backend.entity.User;
import com.elderdiet.backend.entity.UserRole;
import com.elderdiet.backend.repository.FamilyLinkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 家庭服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyLinkRepository familyLinkRepository;
    private final UserService userService;

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
}