package com.elderdiet.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * ElderDiet后端应用主类
 * 
 * @author ElderDiet Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableMongoAuditing
@EnableScheduling
public class ElderDietBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ElderDietBackendApplication.class, args);
        System.out.println("🚀 ElderDiet Backend Java 启动成功!");
        System.out.println("📍 健康检查: http://localhost:3001/actuator/health");
        System.out.println("📊 应用信息: http://localhost:3001/actuator/info");
        System.out.println("🌍 环境: " + System.getProperty("spring.profiles.active", "dev"));
    }
}