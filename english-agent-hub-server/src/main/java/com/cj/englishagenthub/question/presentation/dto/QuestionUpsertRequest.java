package com.cj.englishagenthub.question.presentation.dto;

import com.cj.englishagenthub.question.domain.QuestionDifficulty;
import com.cj.englishagenthub.question.domain.QuestionSubject;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record QuestionUpsertRequest(
        @NotNull QuestionSubject subject,
        @NotBlank String category,
        @NotBlank String topic,
        @NotNull QuestionDifficulty difficulty,
        @NotBlank String question,
        List<String> choices,
        @NotBlank String answer,
        @NotBlank String explanation,
        List<String> keywords,
        String embeddingText
) {
}
