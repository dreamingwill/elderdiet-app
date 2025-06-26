package com.elderdiet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * 慢性疾病选项DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChronicConditionOptionDTO {
    
    private String value;
    private String label;
} 