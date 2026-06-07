package com.cj.englishagenthub.ai.presentation;

import com.cj.englishagenthub.ai.application.AgentResolver;
import com.cj.englishagenthub.ai.presentation.dto.LearningAgentResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
@Tag(name = "Learning Agents", description = "영어 학습 에이전트 (기본 + 공유 캐릭터)")
public class LearningAgentController {

    private final AgentResolver agentResolver;

    @GetMapping
    public List<LearningAgentResponse> list() {
        return agentResolver.listAll();
    }

    @GetMapping("/{agentId}")
    public LearningAgentResponse get(@PathVariable String agentId) {
        return agentResolver.resolveResponse(agentId);
    }
}
