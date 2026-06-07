package com.cj.englishagenthub.ai.application;

import com.cj.englishagenthub.ai.domain.LearningAgentType;
import com.cj.englishagenthub.ai.presentation.dto.AiChatMessageRequest;
import com.cj.englishagenthub.ai.presentation.dto.AiChatMessageResponse;
import com.cj.englishagenthub.ai.presentation.dto.ExpressionFeedbackRequest;
import com.cj.englishagenthub.ai.presentation.dto.ExpressionFeedbackResponse;
import com.cj.englishagenthub.ai.presentation.dto.SpeechRequest;
import com.cj.englishagenthub.ai.presentation.dto.TranscribeResponse;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToEnglishRequest;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToEnglishResponse;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToKoreanRequest;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToKoreanResponse;
import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatService {

    private final ObjectProvider<ChatClient.Builder> chatClientBuilderProvider;

    @Value("${spring.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${openai.translation.model:gpt-5-nano}")
    private String translationModel;

    @Value("${openai.transcribe.model:gpt-4o-mini-transcribe}")
    private String transcribeModel;

    @Value("${openai.tts.model:gpt-4o-mini-tts}")
    private String ttsModel;

    @Value("${openai.tts.voice:alloy}")
    private String ttsVoice;

    public AiChatMessageResponse chat(AiChatMessageRequest request) {
        requireOpenAiApiKey();

        LearningAgentType agentType = LearningAgentType.fromId(request.agentId());
        ChatClient.Builder builder = chatClientBuilderProvider.getIfAvailable();
        if (builder == null) {
            throw new BusinessException(ErrorCode.OPENAI_NOT_CONFIGURED);
        }

        String content = builder.build()
                .prompt()
                .system(resolveInstructions(agentType, request.instructions()))
                .user(request.message())
                .call()
                .content();

        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        return new AiChatMessageResponse(agentType.id(), content, Instant.now());
    }

    public Flux<String> stream(AiChatMessageRequest request) {
        requireOpenAiApiKey();

        LearningAgentType agentType = LearningAgentType.fromId(request.agentId());
        ChatClient.Builder builder = chatClientBuilderProvider.getIfAvailable();
        if (builder == null) {
            throw new BusinessException(ErrorCode.OPENAI_NOT_CONFIGURED);
        }

        return builder.build()
                .prompt()
                .system(resolveInstructions(agentType, request.instructions()))
                .user(request.message())
                .stream()
                .content()
                .filter(StringUtils::hasText);
    }

    private String resolveInstructions(LearningAgentType agentType, String override) {
        return StringUtils.hasText(override) ? override : agentType.systemPrompt();
    }

    public TranslateToEnglishResponse translateToEnglish(TranslateToEnglishRequest request) {
        requireOpenAiApiKey();

        ChatClient.Builder builder = chatClientBuilderProvider.getIfAvailable();
        if (builder == null) {
            throw new BusinessException(ErrorCode.OPENAI_NOT_CONFIGURED);
        }

        String content = translateWithRetry(() -> builder.build()
                .prompt()
                .options(translationOptions())
                .system("Translate the user's message into natural English for an English learning chat. If it is already English, lightly clean up obvious speech recognition noise. Return only the English sentence, with no explanation.")
                .user(request.text())
                .call()
                .content());

        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        return new TranslateToEnglishResponse(content.trim());
    }

    public TranslateToKoreanResponse translateToKorean(TranslateToKoreanRequest request) {
        requireOpenAiApiKey();

        ChatClient.Builder builder = chatClientBuilderProvider.getIfAvailable();
        if (builder == null) {
            throw new BusinessException(ErrorCode.OPENAI_NOT_CONFIGURED);
        }

        String content = translateWithRetry(() -> builder.build()
                .prompt()
                .options(translationOptions())
                .system("Translate the user's English message into natural Korean for an English learning chat. Preserve the meaning and tone. Return only the Korean translation, with no explanation.")
                .user(request.text())
                .call()
                .content());

        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        return new TranslateToKoreanResponse(content.trim());
    }

    public ExpressionFeedbackResponse expressionFeedback(ExpressionFeedbackRequest request) {
        requireOpenAiApiKey();

        ChatClient.Builder builder = chatClientBuilderProvider.getIfAvailable();
        if (builder == null) {
            throw new BusinessException(ErrorCode.OPENAI_NOT_CONFIGURED);
        }

        String content = builder.build()
                .prompt()
                .options(translationOptions(384))
                .system("""
                        You are an English expression coach for Korean learners.
                        The user may provide Korean or English.
                        If the user provides Korean, first infer what they want to say and provide natural English expressions.
                        If the user provides English, explain whether it sounds natural and improve it if needed.
                        Provide 2 or 3 natural English alternatives when helpful.
                        Explain briefly in Korean.
                        Keep the response concise and practical.
                        Use this format:
                        자연스러운 표현:
                        - ...

                        왜 더 자연스러운가:
                        ...

                        바로 쓰기:
                        ...
                        """)
                .user(request.text())
                .call()
                .content();

        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        return new ExpressionFeedbackResponse(content.trim());
    }

    public TranscribeResponse transcribe(MultipartFile file, String language) {
        requireOpenAiApiKey();

        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        try {
            final String filename = StringUtils.hasText(file.getOriginalFilename())
                    ? file.getOriginalFilename()
                    : "audio.webm";
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };

            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            form.add("file", resource);
            form.add("model", transcribeModel);
            form.add("language", StringUtils.hasText(language) ? language : "en");
            form.add("response_format", "json");

            Map<String, Object> response = RestClient.create("https://api.openai.com")
                    .post()
                    .uri("/v1/audio/transcriptions")
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(form)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });

            Object text = response == null ? null : response.get("text");
            if (text == null || !StringUtils.hasText(text.toString())) {
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            }

            return new TranscribeResponse(text.toString().trim());
        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            log.warn("Failed to read audio upload. error={}", e.getMessage());
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        } catch (Exception e) {
            log.warn("Transcription failed. model={}, error={}", transcribeModel, e.getMessage());
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }
    }

    public byte[] speech(SpeechRequest request) {
        requireOpenAiApiKey();

        String voice = StringUtils.hasText(request.voice()) ? request.voice() : ttsVoice;
        Map<String, Object> body = Map.of(
                "model", ttsModel,
                "input", request.text(),
                "voice", voice,
                "response_format", "mp3"
        );

        try {
            byte[] audio = RestClient.create("https://api.openai.com")
                    .post()
                    .uri("/v1/audio/speech")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .body(body)
                    .retrieve()
                    .body(byte[].class);

            if (audio == null || audio.length == 0) {
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            }

            return audio;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("TTS request failed. model={}, error={}", ttsModel, e.getMessage());
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }
    }

    private OpenAiChatOptions.Builder translationOptions() {
        return translationOptions(256);
    }

    private OpenAiChatOptions.Builder translationOptions(int maxCompletionTokens) {
        return OpenAiChatOptions.builder()
                .model(translationModel)
                .reasoningEffort("minimal")
                .verbosity("low")
                .maxCompletionTokens(maxCompletionTokens);
    }

    private void requireOpenAiApiKey() {
        if (!StringUtils.hasText(openAiApiKey)) {
            throw new BusinessException(ErrorCode.OPENAI_NOT_CONFIGURED);
        }
    }

    private String translateWithRetry(Supplier<String> translation) {
        try {
            return translation.get();
        } catch (Exception first) {
            log.warn("Translation request failed. Retrying once. model={}, error={}", translationModel, first.getMessage());
            try {
                Thread.sleep(700);
                return translation.get();
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            } catch (Exception second) {
                log.warn("Translation retry failed. model={}, error={}", translationModel, second.getMessage());
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            }
        }
    }
}
