package com.cj.englishagenthub.ai.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SpeechRequest(
        @NotBlank
        @Size(max = 4000)
        String text,
        String voice
) {
}
