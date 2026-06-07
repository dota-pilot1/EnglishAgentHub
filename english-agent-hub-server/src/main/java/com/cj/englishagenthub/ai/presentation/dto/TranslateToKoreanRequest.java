package com.cj.englishagenthub.ai.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TranslateToKoreanRequest(
        @NotBlank
        @Size(max = 12000)
        String text
) {
}
