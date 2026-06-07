package com.cj.englishagenthub.user.presentation;

import com.cj.englishagenthub.auth.security.UserPrincipal;
import com.cj.englishagenthub.user.application.UserApiKeyService;
import com.cj.englishagenthub.user.presentation.dto.OpenAiApiKeyResponse;
import com.cj.englishagenthub.user.presentation.dto.OpenAiApiKeyUpdateRequest;
import com.cj.englishagenthub.user.presentation.dto.OpenAiApiKeyValidationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/me/api-key")
@RequiredArgsConstructor
@Tag(name = "User API Key", description = "사용자 OpenAI API 키 관리")
public class UserApiKeyController {

    private final UserApiKeyService userApiKeyService;

    @GetMapping("/openai")
    @Operation(summary = "내 OpenAI API 키 조회(마스킹)")
    public OpenAiApiKeyResponse getOpenAi(@AuthenticationPrincipal UserPrincipal principal) {
        return userApiKeyService.get(principal.getId());
    }

    @PutMapping("/openai")
    @Operation(summary = "내 OpenAI API 키 저장/갱신")
    public OpenAiApiKeyResponse updateOpenAi(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody OpenAiApiKeyUpdateRequest req
    ) {
        return userApiKeyService.update(principal.getId(), req.apiKey());
    }

    @DeleteMapping("/openai")
    @Operation(summary = "내 OpenAI API 키 삭제")
    public ResponseEntity<Void> deleteOpenAi(@AuthenticationPrincipal UserPrincipal principal) {
        userApiKeyService.delete(principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/openai/validate")
    @Operation(summary = "내 OpenAI API 키 유효성 확인")
    public OpenAiApiKeyValidationResponse validateOpenAi(@AuthenticationPrincipal UserPrincipal principal) {
        return userApiKeyService.validate(principal.getId());
    }
}
