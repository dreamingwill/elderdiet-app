package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.AiApiRequest;
import com.elderdiet.backend.dto.AiApiResponse;
import com.elderdiet.backend.entity.MealRecord;
import com.elderdiet.backend.dto.ProfileDTO;
import com.elderdiet.backend.repository.MealRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 营养师评论服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NutritionistCommentService {

    private final MealRecordRepository mealRecordRepository;
    private final ProfileService profileService;
    private final RestTemplate restTemplate;

    @Value("${ai.api.url}")
    private String aiApiUrl;

    @Value("${ai.api.key}")
    private String aiApiKey;

    @Value("${ai.api.model}")
    private String aiModel;

    @Value("${ai.api.temperature:0.7}")
    private Double aiTemperature;

    /**
     * 为膳食记录生成营养师评论
     */
    public void generateNutritionistComment(String recordId, String userId) {
        try {
            log.info("开始为膳食记录 {} 生成营养师评论", recordId);

            // 获取膳食记录
            MealRecord record = mealRecordRepository.findById(recordId)
                    .orElseThrow(() -> new RuntimeException("膳食记录不存在"));

            // 检查是否已经有营养师评论
            if (record.getNutritionistComment() != null) {
                log.info("膳食记录 {} 已有营养师评论，跳过生成", recordId);
                return;
            }

            // 获取用户健康档案
            ProfileDTO userProfile = profileService.getProfileByUserId(userId);

            // 构建AI请求
            String systemPrompt = buildSystemPrompt(userProfile);
            Object userMessageContent = buildUserMessageContent(record);

            // 调用AI API生成评论
            String comment = callAiApiWithMultimodal(systemPrompt, userMessageContent);

            // 保存营养师评论
            record.setNutritionistComment(comment);
            record.setNutritionistCommentAt(LocalDateTime.now());
            mealRecordRepository.save(record);

            log.info("营养师评论生成成功，记录ID: {}", recordId);

        } catch (Exception e) {
            log.error("生成营养师评论失败，记录ID: {}, 错误: {}", recordId, e.getMessage(), e);
            // 不抛出异常，避免影响膳食记录的正常创建
        }
    }

    /**
     * 构建系统提示词
     */
    private String buildSystemPrompt(ProfileDTO userProfile) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一位专业的营养师，需要对老年人的膳食记录进行评价。\n\n");
        prompt.append("评价要求：\n");
        prompt.append("1. 重点关注饮食的图片信息，尽量理解图片中的食物类型，并给出营养价值和搭配的评价\n");
        prompt.append("2. 如果图片中没有食物的话，可以不提及图片内容\n");
        prompt.append("3. 语气正向积极，充满鼓励\n");
        prompt.append("4. 语言通俗易懂，适合老年人理解\n");
        prompt.append("5. 字数严格控制在50字以内，避免使用专业术语\n\n");

        if (userProfile != null) {
            prompt.append("用户健康信息：\n");
            if (userProfile.getAge() != null) {
                prompt.append("- 年龄：").append(userProfile.getAge()).append("岁\n");
            }
            if (userProfile.getGender() != null) {
                prompt.append("- 性别：").append(userProfile.getGender()).append("\n");
            }
            if (userProfile.getChronicConditions() != null && !userProfile.getChronicConditions().isEmpty()) {
                prompt.append("- 慢性疾病：").append(String.join("、", userProfile.getChronicConditions())).append("\n");
            }
            if (userProfile.getDietaryPreferences() != null && !userProfile.getDietaryPreferences().isEmpty()) {
                prompt.append("- 饮食偏好：").append(String.join("、", userProfile.getDietaryPreferences())).append("\n");
            }
        }

        prompt.append("\n请根据以上信息，对用户的膳食记录给出鼓励性的营养评价。");
        return prompt.toString();
    }

    /**
     * 构建用户消息内容（支持多模态）
     */
    private Object buildUserMessageContent(MealRecord record) {
        List<AiApiRequest.ContentItem> contentItems = new ArrayList<>();

        // 添加文字提示
        StringBuilder textPrompt = new StringBuilder();
        textPrompt.append("请分析这份膳食记录并给出50字以内的正向鼓励评价：\n\n");

        // 添加文字描述
        if (record.getCaption() != null && !record.getCaption().trim().isEmpty()) {
            textPrompt.append("用户描述：").append(record.getCaption()).append("\n\n");
        }

        textPrompt.append("请重点关注：\n");
        textPrompt.append("1. 尽量理解图片中的食物类型，图片中的食物的营养价值和搭配\n");
        textPrompt.append("2. 如果图片中没有食物的话，可以不提及图片内容\n");
        textPrompt.append("3. 给予正向鼓励\n");
        textPrompt.append("4. 语言要温暖、通俗易懂\n\n");
        textPrompt.append("评价要求：严格控制在50字以内，语气积极正面。");

        contentItems.add(AiApiRequest.ContentItem.builder()
                .type("text")
                .text(textPrompt.toString())
                .build());

        // 添加图片（如果有）
        if (record.getImageUrls() != null && !record.getImageUrls().isEmpty()) {
            for (String imageUrl : record.getImageUrls()) {
                contentItems.add(AiApiRequest.ContentItem.builder()
                        .type("image_url")
                        .imageUrl(AiApiRequest.ImageUrl.builder()
                                .url(imageUrl)
                                .build())
                        .build());
            }
        }

        // 如果只有文字，返回字符串；如果有图片，返回ContentItem列表
        if (record.getImageUrls() == null || record.getImageUrls().isEmpty()) {
            return textPrompt.toString();
        } else {
            return contentItems;
        }
    }

    /**
     * 调用AI API（支持多模态）
     */
    private String callAiApiWithMultimodal(String systemPrompt, Object userMessageContent) throws Exception {
        try {
            log.info("调用AI API生成营养师评论（多模态支持）");

            // 构建消息列表
            List<AiApiRequest.AiMessage> messages = Arrays.asList(
                    AiApiRequest.AiMessage.builder()
                            .role("system")
                            .content(systemPrompt)
                            .build(),
                    AiApiRequest.AiMessage.builder()
                            .role("user")
                            .content(userMessageContent)
                            .build());

            AiApiRequest request = AiApiRequest.builder()
                    .model(aiModel)
                    .messages(messages)
                    .temperature(aiTemperature)
                    .build();

            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(aiApiKey);

            // 创建请求实体
            HttpEntity<AiApiRequest> requestEntity = new HttpEntity<>(request, headers);

            // 发送POST请求
            log.info("发送POST请求到: {}", aiApiUrl);
            ResponseEntity<AiApiResponse> responseEntity = restTemplate.postForEntity(
                    aiApiUrl,
                    requestEntity,
                    AiApiResponse.class);

            log.info("AI API响应状态: {}", responseEntity.getStatusCode());
            AiApiResponse response = responseEntity.getBody();

            if (response == null) {
                log.error("AI API 返回空响应");
                throw new RuntimeException("AI API 返回空响应");
            }

            if (response.getChoices() == null || response.getChoices().isEmpty()) {
                log.error("AI API 返回的选择列表为空");
                throw new RuntimeException("AI API 返回的选择列表为空");
            }

            String aiResponse = response.getChoices().get(0).getMessage().getContent();
            log.info("AI API调用成功，营养师评论长度: {}", aiResponse != null ? aiResponse.length() : 0);

            // 确保评论不超过40字
            // if (aiResponse != null && aiResponse.length() > 40) {
            // aiResponse = aiResponse.substring(0, 40);
            // log.info("评论超过50字，已截断");
            // }

            return aiResponse;

        } catch (Exception e) {
            log.error("调用AI API生成营养师评论时出错: {}", e.getMessage(), e);
            throw new RuntimeException("调用AI API失败: " + e.getMessage(), e);
        }
    }

}
