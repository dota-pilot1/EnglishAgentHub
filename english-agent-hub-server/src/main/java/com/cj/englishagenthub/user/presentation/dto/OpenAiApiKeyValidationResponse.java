package com.cj.englishagenthub.user.presentation.dto;

public record OpenAiApiKeyValidationResponse(
        boolean valid,
        String message
) {
}
