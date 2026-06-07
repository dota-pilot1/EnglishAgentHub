package com.cj.englishagenthub.user.presentation.dto;

public record OpenAiApiKeyResponse(
        boolean configured,
        String maskedKey
) {
    public static OpenAiApiKeyResponse empty() {
        return new OpenAiApiKeyResponse(false, "");
    }
}
