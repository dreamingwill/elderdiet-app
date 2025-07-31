package com.elderdiet.backend.service;

import com.elderdiet.backend.config.AiConfig;
import com.elderdiet.backend.dto.AiApiRequest;
import com.elderdiet.backend.dto.AiApiResponse;
import com.elderdiet.backend.entity.MealRecord;
import com.elderdiet.backend.dto.ProfileDTO;
import com.elderdiet.backend.repository.MealRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final AiConfig.AiProperties aiProperties;

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
        prompt.append("你是一位经验丰富、非常专业的营养师，你的任务是为老年用户的膳食记录提供专业、温暖且充满鼓励的评价。\n\n");

        prompt.append("【核心要求】\n");
        prompt.append("1.  **分析图片**：你的首要任务是仔细分析用户上传的膳食图片。请尽力识别图中的每一种食物。\n");
        prompt.append("2.  **营养评估**：基于识别出的食物，详细分析这餐的营养成分（如优质蛋白、碳水化合物、膳食纤维、维生素等）和整体营养价值。\n");
        prompt.append("3.  **膳食搭配**：评价食物搭配是否均衡、多样化，是否符合健康饮食原则。\n");
        prompt.append("4.  **结合健康档案**：在评价时，请务必参考以下用户健康信息，给出个性化的建议。\n");

        if (userProfile != null) {
            prompt.append("\n【用户健康档案】\n");
            // if (userProfile.getAge() != null) {
            // prompt.append("- 年龄：").append(userProfile.getAge()).append("岁\n");
            // }
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

        prompt.append("\n【输出要求】\n");
        prompt.append("1.  **语气风格**：始终保持积极、温暖、鼓励的语气，像一位亲切的健康伙伴。\n");
        prompt.append("2.  **语言表达**：使用通俗易懂的语言，避免复杂的专业术语，确保老年用户能轻松理解。\n");
        prompt.append("3.  **字数限制**：总字数严格控制在 **120 字**左右，内容务必简洁精炼。\n");
        prompt.append("4.  **特殊情况**：如果图片无法识别或没有食物，请基于用户的文字描述进行评价。\n\n");
        prompt.append("请根据以上所有信息，生成你的专业营养评价。");
        return prompt.toString();
    }

    /**
     * 构建用户消息内容（支持多模态）
     */
    private Object buildUserMessageContent(MealRecord record) {
        List<AiApiRequest.ContentItem> contentItems = new ArrayList<>();

        // 简化用户输入，仅包含必要信息
        StringBuilder textPrompt = new StringBuilder();
        textPrompt.append("这是我的膳食记录，请您评价一下。\n");

        if (record.getCaption() != null && !record.getCaption().trim().isEmpty()) {
            textPrompt.append("我的分享文字内容：").append(record.getCaption());
        }

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
                    .model(aiProperties.getModel(AiConfig.TaskType.NUTRITION_COMMENT))
                    .messages(messages)
                    .temperature(aiProperties.getTemperature(AiConfig.TaskType.NUTRITION_COMMENT))
                    .build();

            // 设置请求头
            AiConfig.TaskType taskType = AiConfig.TaskType.NUTRITION_COMMENT;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(aiProperties.getKey(taskType));

            // 创建请求实体
            HttpEntity<AiApiRequest> requestEntity = new HttpEntity<>(request, headers);

            // 发送POST请求
            String apiUrl = aiProperties.getUrl(taskType);
            String model = aiProperties.getModel(taskType);
            log.info("发送POST请求到: {} (任务: {}, 模型: {})", apiUrl, taskType, model);
            ResponseEntity<AiApiResponse> responseEntity = restTemplate.postForEntity(
                    apiUrl,
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
            // log.info("评论超过80～120字，已截断");
            // }

            return aiResponse;

        } catch (Exception e) {
            log.error("调用AI API生成营养师评论时出错: {}", e.getMessage(), e);
            throw new RuntimeException("调用AI API失败: " + e.getMessage(), e);
        }
    }

}
