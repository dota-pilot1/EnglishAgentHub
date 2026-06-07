package com.cj.englishagenthub.ai.application;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "openai.realtime")
public record RealtimeProperties(
        String model,
        String voice
) {
}
