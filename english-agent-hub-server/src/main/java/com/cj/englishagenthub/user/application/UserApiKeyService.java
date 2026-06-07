package com.cj.englishagenthub.user.application;

import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import com.cj.englishagenthub.common.security.ApiKeyCipher;
import com.cj.englishagenthub.user.domain.User;
import com.cj.englishagenthub.user.infrastructure.UserRepository;
import com.cj.englishagenthub.user.presentation.dto.OpenAiApiKeyResponse;
import com.cj.englishagenthub.user.presentation.dto.OpenAiApiKeyValidationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserApiKeyService {

    private final UserRepository userRepository;
    private final ApiKeyCipher apiKeyCipher;

    @Transactional(readOnly = true)
    public OpenAiApiKeyResponse get(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!user.hasOpenAiApiKey()) return OpenAiApiKeyResponse.empty();
        try {
            String plain = apiKeyCipher.decrypt(user.getOpenAiApiKeyEncrypted());
            return new OpenAiApiKeyResponse(true, ApiKeyCipher.mask(plain));
        } catch (Exception e) {
            log.warn("Stored OpenAI key decrypt failed for user {}", userId);
            return new OpenAiApiKeyResponse(true, "********");
        }
    }

    @Transactional
    public OpenAiApiKeyResponse update(Long userId, String rawKey) {
        String key = rawKey == null ? "" : rawKey.trim();
        if (!StringUtils.hasText(key)) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.setOpenAiApiKeyEncrypted(apiKeyCipher.encrypt(key));
        return new OpenAiApiKeyResponse(true, ApiKeyCipher.mask(key));
    }

    @Transactional
    public void delete(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.setOpenAiApiKeyEncrypted(null);
    }

    @Transactional(readOnly = true)
    public OpenAiApiKeyValidationResponse validate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!user.hasOpenAiApiKey()) {
            return new OpenAiApiKeyValidationResponse(false, "저장된 키가 없습니다.");
        }
        String plain;
        try {
            plain = apiKeyCipher.decrypt(user.getOpenAiApiKeyEncrypted());
        } catch (Exception e) {
            return new OpenAiApiKeyValidationResponse(false, "저장된 키를 복호화할 수 없습니다.");
        }
        return probeOpenAi(plain);
    }

    private OpenAiApiKeyValidationResponse probeOpenAi(String apiKey) {
        try {
            RestClient.create("https://api.openai.com")
                    .get()
                    .uri("/v1/models")
                    .header("Authorization", "Bearer " + apiKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new BusinessException(ErrorCode.OPENAI_KEY_INVALID);
                    })
                    .toBodilessEntity();
            return new OpenAiApiKeyValidationResponse(true, "유효한 키입니다.");
        } catch (BusinessException e) {
            return new OpenAiApiKeyValidationResponse(false, "키가 거부되었습니다. (인증 실패)");
        } catch (Exception e) {
            log.warn("OpenAI key validation failed: {}", e.getMessage());
            return new OpenAiApiKeyValidationResponse(false, "OpenAI 확인 요청에 실패했습니다.");
        }
    }
}
