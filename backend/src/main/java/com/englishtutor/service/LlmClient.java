package com.englishtutor.service;

import com.englishtutor.config.LlmProperties;
import com.englishtutor.dto.ChatRequest;
import com.englishtutor.dto.ChatResponse;
import com.englishtutor.dto.MessageDto;
import com.englishtutor.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Talks to an OpenAI-compatible chat completions endpoint and turns the raw
 * response into a structured {@link ChatResponse}.
 *
 * The tutor is instructed to always answer with a small JSON object so the
 * frontend gets the reply, a grammar correction (if any), and a pronunciation
 * tip as separate fields instead of one blob of text to parse client-side.
 */
@Service
public class LlmClient {

    private static final String SYSTEM_PROMPT_TEMPLATE = """
            You are Ravi, a friendly, encouraging spoken-English tutor helping a %s-level learner
            practice conversation about "%s". Keep replies short (1-3 sentences), natural, and in
            simple English so the learner can follow along when it is read aloud.

            For every learner message:
            1. Continue the conversation naturally on the chosen topic, asking a short follow-up question.
            2. If the learner's sentence has a grammar or word-choice mistake, provide the corrected
               sentence and a one-sentence, encouraging explanation. If there is no mistake, leave both fields null.
            3. Offer one short, practical pronunciation or fluency tip relevant to what they said
               (or null if nothing stands out).

            Respond ONLY with a JSON object, no markdown fences, in exactly this shape:
            {"reply": "...", "correction": "..." or null, "correctionExplanation": "..." or null, "pronunciationTip": "..." or null}
            """;

    private final WebClient webClient;
    private final LlmProperties properties;
    private final ObjectMapper objectMapper;

    public LlmClient(WebClient llmWebClient, LlmProperties properties, ObjectMapper objectMapper) {
        this.webClient = llmWebClient;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public ChatResponse getTutorReply(ChatRequest request) {
        if (!properties.isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The tutor's AI is not configured yet. Set the LLM_API_KEY environment variable on the backend.");
        }

        String systemPrompt = SYSTEM_PROMPT_TEMPLATE.formatted(
                request.level() == null || request.level().isBlank() ? "beginner" : request.level(),
                request.topic());

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (request.history() != null) {
            for (MessageDto turn : request.history()) {
                String role = "assistant".equalsIgnoreCase(turn.role()) ? "assistant" : "user";
                messages.add(Map.of("role", role, "content", turn.text()));
            }
        }
        messages.add(Map.of("role", "user", "content", request.userText()));

        Map<String, Object> payload = Map.of(
                "model", properties.getModel(),
                "messages", messages,
                "temperature", 0.7,
                "response_format", Map.of("type", "json_object")
        );

        JsonNode root;
        try {
            root = webClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + properties.getApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(Duration.ofSeconds(properties.getTimeoutSeconds()))
                    .onErrorResume(err -> Mono.error(new ApiException(
                            HttpStatus.BAD_GATEWAY, "The tutor's AI service could not be reached: " + err.getMessage())))
                    .block();
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "The tutor's AI service could not be reached.");
        }

        String content = extractContent(root);
        return parseTutorJson(content);
    }

    private String extractContent(JsonNode root) {
        if (root == null || !root.has("choices") || root.path("choices").isEmpty()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "The tutor's AI returned an empty response.");
        }
        return root.path("choices").get(0).path("message").path("content").asText();
    }

    private ChatResponse parseTutorJson(String content) {
        try {
            JsonNode node = objectMapper.readTree(content);
            return new ChatResponse(
                    textOrNull(node, "reply"),
                    textOrNull(node, "correction"),
                    textOrNull(node, "correctionExplanation"),
                    textOrNull(node, "pronunciationTip")
            );
        } catch (Exception ex) {
            // Model didn't return valid JSON — fall back to showing the raw text as the reply
            // rather than failing the whole request.
            return new ChatResponse(content, null, null, null);
        }
    }

    private String textOrNull(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) return null;
        String text = value.asText();
        return text.isBlank() ? null : text;
    }
}
