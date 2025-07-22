package com.elderdiet.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * AI API配置类
 * 支持多个AI提供商的配置和按任务类型切换
 */
@Configuration
public class AiConfig {

    /**
     * 任务类型枚举
     */
    public enum TaskType {
        CHAT("chat"),
        MEAL_RECOMMENDATION("meal-recommendation"),
        NUTRITION_COMMENT("nutrition-comment");

        private final String configKey;

        TaskType(String configKey) {
            this.configKey = configKey;
        }

        public String getConfigKey() {
            return configKey;
        }
    }

    /**
     * AI配置属性
     */
    @Data
    @Component
    @ConfigurationProperties(prefix = "ai.api")
    public static class AiProperties {

        /**
         * 当前使用的AI提供商（兼容旧配置）
         */
        private String provider = "qianduoduo";

        /**
         * 按任务类型配置
         */
        private Map<String, TaskConfig> tasks;

        /**
         * 钱多多API配置
         */
        private ProviderConfig qianduoduo = new ProviderConfig();

        /**
         * 智谱AI配置
         */
        private ProviderConfig zhipu = new ProviderConfig();

        /**
         * 根据任务类型获取配置
         */
        public TaskConfig getTaskConfig(TaskType taskType) {
            if (tasks != null && tasks.containsKey(taskType.getConfigKey())) {
                return tasks.get(taskType.getConfigKey());
            }
            // 如果没有任务特定配置，返回默认配置
            TaskConfig defaultConfig = new TaskConfig();
            defaultConfig.setProvider(provider);
            defaultConfig.setModel(getCurrentProviderConfig().getModel());
            defaultConfig.setTemperature(getCurrentProviderConfig().getTemperature());
            return defaultConfig;
        }

        /**
         * 根据任务类型获取提供商配置
         */
        public ProviderConfig getProviderConfigForTask(TaskType taskType) {
            TaskConfig taskConfig = getTaskConfig(taskType);
            return getProviderConfig(taskConfig.getProvider());
        }

        /**
         * 根据提供商名称获取配置
         */
        public ProviderConfig getProviderConfig(String providerName) {
            switch (providerName.toLowerCase()) {
                case "zhipu":
                    return zhipu;
                case "qianduoduo":
                default:
                    return qianduoduo;
            }
        }

        /**
         * 获取当前提供商的配置（兼容旧方法）
         */
        public ProviderConfig getCurrentProviderConfig() {
            return getProviderConfig(provider);
        }

        /**
         * 根据任务类型获取API URL
         */
        public String getUrl(TaskType taskType) {
            return getProviderConfigForTask(taskType).getUrl();
        }

        /**
         * 根据任务类型获取API Key
         */
        public String getKey(TaskType taskType) {
            return getProviderConfigForTask(taskType).getKey();
        }

        /**
         * 根据任务类型获取模型
         */
        public String getModel(TaskType taskType) {
            return getTaskConfig(taskType).getModel();
        }

        /**
         * 根据任务类型获取温度参数
         */
        public Double getTemperature(TaskType taskType) {
            return getTaskConfig(taskType).getTemperature();
        }

        // 兼容旧方法
        public String getUrl() {
            return getCurrentProviderConfig().getUrl();
        }

        public String getKey() {
            return getCurrentProviderConfig().getKey();
        }

        public String getModel() {
            return getCurrentProviderConfig().getModel();
        }

        public Double getTemperature() {
            return getCurrentProviderConfig().getTemperature();
        }
    }

    /**
     * 任务配置
     */
    @Data
    public static class TaskConfig {
        private String provider;
        private String model;
        private Double temperature = 0.7;
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
