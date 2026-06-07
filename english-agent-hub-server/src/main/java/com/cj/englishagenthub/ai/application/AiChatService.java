package com.cj.englishagenthub.ai.application;

import com.cj.englishagenthub.ai.domain.LearningAgentType;
import com.cj.englishagenthub.ai.presentation.dto.AiChatMessageRequest;
import com.cj.englishagenthub.ai.presentation.dto.AiChatMessageResponse;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToEnglishRequest;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToEnglishResponse;
import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AiChatService {

    private final ObjectProvider<ChatClient.Builder> chatClientBuilderProvider;

    @Value("${spring.ai.openai.api-key:}")
    private String openAiApiKey;

    public AiChatMessageResponse chat(AiChatMessageRequest request) {
        requireOpenAiApiKey();

        LearningAgentType agentType = LearningAgentType.fromId(request.agentId());
        ChatClient.Builder builder = chatClientBuilderProvider.getIfAvailable();
        if (builder == null) {
            throw new BusinessException(ErrorCode.OPENAI_NOT_CONFIGURED);
        }

        String content = builder.build()
                .prompt()
                .system(agentType.systemPrompt())
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
                .system(agentType.systemPrompt())
                .user(request.message())
                .stream()
                .content()
                .filter(StringUtils::hasText);
    }

    public TranslateToEnglishResponse translateToEnglish(TranslateToEnglishRequest request) {
        requireOpenAiApiKey();

        ChatClient.Builder builder = chatClientBuilderProvider.getIfAvailable();
        if (builder == null) {
            throw new BusinessException(ErrorCode.OPENAI_NOT_CONFIGURED);
        }

        String content = builder.build()
                .prompt()
                .system("Translate the user's message into natural English for an English learning chat. If it is already English, lightly clean up obvious speech recognition noise. Return only the English sentence, with no explanation.")
                .user(request.text())
                .call()
                .content();

        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        return new TranslateToEnglishResponse(content.trim());
    }

    private void requireOpenAiApiKey() {
        if (!StringUtils.hasText(openAiApiKey)) {
            throw new BusinessException(ErrorCode.OPENAI_NOT_CONFIGURED);
        }
    }
}
