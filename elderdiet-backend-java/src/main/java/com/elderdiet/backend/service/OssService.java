package com.elderdiet.backend.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.PutObjectRequest;
import com.aliyun.oss.model.PutObjectResult;
import com.elderdiet.backend.config.OssConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
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

    // 图片压缩质量 (0.0-1.0)
    private static final float IMAGE_QUALITY = 0.7f;

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

            // 压缩图片
            InputStream compressedImageStream = compressImage(file);

            // 上传压缩后的文件
            PutObjectRequest putObjectRequest = new PutObjectRequest(
                    ossProperties.getBucketName(),
                    objectKey,
                    compressedImageStream);

            PutObjectResult result = ossClient.putObject(putObjectRequest);

            // 构建文件访问URL
            String fileUrl = ossProperties.getBaseUrl() + "/" + objectKey;

            log.info("压缩图片上传成功: {}", fileUrl);
            return fileUrl;

        } catch (IOException e) {
            log.error("文件上传失败: {}", e.getMessage());
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 压缩图片
     * 
     * @param file 原图片
     * @return 压缩后的图片输入流
     * @throws IOException IO异常
     */
    private InputStream compressImage(MultipartFile file) throws IOException {
        // 读取原图片
        BufferedImage originalImage = ImageIO.read(file.getInputStream());

        // 如果文件不是图片格式，直接返回原文件流
        if (originalImage == null) {
            return file.getInputStream();
        }

        // 获取图片格式
        String formatName = getImageFormatName(file.getContentType());

        // 输出流
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        // 使用ImageWriter进行压缩
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName(formatName);
        if (!writers.hasNext()) {
            // 如果没有合适的writer，返回原文件流
            return file.getInputStream();
        }

        ImageWriter writer = writers.next();
        ImageOutputStream imageOutputStream = ImageIO.createImageOutputStream(outputStream);
        writer.setOutput(imageOutputStream);

        ImageWriteParam param = writer.getDefaultWriteParam();

        // 对JPEG格式的图片进行压缩
        if (param.canWriteCompressed() && "jpg".equals(formatName)) {
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(IMAGE_QUALITY);
        }

        writer.write(null, new IIOImage(originalImage, null, null), param);

        // 关闭资源
        writer.dispose();
        imageOutputStream.close();

        // 返回压缩后的输入流
        return new ByteArrayInputStream(outputStream.toByteArray());
    }

    /**
     * 获取图片格式名称
     */
    private String getImageFormatName(String contentType) {
        if (contentType == null) {
            return "jpg";
        }

        switch (contentType) {
            case "image/jpeg":
            case "image/jpg":
                return "jpg";
            case "image/png":
                return "png";
            case "image/gif":
                return "gif";
            case "image/webp":
                return "webp";
            default:
                return "jpg";
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