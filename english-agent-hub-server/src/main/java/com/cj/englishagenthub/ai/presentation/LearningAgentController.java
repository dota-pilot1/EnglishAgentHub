package com.cj.englishagenthub.ai.presentation;

import com.cj.englishagenthub.ai.domain.LearningAgentType;
import com.cj.englishagenthub.ai.presentation.dto.LearningAgentResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/agents")
@Tag(name = "Learning Agents", description = "영어 학습 에이전트")
public class LearningAgentController {

    @GetMapping
    public List<LearningAgentResponse> list() {
        return Arrays.stream(LearningAgentType.values())
                .map(LearningAgentResponse::from)
                .toList();
    }

    @GetMapping("/{agentId}")
    public LearningAgentResponse get(@PathVariable String agentId) {
        return LearningAgentResponse.from(LearningAgentType.fromId(agentId));
    }
}
