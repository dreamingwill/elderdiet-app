package com.elderdiet.backend.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.PutObjectRequest;
import com.aliyun.oss.model.PutObjectResult;
import com.elderdiet.backend.config.OssConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 阿里云OSS服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OssService {

    private final OSS ossClient;
    private final OssConfig.OssProperties ossProperties;

    /**
     * 上传文件到OSS
     */
    public String uploadFile(MultipartFile file) {
        try {
            // 验证文件
            if (file == null || file.isEmpty()) {
                throw new RuntimeException("文件不能为空");
            }

            // 验证文件类型
            String contentType = file.getContentType();
            if (!isValidImageType(contentType)) {
                throw new RuntimeException("只支持图片格式（JPG、PNG、GIF、WEBP）");
            }

            // 生成唯一文件名
            String fileName = generateFileName(file.getOriginalFilename());

            // 构建完整的对象键
            String objectKey = ossProperties.getUploadPath() + fileName;

            // 上传文件
            PutObjectRequest putObjectRequest = new PutObjectRequest(
                    ossProperties.getBucketName(),
                    objectKey,
                    file.getInputStream());

            PutObjectResult result = ossClient.putObject(putObjectRequest);

            // 构建文件访问URL
            String fileUrl = ossProperties.getBaseUrl() + "/" + objectKey;

            log.info("文件上传成功: {}", fileUrl);
            return fileUrl;

        } catch (IOException e) {
            log.error("文件上传失败: {}", e.getMessage());
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 验证是否为支持的图片格式
     */
    private boolean isValidImageType(String contentType) {
        if (contentType == null) {
            return false;
        }
        return contentType.equals("image/jpeg") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/png") ||
                contentType.equals("image/gif") ||
                contentType.equals("image/webp");
    }

    /**
     * 生成唯一文件名
     */
    private String generateFileName(String originalFilename) {
        // 获取文件扩展名
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // 生成时间戳
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        // 生成UUID
        String uuid = UUID.randomUUID().toString().replace("-", "");

        // 组合文件名：时间戳_UUID.扩展名
        return timestamp + "_" + uuid + extension;
    }

    /**
     * 删除文件
     */
    public void deleteFile(String fileUrl) {
        try {
            if (fileUrl == null || !fileUrl.startsWith(ossProperties.getBaseUrl())) {
                log.warn("无效的文件URL: {}", fileUrl);
                return;
            }

            // 从URL中提取对象键
            String objectKey = fileUrl.substring(ossProperties.getBaseUrl().length() + 1);

            // 删除文件
            ossClient.deleteObject(ossProperties.getBucketName(), objectKey);

            log.info("文件删除成功: {}", fileUrl);

        } catch (Exception e) {
            log.error("文件删除失败: {}", e.getMessage());
            throw new RuntimeException("文件删除失败: " + e.getMessage());
        }
    }
}