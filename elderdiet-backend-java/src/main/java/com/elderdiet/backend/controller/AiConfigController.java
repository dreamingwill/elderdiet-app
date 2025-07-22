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
        configInfo.put("model", aiProperties.getModel());
        configInfo.put("temperature", aiProperties.getTemperature());
        configInfo.put("url", aiProperties.getUrl());
        // 不返回API Key，只返回是否已配置
        configInfo.put("keyConfigured", aiProperties.getKey() != null && 
                !aiProperties.getKey().equals("your-api-key-here") && 
                !aiProperties.getKey().equals("your-zhipu-api-key-here"));
        
        return ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("获取AI配置成功")
                .data(configInfo)
                .timestamp(LocalDateTime.now())
                .build();
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
        testResult.put("provider", aiProperties.getProvider());
        testResult.put("model", aiProperties.getModel());
        testResult.put("url", aiProperties.getUrl());
        
        // 检查配置是否完整
        String apiKey = aiProperties.getKey();
        boolean configValid = apiKey != null && 
                !apiKey.equals("your-api-key-here") && 
                !apiKey.equals("your-zhipu-api-key-here") &&
                aiProperties.getUrl() != null &&
                aiProperties.getModel() != null;
        
        testResult.put("configValid", configValid);
        
        if (!configValid) {
            testResult.put("message", "AI配置不完整，请检查API Key、URL和模型配置");
        } else {
            testResult.put("message", "AI配置验证通过，可以正常使用");
        }
        
        return ApiResponse.<Map<String, Object>>builder()
                .success(configValid)
                .message(configValid ? "AI配置测试成功" : "AI配置测试失败")
                .data(testResult)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
