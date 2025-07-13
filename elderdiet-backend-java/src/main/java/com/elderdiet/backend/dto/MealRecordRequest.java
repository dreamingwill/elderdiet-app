package com.elderdiet.backend.dto;

import com.elderdiet.backend.entity.RecordVisibility;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotNull;

/**
 * 膳食记录请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MealRecordRequest {

    private String caption; // 文字描述，可为空

    @NotNull(message = "可见性不能为空")
    private RecordVisibility visibility; // 可见性
}