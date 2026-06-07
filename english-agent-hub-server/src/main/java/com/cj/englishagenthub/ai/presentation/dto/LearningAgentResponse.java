package com.cj.englishagenthub.ai.presentation.dto;

import com.cj.englishagenthub.ai.domain.LearningAgentType;

import java.util.List;

public record LearningAgentResponse(
        String id,
        String title,
        String subtitle,
        String description,
        String level,
        String sessionGoal,
        List<String> skills,
        List<String> starterPrompts
) {
    public static LearningAgentResponse from(LearningAgentType type) {
        return new LearningAgentResponse(
                type.id(),
                type.title(),
                type.subtitle(),
                type.description(),
                type.level(),
                type.sessionGoal(),
                type.skills(),
                type.starterPrompts()
        );
    }
}
