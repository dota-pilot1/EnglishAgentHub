package com.cj.englishagenthub.ai.application;

import com.cj.englishagenthub.ai.domain.LearningAgentType;
import com.cj.englishagenthub.ai.presentation.dto.LearningAgentResponse;
import com.cj.englishagenthub.character.domain.Character;
import com.cj.englishagenthub.character.infrastructure.CharacterRepository;
import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * agentId 문자열을 받아 시스템 프롬프트 / 응답 DTO를 해석한다.
 * 우선순위: enum LearningAgentType → DB Character.
 */
@Component
@RequiredArgsConstructor
public class AgentResolver {

    private final CharacterRepository characterRepository;

    /** 채팅 호출용 시스템 프롬프트. instructionsOverride가 있으면 그걸 우선 사용. */
    public String resolveSystemPrompt(String agentId, String instructionsOverride) {
        if (StringUtils.hasText(instructionsOverride)) return instructionsOverride;

        LearningAgentType enumType = findEnum(agentId);
        if (enumType != null) return enumType.systemPrompt();

        Character custom = findCharacterByAgentId(agentId);
        if (custom != null) return custom.composedSystemPrompt();

        throw new BusinessException(ErrorCode.AI_AGENT_NOT_FOUND);
    }

    /** 한 건 응답. enum + DB 통합. */
    public LearningAgentResponse resolveResponse(String agentId) {
        LearningAgentType enumType = findEnum(agentId);
        if (enumType != null) return LearningAgentResponse.from(enumType);

        Character custom = findCharacterByAgentId(agentId);
        if (custom != null) return toResponse(custom);

        throw new BusinessException(ErrorCode.AI_AGENT_NOT_FOUND);
    }

    /** 목록: enum 3개 + DB 캐릭터 전부. */
    public List<LearningAgentResponse> listAll() {
        List<LearningAgentResponse> out = new ArrayList<>(Arrays.stream(LearningAgentType.values())
                .map(LearningAgentResponse::from)
                .toList());
        characterRepository.findAllByOrderByCreatedAtAsc()
                .forEach(c -> out.add(toResponse(c)));
        return out;
    }

    private LearningAgentType findEnum(String agentId) {
        if (!StringUtils.hasText(agentId)) return null;
        for (LearningAgentType t : LearningAgentType.values()) {
            if (t.id().equalsIgnoreCase(agentId)) return t;
        }
        return null;
    }

    private Character findCharacterByAgentId(String agentId) {
        if (!StringUtils.hasText(agentId)) return null;
        try {
            return characterRepository.findById(Long.parseLong(agentId)).orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LearningAgentResponse toResponse(Character c) {
        return new LearningAgentResponse(
                String.valueOf(c.getId()),
                c.getTitle(),
                c.getSubtitle(),
                c.getDescription(),
                c.getLevel(),
                c.getSessionGoal(),
                c.getSkills(),
                c.getStarterPrompts(),
                c.composedSystemPrompt()
        );
    }
}
