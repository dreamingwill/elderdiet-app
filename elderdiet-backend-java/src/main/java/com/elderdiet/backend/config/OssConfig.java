package com.elderdiet.backend.config;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

/**
 * 阿里云OSS配置类
 */
@Configuration
public class OssConfig {

    @Bean
    public OSS ossClient(OssProperties ossProperties) {
        return new OSSClientBuilder().build(
                ossProperties.getEndpoint(),
                ossProperties.getAccessKeyId(),
                ossProperties.getAccessKeySecret());
    }

    /**
     * OSS配置属性
     */
    @Data
    @Component
    @ConfigurationProperties(prefix = "aliyun.oss")
    public static class OssProperties {
        private String endpoint;
        private String accessKeyId;
        private String accessKeySecret;
        private String bucketName;
        private String baseUrl;
        private String uploadPath;
    }
}