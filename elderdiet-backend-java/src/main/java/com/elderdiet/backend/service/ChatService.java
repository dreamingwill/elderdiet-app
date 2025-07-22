package com.elderdiet.backend.service;

import com.elderdiet.backend.config.AiConfig;
import com.elderdiet.backend.dto.*;
import com.elderdiet.backend.entity.ChatMessage;
import com.elderdiet.backend.entity.Profile;
import com.elderdiet.backend.repository.ChatMessageRepository;
import com.elderdiet.backend.repository.ProfileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 聊天服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ProfileRepository profileRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final AiConfig.AiProperties aiProperties;

    /**
     * 处理聊天消息
     */
    public ChatResponse handleChatMessage(ChatRequest request, String userId) {
        try {
            log.info("开始处理用户 {} 的聊天消息", userId);

            // 1. 保存用户消息
            ChatMessage userMessage = saveUserMessage(request, userId);
            log.info("用户消息已保存，ID: {}", userMessage.getId());

            // 2. 获取用户上下文
            Profile userProfile = getUserProfile(userId);
            List<ChatMessage> chatHistory = getChatHistory(userId);
            log.info("获取到用户档案: {}, 历史消息数: {}", userProfile != null ? "存在" : "不存在", chatHistory.size());

            // 3. 构建AI请求
            AiApiRequest aiRequest = buildAiRequest(request, userProfile, chatHistory);
            log.info("AI请求构建完成，消息数: {}", aiRequest.getMessages().size());

            // 4. 调用AI API
            String aiResponse = callAiApi(aiRequest);
            log.info("AI API调用成功，响应长度: {}", aiResponse.length());

            // 5. 保存AI回复
            ChatMessage assistantMessage = saveAssistantMessage(aiResponse, userId);
            log.info("AI回复已保存，ID: {}", assistantMessage.getId());

            // 6. 构建响应
            return ChatResponse.builder()
                    .response(aiResponse)
                    .messageId(assistantMessage.getId())
                    .timestamp(assistantMessage.getTimestamp().toEpochMilli())
                    .build();

        } catch (Exception e) {
            log.error("处理聊天消息时出错: {}", e.getMessage(), e);
            throw new IllegalArgumentException("处理聊天消息失败: " + e.getMessage(), e);
        }
    }

    /**
     * 保存用户消息
     */
    private ChatMessage saveUserMessage(ChatRequest request, String userId) {
        ChatMessage message = ChatMessage.builder()
                .userId(userId)
                .role("user")
                .type(request.getType())
                .content(request.getContent())
                .imageUrls(request.getImageUrls())
                .timestamp(Instant.now())
                .build();

        return chatMessageRepository.save(message);
    }

    /**
     * 保存AI助手消息
     */
    private ChatMessage saveAssistantMessage(String response, String userId) {
        ChatMessage message = ChatMessage.builder()
                .userId(userId)
                .role("assistant")
                .type("text")
                .content(response)
                .timestamp(Instant.now())
                .build();

        return chatMessageRepository.save(message);
    }

    /**
     * 获取用户健康档案
     */
    private Profile getUserProfile(String userId) {
        return profileRepository.findByUserId(userId).orElse(null);
    }

    /**
     * 获取聊天历史记录
     */
    private List<ChatMessage> getChatHistory(String userId) {
        // 调试模式：不返回历史记录
        log.info("调试模式：跳过历史记录");
        return new ArrayList<>();

        // 正式模式：返回历史记录
        // List<ChatMessage> messages =
        // chatMessageRepository.findTop10ByUserIdOrderByTimestampDesc(userId);
        // // 反转列表，使其按时间正序排列
        // Collections.reverse(messages);
        // return messages;
    }

    /**
     * 获取聊天历史记录（带时间戳过滤）
     */
    private List<ChatMessage> getChatHistory(String userId, Instant sinceTimestamp) {
        if (sinceTimestamp == null) {
            return getChatHistory(userId);
        }

        // 获取指定时间之后的消息
        return chatMessageRepository.findByUserIdAndTimestampAfterOrderByTimestampAsc(userId, sinceTimestamp);
    }

    /**
     * 构建AI API请求
     */
    private AiApiRequest buildAiRequest(ChatRequest request, Profile userProfile, List<ChatMessage> chatHistory) {
        List<AiApiRequest.AiMessage> messages = new ArrayList<>();

        // 1. 添加系统提示
        String systemPrompt = buildSystemPrompt(userProfile);
        messages.add(AiApiRequest.AiMessage.builder()
                .role("system")
                .content(systemPrompt)
                .build());

        // 2. 添加聊天历史
        for (ChatMessage historyMessage : chatHistory) {
            if (historyMessage.isTextMessage()) {
                messages.add(AiApiRequest.AiMessage.builder()
                        .role(historyMessage.getRole())
                        .content(historyMessage.getContent())
                        .build());
            } else if (historyMessage.isImageMessage()) {
                // 处理图片消息
                List<AiApiRequest.ContentItem> contentItems = new ArrayList<>();

                // 添加图片描述文本
                if (historyMessage.getContent() != null && !historyMessage.getContent().isEmpty()) {
                    contentItems.add(AiApiRequest.ContentItem.builder()
                            .type("text")
                            .text(historyMessage.getContent())
                            .build());
                }

                // 添加图片URL
                if (historyMessage.getImageUrls() != null) {
                    for (String imageUrl : historyMessage.getImageUrls()) {
                        contentItems.add(AiApiRequest.ContentItem.builder()
                                .type("image_url")
                                .imageUrl(AiApiRequest.ImageUrl.builder()
                                        .url(imageUrl)
                                        .build())
                                .build());
                    }
                }

                messages.add(AiApiRequest.AiMessage.builder()
                        .role(historyMessage.getRole())
                        .content(contentItems)
                        .build());
            }
        }

        // 3. 添加当前用户消息
        if (request.isTextMessage()) {
            messages.add(AiApiRequest.AiMessage.builder()
                    .role("user")
                    .content(request.getContent())
                    .build());
        } else if (request.isImageMessage()) {
            List<AiApiRequest.ContentItem> contentItems = new ArrayList<>();

            // 添加文本描述（如果有）
            if (request.getContent() != null && !request.getContent().isEmpty()) {
                contentItems.add(AiApiRequest.ContentItem.builder()
                        .type("text")
                        .text(request.getContent())
                        .build());
            }

            // 添加图片URL
            if (request.getImageUrls() != null) {
                for (String imageUrl : request.getImageUrls()) {
                    contentItems.add(AiApiRequest.ContentItem.builder()
                            .type("image_url")
                            .imageUrl(AiApiRequest.ImageUrl.builder()
                                    .url(imageUrl)
                                    .build())
                            .build());
                }
            }

            messages.add(AiApiRequest.AiMessage.builder()
                    .role("user")
                    .content(contentItems)
                    .build());
        }

        return AiApiRequest.builder()
                .model(aiProperties.getModel(AiConfig.TaskType.CHAT))
                .messages(messages)
                .temperature(aiProperties.getTemperature(AiConfig.TaskType.CHAT))
                .build();
    }

    /**
     * 构建系统提示词
     */
    private String buildSystemPrompt(Profile userProfile) {
        StringBuilder prompt = new StringBuilder();

        // 基础角色定义
        prompt.append("你是一位专业的、有同理心的老年人营养师。你的回答必须简洁、安全、易于理解。");

        // 添加个性化信息
        if (userProfile != null) {
            prompt.append("请特别注意：");

            // 添加用户基本信息
            if (userProfile.getName() != null) {
                prompt.append("该用户姓名是").append(userProfile.getName()).append("，");
            }
            if (userProfile.getAge() != null) {
                prompt.append("年龄").append(userProfile.getAge()).append("岁，");
            }
            if (userProfile.getGender() != null) {
                String genderLabel = "male".equals(userProfile.getGender()) ? "男性"
                        : "female".equals(userProfile.getGender()) ? "女性" : "其他";
                prompt.append("性别").append(genderLabel).append("，");
            }

            // 添加健康状况
            if (userProfile.getChronicConditions() != null && !userProfile.getChronicConditions().isEmpty()) {
                prompt.append("该用户的健康状况如下：")
                        .append(String.join("、", userProfile.getChronicConditions()))
                        .append("。在你的建议中，请务必遵循相应的饮食禁忌。");

                // 针对特定疾病的提醒
                if (userProfile.getChronicConditions().contains("糖尿病")) {
                    prompt.append("特别要避免推荐高糖分的食物。");
                }
                if (userProfile.getChronicConditions().contains("高血压")) {
                    prompt.append("特别要避免推荐高盐分的食物。");
                }
                if (userProfile.getChronicConditions().contains("高血脂")) {
                    prompt.append("特别要避免推荐高脂肪的食物。");
                }
            }

            // 添加饮食偏好
            if (userProfile.getDietaryPreferences() != null && !userProfile.getDietaryPreferences().isEmpty()) {
                prompt.append("用户的饮食偏好：")
                        .append(String.join("、", userProfile.getDietaryPreferences()))
                        .append("。");
            }

            // 添加BMI相关建议
            if (userProfile.getBmi() != null) {
                String bmiStatus = userProfile.getBmiStatus();
                if ("overweight".equals(bmiStatus) || "obese".equals(bmiStatus)) {
                    prompt.append("该用户BMI为").append(userProfile.getBmi())
                            .append("，属于").append(userProfile.getBmiStatusLabel())
                            .append("，请在饮食建议中考虑控制热量摄入。");
                } else if ("underweight".equals(bmiStatus)) {
                    prompt.append("该用户BMI为").append(userProfile.getBmi())
                            .append("，属于").append(userProfile.getBmiStatusLabel())
                            .append("，请在饮食建议中考虑增加营养摄入。");
                }
            }
        }

        // 添加回复风格要求
        prompt.append("请用温和、关怀的语气回复，避免使用过于专业的医学术语。");

        return prompt.toString();
    }

    /**
     * 调用AI API
     */
    private String callAiApi(AiApiRequest request) {
        try {
            AiConfig.TaskType taskType = AiConfig.TaskType.CHAT;
            String apiUrl = aiProperties.getUrl(taskType);
            String apiKey = aiProperties.getKey(taskType);
            String model = aiProperties.getModel(taskType);

            log.info("开始调用AI API: {} (任务: {}, 模型: {})", apiUrl, taskType, model);

            // 验证API配置
            if (apiKey == null || apiKey.equals("your-api-key-here") || apiKey.equals("your-zhipu-api-key-here")) {
                log.error("AI API Key未配置或使用默认值");
                throw new IllegalArgumentException("AI API Key未正确配置");
            }

            // 调试：打印实际发送的JSON请求
            try {
                String jsonRequest = objectMapper.writeValueAsString(request);
                log.info("发送给AI的完整JSON请求: {}", jsonRequest);
            } catch (Exception e) {
                log.warn("无法序列化请求对象进行调试: {}", e.getMessage());
            }

            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            // 创建请求实体
            HttpEntity<AiApiRequest> requestEntity = new HttpEntity<>(request, headers);

            // 发送POST请求
            log.info("发送POST请求到: {}", apiUrl);
            ResponseEntity<AiApiResponse> responseEntity = restTemplate.postForEntity(
                    apiUrl,
                    requestEntity,
                    AiApiResponse.class);

            log.info("AI API响应状态: {}", responseEntity.getStatusCode());
            AiApiResponse response = responseEntity.getBody();

            if (response == null) {
                log.error("AI API 返回空响应");
                throw new IllegalArgumentException("AI API 返回空响应");
            }

            if (response.getChoices() == null || response.getChoices().isEmpty()) {
                log.error("AI API 返回的选择列表为空");
                throw new IllegalArgumentException("AI API 返回的选择列表为空");
            }

            String aiResponse = response.getChoices().get(0).getMessage().getContent();
            log.info("AI API调用成功，响应内容长度: {}", aiResponse != null ? aiResponse.length() : 0);

            return aiResponse;

        } catch (Exception e) {
            log.error("调用AI API时出错: {}", e.getMessage(), e);
            throw new IllegalArgumentException("调用AI API失败: " + e.getMessage(), e);
        }
    }

    /**
     * 清空用户聊天记录（不删除数据，只更新清空时间戳）
     */
    public void clearChatHistory(String userId) {
        // 更新用户的聊天清空时间戳
        Profile profile = profileRepository.findByUserId(userId).orElse(null);
        if (profile != null) {
            profile.setChatClearedAt(Instant.now());
            profileRepository.save(profile);
            log.info("用户 {} 的聊天记录清空时间戳已更新", userId);
        } else {
            log.warn("用户 {} 的健康档案不存在，无法更新聊天清空时间戳", userId);
        }
    }

    /**
     * 获取用户聊天记录
     */
    public List<ChatMessage> getChatMessages(String userId) {
        return getChatMessages(userId, null);
    }

    /**
     * 获取用户聊天记录（带时间戳过滤）
     */
    public List<ChatMessage> getChatMessages(String userId, Instant sinceTimestamp) {
        if (sinceTimestamp == null) {
            // 检查用户是否设置了聊天清空时间戳
            Profile profile = profileRepository.findByUserId(userId).orElse(null);
            if (profile != null && profile.getChatClearedAt() != null) {
                sinceTimestamp = profile.getChatClearedAt();
            }
        }

        if (sinceTimestamp == null) {
            return chatMessageRepository.findByUserIdOrderByTimestampAsc(userId);
        } else {
            return chatMessageRepository.findByUserIdAndTimestampAfterOrderByTimestampAsc(userId, sinceTimestamp);
        }
    }
}