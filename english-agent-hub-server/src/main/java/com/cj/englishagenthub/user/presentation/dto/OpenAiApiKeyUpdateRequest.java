package com.cj.englishagenthub.user.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OpenAiApiKeyUpdateRequest(
        @NotBlank
        @Size(min = 8, max = 500)
        String apiKey
) {
}
