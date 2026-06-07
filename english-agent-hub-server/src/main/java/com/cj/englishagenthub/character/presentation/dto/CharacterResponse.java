package com.cj.englishagenthub.character.presentation.dto;

import com.cj.englishagenthub.character.domain.Character;

import java.util.List;

/**
 * 채팅용 에이전트 응답과 동일한 모양 + 캐릭터 전용 메타(편집 가능 여부, 작성자).
 * 프론트는 enum 기본 에이전트와 같은 카드로 렌더할 수 있다.
 */
public record CharacterResponse(
        String id,
        String title,
        String subtitle,
        String description,
        String level,
        String sessionGoal,
        List<String> skills,
        List<String> starterPrompts,
        String systemPrompt,
        // 캐릭터 전용
        boolean custom,
        Long createdById,
        String createdByName,
        // 편집 폼 재구성용
        String style,
        String scenario,
        String character,
        String knowledge,
        String news,
        String schedule
) {
    public static CharacterResponse from(Character c) {
        return new CharacterResponse(
                String.valueOf(c.getId()),
                c.getTitle(),
                c.getSubtitle(),
                c.getDescription(),
                c.getLevel(),
                c.getSessionGoal(),
                c.getSkills(),
                c.getStarterPrompts(),
                c.composedSystemPrompt(),
                true,
                c.getCreatedBy() == null ? null : c.getCreatedBy().getId(),
                c.getCreatedBy() == null ? null : c.getCreatedBy().getUsername(),
                c.getStyle(),
                c.getScenario(),
                c.getCharacter(),
                c.getKnowledge(),
                c.getNews(),
                c.getSchedule()
        );
    }
}
