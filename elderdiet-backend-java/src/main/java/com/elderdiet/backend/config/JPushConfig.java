package com.elderdiet.backend.config;

import cn.jpush.api.JPushClient;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * JPush配置类
 */
@Slf4j
@Data
@Configuration
@EnableScheduling
@ConfigurationProperties(prefix = "jpush")
public class JPushConfig {

    /**
     * JPush应用Key
     */
    private String appKey;

    /**
     * JPush主密钥
     */
    private String masterSecret;

    /**
     * 环境配置：dev 或 production
     */
    private String environment = "dev";

    /**
     * 推送消息存活时间（秒）
     */
    private Long timeToLive = 86400L;

    /**
     * 创建JPushClient Bean
     */
    @Bean
    public JPushClient jPushClient() {
        log.info("初始化JPush客户端，环境: {}", environment);
        
        if (appKey == null || masterSecret == null) {
            log.warn("JPush配置不完整，appKey或masterSecret为空");
            return null;
        }
        
        try {
            JPushClient client = new JPushClient(masterSecret, appKey);
            log.info("JPush客户端初始化成功");
            return client;
        } catch (Exception e) {
            log.error("JPush客户端初始化失败: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * 是否为生产环境
     */
    public boolean isProduction() {
        return "production".equalsIgnoreCase(environment);
    }
}
