package com.elderdiet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * 家庭链接请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FamilyLinkRequest {

    @NotBlank(message = "子女手机号不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "请输入正确的手机号格式")
    private String childPhone;
}