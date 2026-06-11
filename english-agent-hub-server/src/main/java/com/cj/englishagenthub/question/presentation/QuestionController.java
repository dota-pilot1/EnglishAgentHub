package com.cj.englishagenthub.question.presentation;

import com.cj.englishagenthub.question.application.QuestionEmbeddingService;
import com.cj.englishagenthub.question.application.QuestionService;
import com.cj.englishagenthub.question.domain.QuestionDifficulty;
import com.cj.englishagenthub.question.domain.QuestionSubject;
import com.cj.englishagenthub.question.presentation.dto.QuestionResponse;
import com.cj.englishagenthub.question.presentation.dto.QuestionUpsertRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Question Bank", description = "문제은행 저장 및 조회")
public class QuestionController {

    private final QuestionService questionService;
    private final QuestionEmbeddingService questionEmbeddingService;

    @GetMapping
    @Operation(summary = "문제 목록 조회")
    public List<QuestionResponse> list(
            @RequestParam(required = false) QuestionSubject subject,
            @RequestParam(required = false) QuestionDifficulty difficulty,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String keyword
    ) {
        return questionService.list(subject, difficulty, category, topic, keyword);
    }

    @GetMapping("/{id}")
    @Operation(summary = "문제 단건 조회")
    public QuestionResponse get(@PathVariable String id) {
        return questionService.get(id);
    }

    @PostMapping
    @Operation(summary = "문제 등록")
    public QuestionResponse create(@Valid @RequestBody QuestionUpsertRequest req) {
        return questionService.create(req);
    }

    @PutMapping("/{id}")
    @Operation(summary = "문제 수정")
    public QuestionResponse update(
            @PathVariable String id,
            @Valid @RequestBody QuestionUpsertRequest req
    ) {
        return questionService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "문제 삭제")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        questionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/embed-pending")
    @Operation(summary = "PENDING/FAILED 문제 배치 임베딩")
    public QuestionEmbeddingService.EmbeddingBatchResult embedPending(
            @RequestParam(defaultValue = "50") int limit
    ) {
        return questionEmbeddingService.embedPending(limit);
    }

    @PostMapping("/{id}/embed")
    @Operation(summary = "문제 단건 임베딩")
    public QuestionResponse embedOne(@PathVariable String id) {
        return questionEmbeddingService.embedOne(id);
    }

    @GetMapping("/{id}/similar")
    @Operation(summary = "유사 문제 Top N 조회")
    public List<QuestionEmbeddingService.SimilarQuestion> findSimilar(
            @PathVariable String id,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return questionEmbeddingService.findSimilar(id, limit);
    }

    @GetMapping("/embedding-status")
    @Operation(summary = "임베딩 상태별 문제 수 조회")
    public QuestionEmbeddingService.EmbeddingCounts embeddingStatus() {
        return questionEmbeddingService.counts();
    }
}
