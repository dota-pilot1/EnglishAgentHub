package com.cj.englishagenthub.ai.presentation.dto;

import jakarta.validation.constraints.NotBlank;

public record RealtimeClientSecretRequest(
        @NotBlank
        String agentId,
        boolean autoKoEn
) {
}
