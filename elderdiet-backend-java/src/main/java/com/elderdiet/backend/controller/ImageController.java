package com.elderdiet.backend.controller;

import com.elderdiet.backend.dto.ApiResponse;
import com.elderdiet.backend.service.OssService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 图片上传控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/images")
@RequiredArgsConstructor
public class ImageController {

    private final OssService ossService;

    /**
     * 上传图片
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        try {
            log.info("开始上传图片: {}, 大小: {} bytes",
                    file.getOriginalFilename(), file.getSize());

            // 上传文件到OSS
            String imageUrl = ossService.uploadFile(file);

            log.info("图片上传成功: {}", imageUrl);

            return ResponseEntity.ok(ApiResponse.success("图片上传成功", imageUrl));

        } catch (Exception e) {
            log.error("图片上传失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 删除图片
     */
    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @RequestParam("imageUrl") String imageUrl,
            Authentication authentication) {

        try {
            log.info("开始删除图片: {}", imageUrl);

            // 删除文件
            ossService.deleteFile(imageUrl);

            log.info("图片删除成功: {}", imageUrl);

            return ResponseEntity.ok(ApiResponse.success("图片删除成功"));

        } catch (Exception e) {
            log.error("图片删除失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}