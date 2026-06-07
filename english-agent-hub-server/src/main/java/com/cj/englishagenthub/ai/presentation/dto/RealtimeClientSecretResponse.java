package com.cj.englishagenthub.ai.presentation.dto;

import java.util.Map;

public record RealtimeClientSecretResponse(
        String model,
        String voice,
        Map<String, Object> raw
) {
}
