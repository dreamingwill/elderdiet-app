package com.elderdiet.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

/**
 * AI API配置类
 * 支持多个AI提供商的配置和切换
 */
@Configuration
public class AiConfig {

    /**
     * AI配置属性
     */
    @Data
    @Component
    @ConfigurationProperties(prefix = "ai.api")
    public static class AiProperties {
        
        /**
         * 当前使用的AI提供商
         */
        private String provider = "qianduoduo";
        
        /**
         * 钱多多API配置
         */
        private ProviderConfig qianduoduo = new ProviderConfig();
        
        /**
         * 智谱AI配置
         */
        private ProviderConfig zhipu = new ProviderConfig();
        
        /**
         * 获取当前提供商的配置
         */
        public ProviderConfig getCurrentProviderConfig() {
            switch (provider.toLowerCase()) {
                case "zhipu":
                    return zhipu;
                case "qianduoduo":
                default:
                    return qianduoduo;
            }
        }
        
        /**
         * 获取当前API URL
         */
        public String getUrl() {
            return getCurrentProviderConfig().getUrl();
        }
        
        /**
         * 获取当前API Key
         */
        public String getKey() {
            return getCurrentProviderConfig().getKey();
        }
        
        /**
         * 获取当前模型
         */
        public String getModel() {
            return getCurrentProviderConfig().getModel();
        }
        
        /**
         * 获取当前温度参数
         */
        public Double getTemperature() {
            return getCurrentProviderConfig().getTemperature();
        }
    }
    
    /**
     * 单个提供商的配置
     */
    @Data
    public static class ProviderConfig {
        private String url;
        private String key;
        private String model;
        private Double temperature = 0.7;
    }
}
