package com.cj.englishagenthub.ai.presentation.dto;

import java.time.Instant;

public record AiChatMessageResponse(
        String agentId,
        String content,
        Instant createdAt
) {
}
