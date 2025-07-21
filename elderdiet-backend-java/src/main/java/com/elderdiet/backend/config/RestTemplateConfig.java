package com.elderdiet.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate配置类
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();

        // 设置连接超时时间 (10秒)
        factory.setConnectTimeout(10000);

        // 设置读取超时时间 (60秒) - 适应AI API的响应时间
        factory.setReadTimeout(60000);

        return new RestTemplate(factory);
    }
}