package com.cj.englishagenthub.ai.domain;

import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;

import java.util.Arrays;
import java.util.List;

public enum LearningAgentType {
    DEBATE(
            "debate",
            "토론 봇",
            "Article Debate",
            "기사 내용을 읽고 찬반 의견, 근거, 반박 표현을 연습합니다.",
            "B1-B2",
            "뉴스 기사 요약 후 3분 영어 토론",
            List.of("Opinion", "Evidence", "Rebuttal"),
            List.of(
                    "Summarize this article in two sentences.",
                    "Do you agree with the author's point?",
                    "Give me one counterargument."
            ),
            "You are Article Debate Bot for Korean English learners. Help the learner discuss an article in English. " +
                    "Keep responses concise. Ask one follow-up question at a time. Correct only the most important issue. " +
                    "Use this flow when possible: article summary, opinion, evidence, counterargument, improved sentence."
    ),
    ROLEPLAY(
            "roleplay",
            "상황극 봇",
            "Scenario Roleplay",
            "공항, 카페, 면접 같은 실제 상황에서 자연스러운 대화를 연습합니다.",
            "A2-B1",
            "상황별 필수 표현으로 5턴 대화 완성",
            List.of("Small Talk", "Requests", "Problem Solving"),
            List.of(
                    "Let's practice ordering coffee.",
                    "I want to check in at the airport.",
                    "Start a job interview roleplay."
            ),
            "You are Scenario Roleplay Bot for Korean English learners. Play the other person in realistic everyday scenarios. " +
                    "Keep the roleplay moving with natural short turns. If the learner struggles, offer one useful phrase and continue."
    ),
    QUIZ(
            "quiz",
            "퀴즈 봇",
            "Expression Quiz",
            "짧은 문제를 풀면서 단어, 문법, 표현을 빠르게 점검합니다.",
            "A1-B2",
            "10문항 풀이 후 약점 표현 복습",
            List.of("Vocabulary", "Grammar", "Recall"),
            List.of(
                    "Give me beginner travel English questions.",
                    "Quiz me on phrasal verbs.",
                    "Make a quiz from my mistakes."
            ),
            "You are Expression Quiz Bot for Korean English learners. Ask one quiz question at a time, wait for the answer, " +
                    "then briefly explain the correction and continue with the next question."
    );

    private final String id;
    private final String title;
    private final String subtitle;
    private final String description;
    private final String level;
    private final String sessionGoal;
    private final List<String> skills;
    private final List<String> starterPrompts;
    private final String systemPrompt;

    LearningAgentType(
            String id,
            String title,
            String subtitle,
            String description,
            String level,
            String sessionGoal,
            List<String> skills,
            List<String> starterPrompts,
            String systemPrompt
    ) {
        this.id = id;
        this.title = title;
        this.subtitle = subtitle;
        this.description = description;
        this.level = level;
        this.sessionGoal = sessionGoal;
        this.skills = skills;
        this.starterPrompts = starterPrompts;
        this.systemPrompt = systemPrompt;
    }

    public String id() {
        return id;
    }

    public String title() {
        return title;
    }

    public String subtitle() {
        return subtitle;
    }

    public String description() {
        return description;
    }

    public String level() {
        return level;
    }

    public String sessionGoal() {
        return sessionGoal;
    }

    public List<String> skills() {
        return skills;
    }

    public List<String> starterPrompts() {
        return starterPrompts;
    }

    public String systemPrompt() {
        return systemPrompt;
    }

    public static LearningAgentType fromId(String id) {
        return Arrays.stream(values())
                .filter(type -> type.id.equals(id))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.AI_AGENT_NOT_FOUND));
    }
}
