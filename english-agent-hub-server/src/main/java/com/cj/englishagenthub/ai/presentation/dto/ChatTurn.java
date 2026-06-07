package com.cj.englishagenthub.ai.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 채팅 호출 시 함께 보내는 과거 한 턴.
 * role: "user" (학습자) | "assistant" (에이전트)
 */
public record ChatTurn(
        @NotBlank @Size(max = 16) String role,
        @NotBlank @Size(max = 12000) String content
) {
}
