package com.elderdiet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * 家庭成员DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FamilyMemberDTO {

    private String userId;
    private String phone;
    private String role; // "ELDER" or "CHILD"
    private String name;
    private Integer age;
    private String gender;
    private String region;
    private String avatarUrl;
    private String relationshipType; // "parent" or "child"

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime createdAt;
}