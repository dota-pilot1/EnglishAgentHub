package com.cj.englishagenthub.character.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CharacterUpsertRequest(
        @NotBlank @Size(max = 100) String title,
        @Size(max = 100) String subtitle,
        @Size(max = 500) String description,
        @Size(max = 50) String level,
        @Size(max = 200) String sessionGoal,
        List<@Size(max = 100) String> skills,
        List<@Size(max = 500) String> starterPrompts,
        @Size(max = 4000) String style,
        @Size(max = 4000) String scenario,
        @Size(max = 4000) String character,
        @Size(max = 4000) String knowledge,
        @Size(max = 4000) String news,
        @Size(max = 4000) String schedule
) {
}
