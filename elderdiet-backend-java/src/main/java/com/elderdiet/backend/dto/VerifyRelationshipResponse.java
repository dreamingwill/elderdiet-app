package com.elderdiet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * 验证关联关系响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyRelationshipResponse {

    private boolean verified;
    private String relationshipType; // "family" 或 "backdoor"
    private String userRole; // "ELDER" 或 "CHILD"
    private String userName; // 用户姓名（如果有档案的话）
}
