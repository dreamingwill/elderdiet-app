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

    private Boolean shareWithNutritionist; // 是否分享给营养师，可为空，默认false
}