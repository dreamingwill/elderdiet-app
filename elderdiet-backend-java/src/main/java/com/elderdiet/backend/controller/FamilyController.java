package com.elderdiet.backend.controller;

import com.elderdiet.backend.dto.ApiResponse;
import com.elderdiet.backend.dto.FamilyLinkRequest;
import com.elderdiet.backend.dto.FamilyLinkElderRequest;
import com.elderdiet.backend.dto.AddFamilyMemberRequest;
import com.elderdiet.backend.dto.FamilyMemberDTO;
import com.elderdiet.backend.entity.FamilyLink;
import com.elderdiet.backend.entity.User;
import com.elderdiet.backend.security.JwtAuthenticationToken;
import com.elderdiet.backend.service.FamilyService;
import com.elderdiet.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

/**
 * 家庭控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/family")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;
    private final UserService userService;

    private User getCurrentUser(Authentication authentication) {
        JwtAuthenticationToken jwtAuth = (JwtAuthenticationToken) authentication;
        String userId = jwtAuth.getUserId();
        return userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }

    /**
     * 通用添加家庭成员（支持双角色系统）
     */
    @PostMapping("/add-member")
    public ResponseEntity<ApiResponse<FamilyLink>> addFamilyMember(
            @Valid @RequestBody AddFamilyMemberRequest request,
            Authentication authentication) {

        try {
            // 从认证信息中获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 使用智能链接方法
            FamilyLink familyLink = familyService.linkFamilyMember(currentUser, request.getPhone());

            String message = String.format("成功添加家庭成员，当前以%s角色查看关系",
                    currentUser.getRole() == com.elderdiet.backend.entity.UserRole.ELDER ? "老人" : "子女");

            return ResponseEntity.ok(ApiResponse.success(message, familyLink));
        } catch (Exception e) {
            log.error("添加家庭成员失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 链接子女用户（只有当前角色为老人可以调用，保持向后兼容）
     */
    @PostMapping("/link")
    @PreAuthorize("hasAuthority('ROLE_ELDER')")
    public ResponseEntity<ApiResponse<FamilyLink>> linkChild(
            @Valid @RequestBody FamilyLinkRequest request,
            Authentication authentication) {

        try {
            // 从认证信息中获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 创建家庭链接
            FamilyLink familyLink = familyService.linkChild(currentUser, request.getChildPhone());

            return ResponseEntity.ok(ApiResponse.success("家庭链接创建成功", familyLink));
        } catch (Exception e) {
            log.error("链接子女用户失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 链接老人用户（只有当前角色为子女可以调用，保持向后兼容）
     */
    @PostMapping("/link2elder")
    @PreAuthorize("hasAuthority('ROLE_CHILD')")
    public ResponseEntity<ApiResponse<FamilyLink>> linkElder(
            @Valid @RequestBody FamilyLinkElderRequest request,
            Authentication authentication) {

        try {
            // 从认证信息中获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 创建家庭链接
            FamilyLink familyLink = familyService.linkElder(currentUser, request.getElderPhone());

            return ResponseEntity.ok(ApiResponse.success("家庭链接创建成功", familyLink));
        } catch (Exception e) {
            log.error("链接老人用户失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 获取当前用户的家庭链接
     */
    @GetMapping("/links")
    public ResponseEntity<ApiResponse<List<FamilyLink>>> getLinks(Authentication authentication) {
        try {
            // 从认证信息中获取当前用户
            User currentUser = getCurrentUser(authentication);

            List<FamilyLink> links;
            // 根据用户角色获取相应的链接
            switch (currentUser.getRole()) {
                case ELDER:
                    links = familyService.getChildrenLinks(currentUser.getId());
                    break;
                case CHILD:
                    links = familyService.getParentsLinks(currentUser.getId());
                    break;
                default:
                    throw new RuntimeException("未知的用户角色");
            }

            return ResponseEntity.ok(ApiResponse.success("获取家庭链接成功", links));
        } catch (Exception e) {
            log.error("获取家庭链接失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 删除家庭链接（只有老人可以调用）
     */
    @DeleteMapping("/link/{childId}")
    @PreAuthorize("hasAuthority('ROLE_ELDER')")
    public ResponseEntity<ApiResponse<Void>> unlinkChild(
            @PathVariable String childId,
            Authentication authentication) {

        try {
            // 从认证信息中获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 删除家庭链接
            familyService.unlinkChild(currentUser.getId(), childId);

            return ResponseEntity.ok(ApiResponse.success("家庭链接删除成功"));
        } catch (Exception e) {
            log.error("删除家庭链接失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 通用删除家庭链接（老人和子女都可以调用）
     */
    @DeleteMapping("/remove-member/{targetUserId}")
    public ResponseEntity<ApiResponse<Void>> removeFamilyMember(
            @PathVariable String targetUserId,
            Authentication authentication) {

        try {
            // 从认证信息中获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 删除家庭链接
            familyService.unlinkFamilyMember(currentUser.getId(), targetUserId);

            return ResponseEntity.ok(ApiResponse.success("家庭成员删除成功"));
        } catch (Exception e) {
            log.error("删除家庭成员失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 获取家庭成员列表
     */
    @GetMapping("/members")
    public ResponseEntity<ApiResponse<List<FamilyMemberDTO>>> getFamilyMembers(
            Authentication authentication) {
        try {
            // 从认证信息中获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 获取家庭成员信息
            List<FamilyMemberDTO> familyMembers = familyService.getFamilyMembers(currentUser);

            return ResponseEntity.ok(ApiResponse.success("获取家庭成员成功", familyMembers));
        } catch (Exception e) {
            log.error("获取家庭成员失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}