package com.cj.englishagenthub.ai.application;

import com.cj.englishagenthub.ai.domain.LearningAgentType;
import com.cj.englishagenthub.ai.presentation.dto.RealtimeClientSecretRequest;
import com.cj.englishagenthub.ai.presentation.dto.RealtimeClientSecretResponse;
import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class RealtimeSessionService {

    private final RealtimeProperties realtimeProperties;

    @Value("${spring.ai.openai.api-key:}")
    private String openAiApiKey;

    public RealtimeClientSecretResponse createClientSecret(RealtimeClientSecretRequest request) {
        requireOpenAiApiKey();
        LearningAgentType agentType = LearningAgentType.fromId(request.agentId());
        String instructions = agentType.systemPrompt();
        Map<String, Object> transcription = request.autoKoEn()
                ? Map.of(
                        "model", "gpt-4o-mini-transcribe",
                        "language", "en",
                        "prompt", "Translate Korean speech into natural English text. If the speaker uses English, transcribe it as English. Return only English."
                )
                : Map.of("model", "gpt-4o-mini-transcribe");

        if (request.autoKoEn()) {
            instructions = instructions + " When the learner speaks Korean, understand it as Korean input for English practice: translate their meaning into natural English internally, show or use the English phrasing, and respond in English unless they explicitly ask otherwise.";
        }

        Map<String, Object> audioInput = new HashMap<>();
        audioInput.put("transcription", transcription);
        if (request.autoKoEn()) {
            audioInput.put("turn_detection", Map.of(
                    "type", "server_vad",
                    "create_response", false
            ));
        }

        Map<String, Object> body = Map.of(
                "session", Map.of(
                        "type", "realtime",
                        "model", realtimeProperties.model(),
                        "instructions", instructions,
                        "audio", Map.of(
                                "input", audioInput,
                                "output", Map.of("voice", realtimeProperties.voice())
                        )
                )
        );

        try {
            Map<String, Object> response = RestClient.create("https://api.openai.com")
                    .post()
                    .uri("/v1/realtime/client_secrets")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });

            if (response == null || response.isEmpty()) {
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            }

            return new RealtimeClientSecretResponse(
                    realtimeProperties.model(),
                    realtimeProperties.voice(),
                    response
            );
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }
    }

    private void requireOpenAiApiKey() {
        if (!StringUtils.hasText(openAiApiKey)) {
            throw new BusinessException(ErrorCode.OPENAI_NOT_CONFIGURED);
        }
    }
}
