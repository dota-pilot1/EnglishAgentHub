package com.cj.englishagenthub.ai.presentation.dto;

import jakarta.validation.constraints.Size;

public record SuggestReplyRequest(
        @Size(max = 100) String agentId,
        @Size(max = 4000) String instructions,
        @Size(max = 4000) String lastAgentMessage,
        @Size(max = 2000) String lastLearnerMessage,
        // 직렬화된 최근 대화 (예: "Character: ...\nLearner: ...\n..."), 최대 6턴 정도.
        @Size(max = 8000) String recentHistory
) {
}
