package com.elderdiet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * 验证关联关系请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyRelationshipRequest {

    @NotBlank(message = "用户手机号不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "请输入正确的手机号格式")
    private String userPhone;

    @NotBlank(message = "关联手机号不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$|^18100010001$", message = "请输入正确的手机号格式或特殊号码")
    private String relatedPhone;
}
