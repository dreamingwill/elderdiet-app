package com.elderdiet.backend.service;

import com.elderdiet.backend.config.AiConfig;
import com.elderdiet.backend.dto.AiApiRequest;
import com.elderdiet.backend.dto.DishReplaceRequest;
import com.elderdiet.backend.dto.MealPlanRequest;
import com.elderdiet.backend.entity.Dish;
import com.elderdiet.backend.entity.Meal;
import com.elderdiet.backend.entity.MealPlan;
import com.elderdiet.backend.entity.Profile;
import com.elderdiet.backend.repository.MealPlanRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
    private final AiConfig.AiProperties aiProperties;
    private final MealPlanRepository mealPlanRepository;

    /**
     * 生成完整的膳食计划
     */
    public MealPlan generateCompleteMealPlan(Profile userProfile, LocalDate planDate, MealPlanRequest request) {
        log.info("开始生成完整膳食计划，用户: {}, 日期: {}", userProfile.getName(), planDate);

        try {
            // 1. 获取最近的膳食计划以避免重复
            List<MealPlan> recentPlans = mealPlanRepository
                    .findTop5ByUserIdOrderByPlanDateDesc(userProfile.getUserId());
            Set<String> recentDishes = recentPlans.stream()
                    .flatMap(plan -> Stream.of(plan.getBreakfast(), plan.getLunch(), plan.getDinner()))
                    .filter(Objects::nonNull)
                    .flatMap(meal -> meal.getDishes().stream())
                    .map(Dish::getName)
                    .collect(Collectors.toSet());
            log.info("为避免重复，获取到用户 {} 最近的 {} 道菜品", userProfile.getName(), recentDishes.size());

            // 2. 构建系统提示词，并注入历史菜品数据
            String systemPrompt = buildMealPlanSystemPrompt(userProfile, planDate, request, recentDishes);

            // 3. 构建用户请求
            String userPrompt = buildMealPlanUserPrompt(userProfile, planDate, request);

            // 4. 调用AI API
            String aiResponse = callAiApi(systemPrompt, userPrompt);

            // 5. 解析AI响应
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
    private String buildMealPlanSystemPrompt(Profile userProfile, LocalDate planDate, MealPlanRequest request,
            Set<String> recentDishes) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("你是一位资深的、拥有超过20年临床经验的中医高级营养师，擅长将传统中医养生智慧与现代营养科学相结合，为不同年龄段（特别是中老年）及患有多种慢性病的用户提供精准、个性化的饮食调理方案。");
        prompt.append("你的核心任务是为一位具体的用户，基于其详细的健康档案和特定需求，设计一份科学、安全、美味且极具个性化的一日三餐计划。你需要确保每一份推荐都令人信服，并能体现出你的专业水准。");
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
        prompt.append("1. **营养均衡**：确保蛋白质、碳水化合物、脂肪、维生素、矿物质的合理搭配。\n");
        prompt.append("2. **中医养生**：结合中医理论，考虑食物的性味功效，为用户进行食疗调理。\n");
        prompt.append("3. **适龄化设计**：菜品必须易消化、易咀嚼、口感软烂适中，完全匹配用户的年龄和身体状况。\n");
        prompt.append("4. **个性化定制**：严格根据用户的健康状况（尤其是慢性病）和个人偏好进行定制。\n");
        prompt.append("5. **多样化与创新**：每日菜品应避免重复，选择不同食材与烹饪方式，适当创新，兼顾美味与健康。\n");
        prompt.append("6. **菜品数量**：为早餐、午餐和晚餐各生成3道菜品。\n");
        prompt.append("7. **推荐理由 (recommendationReason)**：这是说服用户的关键，必须结构清晰、内容翔实、具有说服力。请严格遵循以下要求：\n");
        prompt.append("   - **字数要求**：严格控制在 **80到120个汉字** 之间。\n");
        prompt.append("   - **内容结构**：必须包含三个层面：\n");
        prompt.append("     1. **中医食疗价值** (约30字): 点明食材性味，解释其如何根据中医理论调理用户身体。\n");
        prompt.append("     2. **现代营养分析** (约50字): 分析关键营养成分（如优质蛋白、特定维生素、膳食纤维等）及其对用户慢性病（如高血压、糖尿病）的具体益处。\n");
        prompt.append("     3. **适龄化与个性化** (约30字): 强调菜品的烹饪方式为何适合用户的年龄和消化能力（如软烂、易消化），并结合用户的个人偏好。\n");
        prompt.append("   - **高质量范例**: \n");
        prompt.append(
                "     - **【范例1·鱼类】清蒸鲈鱼**: '鲈鱼性平味甘，有补肝肾、益脾胃的功效。从营养学角度，它富含优质蛋白质和Omega-3脂肪酸，有助于保护心血管、降低血脂，对您的高血压有益。清蒸做法保证了肉质软嫩易消化，完美符合您的口味偏好。'\n");
        prompt.append(
                "     - **【范例2·素食】西芹炒百合**: '百合性微寒，能润肺安神；西芹性凉，可平肝清热，有助于调理您因压力引起的血糖波动。此菜富含膳食纤维，能延缓餐后血糖上升，是管理糖尿病的理想菜肴。快炒保持了食材的爽脆，清新不油腻，符合您的清淡口味。'\n");
        prompt.append(
                "     - **【范例3·汤品】杜仲核桃猪骨汤**: '杜仲乃补肾强骨之要药，核桃则补肾固精，此汤旨在温补肾阳，对您腰膝酸软的状况有很好的调养效果。猪骨汤富含胶原蛋白和钙质，核桃提供Omega-3脂肪酸，有助于减轻炎症。长时间炖煮使精华融入汤中，温润顺滑，易于消化。'\n");
        prompt.append("8. **营养摘要 (nutritionSummary)**：每餐的营养摘要是对该餐整体的深度评价，需全面概括其营养价值与健康功效。请严格遵循以下要求：\n");
        prompt.append("   - **字数要求**：严格控制在 **100到140个汉字** 之间。\n");
        prompt.append(
                "   - **内容核心**: 必须从 **宏量营养素** (蛋白质、脂肪、碳水) 的均衡性出发，进一步分析其对用户核心健康目标（如控血糖、护心脑、健骨骼等）的 **关键作用**，并点出 **1-2种特色微量营养素** (如Omega-3、钙、特定维生素) 的贡献。\n");
        prompt.append(
                "   - **高质量范例**: '【示例】本餐通过鱼肉、豆腐和多样蔬菜，构建了优质蛋白、必需脂肪酸和碳水化合物的黄金配比，为身体提供了全面而均衡的能量。特别强化的Omega-3与多种维生素B群，对维护您的心脑血管健康、降低炎症水平起到关键作用。同时，高膳食纤维的设计能促进肠道健康，帮助您更平稳地控制餐后血糖，实现营养与调理的双重目标。'\n");
        // 新增烹饪方式多样化要求
        prompt.append("9. **烹饪方式多样化**：请合理轮换“蒸、煮、炖、炒、凉拌、烤、焖、煲”等多种健康烹饪方式，避免同一餐或连续几天内同一烹饪方式（如“蒸”）出现过多。每餐至少包含2种不同的烹饪方式。\n");
        prompt.append("10. **烹饪方式防重**：请参考用户最近5次膳食计划中已出现的烹饪方式，优先选择近期未出现或出现较少的方式。\n");

        prompt.append("\n");

        // 避免重复要求
        if (recentDishes != null && !recentDishes.isEmpty()) {
            prompt.append("**重要避重规则**：\n");
            prompt.append("为确保膳食的多样性，请**严格避免**推荐以下在用户最近5次膳食计划中已出现过的菜品：\n");
            prompt.append("- `").append(String.join("`, `", recentDishes)).append("`\n");
            prompt.append("请务必选择全新的、不同的食材和烹饪方法，为用户带来新颖的用餐体验。\n\n");
        }

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
        prompt.append("重要提醒：每道菜品的推荐理由必须严格控制在80~120汉字之间，请仔细计算字数确保符合要求。");
        prompt.append("请尽量选择不同的食材组合和烹饪方式，让每次的膳食计划都有新意和变化。");

        return prompt.toString();
    }

    /**
     * 构建菜品替换系统提示词
     */
    private String buildDishReplaceSystemPrompt(Profile userProfile, Meal targetMeal, Dish originalDish,
            DishReplaceRequest request) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("你是一位资深的、拥有超过20年临床经验的中医高级营养师，现在需要为用户替换一道菜品。");
        prompt.append("请保持整餐的营养平衡和设计理念，生成一道符合用户健康需求和偏好的高质量替换菜品。");
        prompt.append("\n\n");

        // 用户信息
        prompt.append("用户信息：\n");
        prompt.append("- 姓名：").append(userProfile.getName()).append("\n");
        prompt.append("- 年龄：").append(userProfile.getAge()).append("岁\n");
        prompt.append("- 健康状况：").append(String.join("、", userProfile.getChronicConditions())).append("\n");

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

        prompt.append("\n");
        prompt.append("替换菜品要求：\n");
        prompt.append("1. **多样性**: 请选择与原菜品及现有菜品不同的食材和烹饪方式。\n");
        prompt.append("2. **推荐理由**: 必须严格遵循为完整膳食计划定义的 **推荐理由 (recommendationReason)** 的所有要求（结构、字数、范例等），确保高质量输出。\n");
        prompt.append("\n");
        prompt.append("请严格按照以下JSON格式返回，不要添加任何其他文字：");
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
        prompt.append("重要提醒：推荐理由必须严格控制在80~120汉字之间，请仔细计算字数确保符合要求。");
        prompt.append("请选择与原菜品不同的食材和做法，让膳食更加丰富多样。");

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
                .model(aiProperties.getModel(AiConfig.TaskType.MEAL_RECOMMENDATION))
                .messages(messages)
                .temperature(aiProperties.getTemperature(AiConfig.TaskType.MEAL_RECOMMENDATION))
                .build();

        // 设置请求头
        AiConfig.TaskType taskType = AiConfig.TaskType.MEAL_RECOMMENDATION;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(aiProperties.getKey(taskType));

        HttpEntity<AiApiRequest> entity = new HttpEntity<>(request, headers);

        // 发送请求
        String apiUrl = aiProperties.getUrl(taskType);
        String model = aiProperties.getModel(taskType);
        log.info("调用膳食推荐AI API: {} (模型: {})", apiUrl, model);

        ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
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
                .build();
    }

    /**
     * 从JSON解析菜品
     */
    private Dish parseDishFromJson(JsonNode dishNode) {
        return Dish.builder()
                .name(dishNode.get("name").asText())
                .recommendationReason(dishNode.get("recommendationReason").asText())
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
                        "recommendationReason": "高质量推荐理由：1. 中医价值(约30字) 2. 现代营养(约50字) 3. 适老化与个性化(约30字)。总字数80-120字。"
                      }
                    ],
                    "nutritionSummary": "高质量营养摘要：宏量营养素、关键作用、微量营养素。总字数100-140字。"
                  },
                  "lunch": { ... },
                  "dinner": { ... },
                  "generatedReason": "整体推荐理由"
                }
                """;
    }

    /**
     * 获取菜品JSON格式模板
     */
    private String getDishJsonFormat() {
        return """
                {
                  "name": "新菜品名称",
                  "recommendationReason": "高质量推荐理由：1. 中医价值(约30字) 2. 现代营养(约50字) 3. 适老化与个性化(约30字)。总字数80-120字。"
                }
                """;
    }
}