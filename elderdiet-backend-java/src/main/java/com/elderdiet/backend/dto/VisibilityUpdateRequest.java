package com.elderdiet.backend.dto;

import com.elderdiet.backend.entity.RecordVisibility;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotNull;

/**
 * 可见性更新请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisibilityUpdateRequest {

    @NotNull(message = "可见性不能为空")
    private RecordVisibility visibility; // 新的可见性设置
}
