package com.cj.englishagenthub.ai.infrastructure;

import com.cj.englishagenthub.auth.security.UserPrincipal;
import com.cj.englishagenthub.common.security.ApiKeyCipher;
import com.cj.englishagenthub.user.domain.User;
import com.cj.englishagenthub.user.infrastructure.UserRepository;
import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 현재 인증된 유저의 OpenAI API 키를 우선 사용하고, 없으면 시스템 기본 키로 폴백한다.
 * - ChatClient.Builder : Spring AI 채팅용
 * - getEffectiveApiKey(): 직접 RestClient를 쓰는 realtime/transcribe/speech용
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OpenAiClientResolver {

    private final UserRepository userRepository;
    private final ApiKeyCipher apiKeyCipher;
    private final ObjectProvider<ChatClient.Builder> systemChatClientBuilderProvider;

    @Value("${spring.ai.openai.api-key:}")
    private String systemOpenAiApiKey;

    /** 현재 인증된 유저의 평문 OpenAI 키. 없으면 null. */
    public String currentUserOpenAiKey() {
        Long userId = currentUserIdOrNull();
        if (userId == null) return null;
        return userRepository.findById(userId)
                .filter(User::hasOpenAiApiKey)
                .map(u -> {
                    try {
                        return apiKeyCipher.decrypt(u.getOpenAiApiKeyEncrypted());
                    } catch (Exception e) {
                        log.warn("Failed to decrypt OpenAI key for user {}", userId);
                        return null;
                    }
                })
                .orElse(null);
    }

    /** 실제 호출에 쓸 키 — 유저 키 > 시스템 키. 둘 다 없으면 null. */
    public String getEffectiveApiKey() {
        String user = currentUserOpenAiKey();
        if (StringUtils.hasText(user)) return user;
        return StringUtils.hasText(systemOpenAiApiKey) ? systemOpenAiApiKey : null;
    }

    public boolean hasUsableKey() {
        return StringUtils.hasText(getEffectiveApiKey());
    }

    /** Spring AI ChatClient.Builder. 유저 키가 있으면 그 키로 새 빌더, 없으면 시스템 빈을 그대로. */
    public ChatClient.Builder resolveChatClientBuilder() {
        String userKey = currentUserOpenAiKey();
        if (StringUtils.hasText(userKey)) {
            OpenAIClient sdkClient = OpenAIOkHttpClient.builder()
                    .apiKey(userKey)
                    .build();
            OpenAiChatModel model = OpenAiChatModel.builder()
                    .openAiClient(sdkClient)
                    .build();
            return ChatClient.builder(model);
        }
        return systemChatClientBuilderProvider.getIfAvailable();
    }

    private Long currentUserIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserPrincipal up) return up.getId();
        return null;
    }
}
