package com.cj.englishagenthub.ai.presentation;

import com.cj.englishagenthub.ai.application.RealtimeSessionService;
import com.cj.englishagenthub.ai.presentation.dto.RealtimeClientSecretRequest;
import com.cj.englishagenthub.ai.presentation.dto.RealtimeClientSecretResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/realtime")
@RequiredArgsConstructor
@Tag(name = "Realtime", description = "OpenAI Realtime 세션 발급")
public class RealtimeController {

    private final RealtimeSessionService realtimeSessionService;

    @PostMapping("/client-secret")
    @Operation(summary = "Realtime client secret 발급")
    public RealtimeClientSecretResponse createClientSecret(@Valid @RequestBody RealtimeClientSecretRequest request) {
        return realtimeSessionService.createClientSecret(request);
    }
}
