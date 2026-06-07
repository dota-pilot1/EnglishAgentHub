package com.cj.englishagenthub.character.presentation;

import com.cj.englishagenthub.auth.security.UserPrincipal;
import com.cj.englishagenthub.character.application.CharacterService;
import com.cj.englishagenthub.character.presentation.dto.CharacterResponse;
import com.cj.englishagenthub.character.presentation.dto.CharacterUpsertRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/characters")
@RequiredArgsConstructor
@Tag(name = "Shared Characters", description = "공유 챗봇 캐릭터 CRUD")
public class CharacterController {

    private final CharacterService characterService;

    @GetMapping
    @Operation(summary = "공유 캐릭터 목록")
    public List<CharacterResponse> list() {
        return characterService.list();
    }

    @GetMapping("/{id}")
    @Operation(summary = "캐릭터 단건")
    public CharacterResponse get(@PathVariable Long id) {
        return characterService.get(id);
    }

    @PostMapping
    @Operation(summary = "캐릭터 생성")
    public CharacterResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CharacterUpsertRequest req
    ) {
        return characterService.create(principal, req);
    }

    @PutMapping("/{id}")
    @Operation(summary = "캐릭터 수정 (본인 또는 관리자)")
    public CharacterResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CharacterUpsertRequest req
    ) {
        return characterService.update(principal, id, req);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "캐릭터 삭제 (본인 또는 관리자)")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        characterService.delete(principal, id);
        return ResponseEntity.noContent().build();
    }
}
