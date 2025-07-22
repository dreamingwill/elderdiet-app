package com.elderdiet.backend.controller;

import com.elderdiet.backend.config.AiConfig;
import com.elderdiet.backend.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * AI配置管理控制器
 * 用于查看和切换AI提供商配置
 */
@RestController
@RequestMapping("/api/v1/ai-config")
@RequiredArgsConstructor
@Slf4j
public class AiConfigController {

        private final AiConfig.AiProperties aiProperties;

        /**
         * 获取当前AI配置信息
         */
        @GetMapping("/current")
        public ApiResponse<Map<String, Object>> getCurrentConfig() {
                log.info("获取当前AI配置信息");

                Map<String, Object> configInfo = new HashMap<>();
                configInfo.put("provider", aiProperties.getProvider());

                // 按任务类型显示配置
                Map<String, Object> taskConfigs = new HashMap<>();
                for (AiConfig.TaskType taskType : AiConfig.TaskType.values()) {
                        Map<String, Object> taskConfig = new HashMap<>();
                        taskConfig.put("provider", aiProperties.getTaskConfig(taskType).getProvider());
                        taskConfig.put("model", aiProperties.getModel(taskType));
                        taskConfig.put("temperature", aiProperties.getTemperature(taskType));
                        taskConfig.put("url", aiProperties.getUrl(taskType));
                        taskConfig.put("keyConfigured", isKeyConfigured(aiProperties.getKey(taskType)));
                        taskConfigs.put(taskType.getConfigKey(), taskConfig);
                }
                configInfo.put("tasks", taskConfigs);

                return ApiResponse.<Map<String, Object>>builder()
                                .success(true)
                                .message("获取AI配置成功")
                                .data(configInfo)
                                .timestamp(LocalDateTime.now())
                                .build();
        }

        /**
         * 检查API Key是否已配置
         */
        private boolean isKeyConfigured(String apiKey) {
                return apiKey != null &&
                                !apiKey.equals("your-api-key-here") &&
                                !apiKey.equals("your-zhipu-api-key-here");
        }

        /**
         * 获取所有可用的AI提供商配置
         */
        @GetMapping("/providers")
        public ApiResponse<Map<String, Object>> getAllProviders() {
                log.info("获取所有AI提供商配置");

                Map<String, Object> providers = new HashMap<>();

                // 钱多多配置
                Map<String, Object> qianduoduoConfig = new HashMap<>();
                qianduoduoConfig.put("model", aiProperties.getQianduoduo().getModel());
                qianduoduoConfig.put("temperature", aiProperties.getQianduoduo().getTemperature());
                qianduoduoConfig.put("url", aiProperties.getQianduoduo().getUrl());
                qianduoduoConfig.put("keyConfigured", aiProperties.getQianduoduo().getKey() != null &&
                                !aiProperties.getQianduoduo().getKey().equals("your-api-key-here"));
                providers.put("qianduoduo", qianduoduoConfig);

                // 智谱AI配置
                Map<String, Object> zhipuConfig = new HashMap<>();
                zhipuConfig.put("model", aiProperties.getZhipu().getModel());
                zhipuConfig.put("temperature", aiProperties.getZhipu().getTemperature());
                zhipuConfig.put("url", aiProperties.getZhipu().getUrl());
                zhipuConfig.put("keyConfigured", aiProperties.getZhipu().getKey() != null &&
                                !aiProperties.getZhipu().getKey().equals("your-zhipu-api-key-here"));
                providers.put("zhipu", zhipuConfig);

                Map<String, Object> result = new HashMap<>();
                result.put("currentProvider", aiProperties.getProvider());
                result.put("providers", providers);

                return ApiResponse.<Map<String, Object>>builder()
                                .success(true)
                                .message("获取AI提供商配置成功")
                                .data(result)
                                .timestamp(LocalDateTime.now())
                                .build();
        }

        /**
         * 测试当前AI配置连接
         */
        @PostMapping("/test")
        public ApiResponse<Map<String, Object>> testConnection() {
                log.info("测试当前AI配置连接");

                Map<String, Object> testResult = new HashMap<>();
                Map<String, Object> taskTests = new HashMap<>();

                boolean allValid = true;

                // 测试每个任务类型的配置
                for (AiConfig.TaskType taskType : AiConfig.TaskType.values()) {
                        Map<String, Object> taskTest = new HashMap<>();
                        taskTest.put("provider", aiProperties.getTaskConfig(taskType).getProvider());
                        taskTest.put("model", aiProperties.getModel(taskType));
                        taskTest.put("url", aiProperties.getUrl(taskType));

                        // 检查配置是否完整
                        String apiKey = aiProperties.getKey(taskType);
                        boolean configValid = isKeyConfigured(apiKey) &&
                                        aiProperties.getUrl(taskType) != null &&
                                        aiProperties.getModel(taskType) != null;

                        taskTest.put("configValid", configValid);
                        taskTest.put("message", configValid ? "配置验证通过" : "配置不完整，请检查API Key、URL和模型配置");

                        taskTests.put(taskType.getConfigKey(), taskTest);

                        if (!configValid) {
                                allValid = false;
                        }
                }

                testResult.put("tasks", taskTests);
                testResult.put("overallValid", allValid);
                testResult.put("message", allValid ? "所有任务的AI配置验证通过" : "部分任务的AI配置不完整");

                return ApiResponse.<Map<String, Object>>builder()
                                .success(allValid)
                                .message(allValid ? "AI配置测试成功" : "AI配置测试失败")
                                .data(testResult)
                                .timestamp(LocalDateTime.now())
                                .build();
        }
}
