package com.elderdiet.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 角色切换请求DTO
 */
@Data
public class ChangeRoleRequest {

    @NotBlank(message = "确认字符串不能为空")
    private String confirmationText;
}