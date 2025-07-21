package com.elderdiet.backend.service;

import com.elderdiet.backend.dto.AiApiRequest;
import com.elderdiet.backend.dto.DishReplaceRequest;
import com.elderdiet.backend.dto.MealPlanRequest;
import com.elderdiet.backend.entity.Dish;
import com.elderdiet.backend.entity.Meal;
import com.elderdiet.backend.entity.MealPlan;
import com.elderdiet.backend.entity.Profile;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 膳食推荐服务
 * 负责与LLM交互，生成个性化膳食计划
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MealRecommendationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.api.url}")
    private String aiApiUrl;

    @Value("${ai.api.key}")
    private String aiApiKey;

    @Value("${ai.api.model}")
    private String aiModel;

    @Value("${ai.api.temperature}")
    private Double aiTemperature;

    /**
     * 生成完整的膳食计划
     */
    public MealPlan generateCompleteMealPlan(Profile userProfile, LocalDate planDate, MealPlanRequest request) {
        log.info("开始生成完整膳食计划，用户: {}, 日期: {}", userProfile.getName(), planDate);

        try {
            // 1. 构建系统提示词
            String systemPrompt = buildMealPlanSystemPrompt(userProfile, planDate, request);

            // 2. 构建用户请求
            String userPrompt = buildMealPlanUserPrompt(userProfile, planDate, request);

            // 3. 调用AI API
            String aiResponse = callAiApi(systemPrompt, userPrompt);

            // 4. 解析AI响应
            MealPlan mealPlan = parseMealPlanResponse(aiResponse, planDate);

            log.info("膳食计划生成成功，包含 {} 道早餐，{} 道午餐，{} 道晚餐",
                    mealPlan.getBreakfast().getDishCount(),
                    mealPlan.getLunch().getDishCount(),
                    mealPlan.getDinner().getDishCount());

            return mealPlan;

        } catch (Exception e) {
            log.error("生成膳食计划时出错: {}", e.getMessage(), e);
            throw new IllegalArgumentException("生成膳食计划失败: " + e.getMessage(), e);
        }
    }

    /**
     * 生成替换菜品
     */
    public Dish generateReplacementDish(Profile userProfile, Meal targetMeal, Dish originalDish,
            DishReplaceRequest request) {
        log.info("开始生成替换菜品，原菜品: {}, 餐次: {}", originalDish.getName(), targetMeal.getMealType());

        try {
            // 1. 构建系统提示词
            String systemPrompt = buildDishReplaceSystemPrompt(userProfile, targetMeal, originalDish, request);

            // 2. 构建用户请求
            String userPrompt = buildDishReplaceUserPrompt(userProfile, targetMeal, originalDish, request);

            // 3. 调用AI API
            String aiResponse = callAiApi(systemPrompt, userPrompt);

            // 4. 解析AI响应
            Dish replacementDish = parseDishResponse(aiResponse, targetMeal.getMealType());

            log.info("替换菜品生成成功: {}", replacementDish.getName());

            return replacementDish;

        } catch (Exception e) {
            log.error("生成替换菜品时出错: {}", e.getMessage(), e);
            throw new IllegalArgumentException("生成替换菜品失败: " + e.getMessage(), e);
        }
    }

    /**
     * 构建膳食计划系统提示词
     */
    private String buildMealPlanSystemPrompt(Profile userProfile, LocalDate planDate, MealPlanRequest request) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("你是一位专业的中医营养师，专门为老年人设计个性化膳食计划。");
        prompt.append("请根据用户的健康档案和需求，生成一份科学、营养、美味的一日三餐计划。");
        prompt.append("\n\n");

        // 用户基本信息
        prompt.append("用户基本信息：\n");
        prompt.append("- 姓名：").append(userProfile.getName()).append("\n");
        prompt.append("- 年龄：").append(userProfile.getAge()).append("岁\n");
        prompt.append("- 性别：").append(userProfile.getGender()).append("\n");
        prompt.append("- 身高：").append(userProfile.getHeight()).append("cm\n");
        prompt.append("- 体重：").append(userProfile.getWeight()).append("kg\n");
        prompt.append("- BMI：").append(userProfile.getBmi()).append("（").append(userProfile.getBmiStatusLabel())
                .append("）\n");
        prompt.append("- 居住地区：").append(userProfile.getRegion()).append("\n");

        // 健康状况
        if (userProfile.getChronicConditions() != null && !userProfile.getChronicConditions().isEmpty()) {
            prompt.append("- 慢性疾病：").append(String.join("、", userProfile.getChronicConditions())).append("\n");
        }

        // 饮食偏好
        if (userProfile.getDietaryPreferences() != null && !userProfile.getDietaryPreferences().isEmpty()) {
            prompt.append("- 饮食偏好：").append(String.join("、", userProfile.getDietaryPreferences())).append("\n");
        }

        // 特殊要求
        if (request.getSpecialRequirements() != null && !request.getSpecialRequirements().isEmpty()) {
            prompt.append("- 特殊要求：").append(request.getSpecialRequirements()).append("\n");
        }

        prompt.append("\n");

        // 设计原则
        prompt.append("设计原则：\n");
        prompt.append("1. 营养均衡：确保蛋白质、碳水化合物、脂肪、维生素、矿物质的合理搭配\n");
        prompt.append("2. 中医养生：结合中医理论，考虑食物的性味功效\n");
        prompt.append("3. 适老化设计：菜品易消化、易咀嚼、口感适中\n");
        prompt.append("4. 个性化定制：根据用户的健康状况和偏好进行定制\n");
        prompt.append("5. 食材新鲜：选择当季新鲜食材\n");
        prompt.append("6. 制作简单：考虑老年人的制作能力\n");
        prompt.append("7. 菜品数量：为早餐、午餐和晚餐各生成3道菜品。\n");

        prompt.append("\n");

        // 返回格式要求
        prompt.append("请严格按照以下JSON格式返回，不要添加任何其他文字：");
        prompt.append(getMealPlanJsonFormat());

        return prompt.toString();
    }

    /**
     * 构建膳食计划用户提示词
     */
    private String buildMealPlanUserPrompt(Profile userProfile, LocalDate planDate, MealPlanRequest request) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("请为我生成").append(planDate).append("的膳食计划。");

        if (request.getPreferredIngredients() != null && !request.getPreferredIngredients().isEmpty()) {
            prompt.append("希望包含的食材：").append(String.join("、", request.getPreferredIngredients())).append("。");
        }

        if (request.getAvoidIngredients() != null && !request.getAvoidIngredients().isEmpty()) {
            prompt.append("需要避免的食材：").append(String.join("、", request.getAvoidIngredients())).append("。");
        }

        prompt.append("请确保每个菜品都有详细的推荐理由，说明为什么这道菜适合我的健康状况。");

        return prompt.toString();
    }

    /**
     * 构建菜品替换系统提示词
     */
    private String buildDishReplaceSystemPrompt(Profile userProfile, Meal targetMeal, Dish originalDish,
            DishReplaceRequest request) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("你是一位专业的中医营养师，现在需要为用户替换一道菜品。");
        prompt.append("请保持整餐的营养平衡，生成一道适合的替换菜品。");
        prompt.append("\n\n");

        // 用户信息
        prompt.append("用户信息：\n");
        prompt.append("- 姓名：").append(userProfile.getName()).append("\n");
        prompt.append("- 年龄：").append(userProfile.getAge()).append("岁\n");
        prompt.append("- 健康状况：").append(userProfile.getChronicConditions()).append("\n");

        // 餐次信息
        prompt.append("餐次：").append(targetMeal.getMealTypeLabel()).append("\n");
        prompt.append("现有菜品：");
        for (int i = 0; i < targetMeal.getDishes().size(); i++) {
            Dish dish = targetMeal.getDishes().get(i);
            if (i == request.getDishIndex()) {
                prompt.append("【待替换】").append(dish.getName());
            } else {
                prompt.append(dish.getName());
            }
            if (i < targetMeal.getDishes().size() - 1) {
                prompt.append("、");
            }
        }
        prompt.append("\n");

        // 替换要求
        if (request.getPreferredIngredient() != null) {
            prompt.append("希望包含食材：").append(request.getPreferredIngredient()).append("\n");
        }
        if (request.getAvoidIngredient() != null) {
            prompt.append("需要避免食材：").append(request.getAvoidIngredient()).append("\n");
        }
        if (request.getSpecialRequirement() != null) {
            prompt.append("特殊要求：").append(request.getSpecialRequirement()).append("\n");
        }

        prompt.append("\n请返回一道新的菜品，格式如下：");
        prompt.append(getDishJsonFormat());

        return prompt.toString();
    }

    /**
     * 构建菜品替换用户提示词
     */
    private String buildDishReplaceUserPrompt(Profile userProfile, Meal targetMeal, Dish originalDish,
            DishReplaceRequest request) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("我想要替换").append(targetMeal.getMealTypeLabel()).append("中的").append(originalDish.getName())
                .append("。");

        if (request.getReplaceReason() != null) {
            prompt.append("替换原因：").append(request.getReplaceReason()).append("。");
        }

        prompt.append("请推荐一道营养相当、适合我健康状况的菜品。");

        return prompt.toString();
    }

    /**
     * 调用AI API
     */
    private String callAiApi(String systemPrompt, String userPrompt) throws Exception {
        // 构建请求
        List<AiApiRequest.AiMessage> messages = Arrays.asList(
                AiApiRequest.AiMessage.builder()
                        .role("system")
                        .content(systemPrompt)
                        .build(),
                AiApiRequest.AiMessage.builder()
                        .role("user")
                        .content(userPrompt)
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

        HttpEntity<AiApiRequest> entity = new HttpEntity<>(request, headers);

        // 发送请求
        ResponseEntity<String> response = restTemplate.exchange(
                aiApiUrl,
                HttpMethod.POST,
                entity,
                String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("AI API调用失败: " + response.getStatusCode());
        }

        // 解析响应
        JsonNode jsonNode = objectMapper.readTree(response.getBody());
        JsonNode choices = jsonNode.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new RuntimeException("AI API响应格式错误");
        }

        JsonNode message = choices.get(0).get("message");
        if (message == null) {
            throw new RuntimeException("AI API响应格式错误");
        }

        return message.get("content").asText();
    }

    /**
     * 解析膳食计划响应
     */
    private MealPlan parseMealPlanResponse(String aiResponse, LocalDate planDate) throws JsonProcessingException {
        // 清理响应内容，移除可能的markdown格式
        String jsonContent = aiResponse.trim();
        if (jsonContent.startsWith("```json")) {
            jsonContent = jsonContent.substring(7);
        }
        if (jsonContent.endsWith("```")) {
            jsonContent = jsonContent.substring(0, jsonContent.length() - 3);
        }
        jsonContent = jsonContent.trim();

        JsonNode jsonNode = objectMapper.readTree(jsonContent);

        // 解析早餐
        Meal breakfast = parseMealFromJson(jsonNode.get("breakfast"), "breakfast");

        // 解析午餐
        Meal lunch = parseMealFromJson(jsonNode.get("lunch"), "lunch");

        // 解析晚餐
        Meal dinner = parseMealFromJson(jsonNode.get("dinner"), "dinner");

        // 构建膳食计划
        return MealPlan.builder()
                .planDate(planDate)
                .breakfast(breakfast)
                .lunch(lunch)
                .dinner(dinner)
                .generatedReason(jsonNode.get("generatedReason").asText())
                .healthTips(jsonNode.has("healthTips") ? jsonNode.get("healthTips").asText() : null)
                .build();
    }

    /**
     * 从JSON解析餐次
     */
    private Meal parseMealFromJson(JsonNode mealNode, String mealType) {
        List<Dish> dishes = new ArrayList<>();

        JsonNode dishesNode = mealNode.get("dishes");
        if (dishesNode != null && dishesNode.isArray()) {
            for (JsonNode dishNode : dishesNode) {
                Dish dish = parseDishFromJson(dishNode);
                dishes.add(dish);
            }
        }

        return Meal.builder()
                .mealType(mealType)
                .dishes(dishes)
                .nutritionSummary(mealNode.has("nutritionSummary") ? mealNode.get("nutritionSummary").asText() : null)
                .mealTips(mealNode.has("mealTips") ? mealNode.get("mealTips").asText() : null)
                .build();
    }

    /**
     * 从JSON解析菜品
     */
    private Dish parseDishFromJson(JsonNode dishNode) {
        List<String> ingredients = new ArrayList<>();
        JsonNode ingredientsNode = dishNode.get("ingredients");
        if (ingredientsNode != null && ingredientsNode.isArray()) {
            for (JsonNode ingredient : ingredientsNode) {
                ingredients.add(ingredient.asText());
            }
        }

        List<String> tags = new ArrayList<>();
        JsonNode tagsNode = dishNode.get("tags");
        if (tagsNode != null && tagsNode.isArray()) {
            for (JsonNode tag : tagsNode) {
                tags.add(tag.asText());
            }
        }

        return Dish.builder()
                .name(dishNode.get("name").asText())
                .ingredients(ingredients)
                .recommendationReason(dishNode.get("recommendationReason").asText())
                .preparationNotes(dishNode.has("preparationNotes") ? dishNode.get("preparationNotes").asText() : null)
                .tags(tags)
                .build();
    }

    /**
     * 解析菜品响应
     */
    private Dish parseDishResponse(String aiResponse, String mealType) throws JsonProcessingException {
        // 清理响应内容
        String jsonContent = aiResponse.trim();
        if (jsonContent.startsWith("```json")) {
            jsonContent = jsonContent.substring(7);
        }
        if (jsonContent.endsWith("```")) {
            jsonContent = jsonContent.substring(0, jsonContent.length() - 3);
        }
        jsonContent = jsonContent.trim();

        JsonNode jsonNode = objectMapper.readTree(jsonContent);
        return parseDishFromJson(jsonNode);
    }

    /**
     * 获取膳食计划JSON格式模板
     */
    private String getMealPlanJsonFormat() {
        return """
                {
                  "breakfast": {
                    "dishes": [
                      {
                        "name": "菜品名称",
                        "ingredients": ["食材1", "食材2"],
                        "recommendationReason": "推荐理由"
                      }
                    ],
                    "nutritionSummary": "营养摘要"
                  },
                  "lunch": { ... },
                  "dinner": { ... },
                  "generatedReason": "整体推荐理由"
                }
                """;
    }

    // "mealTips": "用餐建议"
    // "healthTips": "健康建议"
    /**
     * 获取菜品JSON格式模板
     */
    private String getDishJsonFormat() {
        return """
                {
                  "name": "菜品名称",
                  "ingredients": ["食材1", "食材2"],
                  "recommendationReason": "推荐理由"
                }
                """;
    }
    // "preparationNotes": "制作说明",
    // "tags": ["标签1", "标签2"]
}