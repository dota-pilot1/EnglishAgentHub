package com.cj.englishagenthub.character.domain;

import com.cj.englishagenthub.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * 사용자가 만든 공유 챗봇 캐릭터.
 * 메타 정보(이름/레벨/스킬/스타터) + 5필드(style/character/knowledge/news/schedule)로
 * 시스템 프롬프트가 동적으로 구성된다.
 */
@Entity
@Table(name = "characters")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Character {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 100)
    private String subtitle;

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    private String level;

    @Column(name = "session_goal", length = 200)
    private String sessionGoal;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "character_skills", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "skill", length = 100)
    private List<String> skills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "character_starter_prompts", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "prompt", length = 500)
    private List<String> starterPrompts = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String style;

    @Column(columnDefinition = "TEXT")
    private String scenario;

    @Column(name = "character_info", columnDefinition = "TEXT")
    private String character;

    @Column(columnDefinition = "TEXT")
    private String knowledge;

    @Column(columnDefinition = "TEXT")
    private String news;

    @Column(columnDefinition = "TEXT")
    private String schedule;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static Character create(
            User createdBy,
            String title,
            String subtitle,
            String description,
            String level,
            String sessionGoal,
            List<String> skills,
            List<String> starterPrompts,
            String style,
            String scenario,
            String character,
            String knowledge,
            String news,
            String schedule
    ) {
        Character c = new Character();
        c.createdBy = createdBy;
        c.apply(title, subtitle, description, level, sessionGoal, skills, starterPrompts,
                style, scenario, character, knowledge, news, schedule);
        return c;
    }

    public void update(
            String title,
            String subtitle,
            String description,
            String level,
            String sessionGoal,
            List<String> skills,
            List<String> starterPrompts,
            String style,
            String scenario,
            String character,
            String knowledge,
            String news,
            String schedule
    ) {
        apply(title, subtitle, description, level, sessionGoal, skills, starterPrompts,
                style, scenario, character, knowledge, news, schedule);
    }

    private void apply(
            String title,
            String subtitle,
            String description,
            String level,
            String sessionGoal,
            List<String> skills,
            List<String> starterPrompts,
            String style,
            String scenario,
            String character,
            String knowledge,
            String news,
            String schedule
    ) {
        this.title = title;
        this.subtitle = subtitle;
        this.description = description;
        this.level = level;
        this.sessionGoal = sessionGoal;
        this.skills = skills == null ? new ArrayList<>() : new ArrayList<>(skills);
        this.starterPrompts = starterPrompts == null ? new ArrayList<>() : new ArrayList<>(starterPrompts);
        this.style = style;
        this.scenario = scenario;
        this.character = character;
        this.knowledge = knowledge;
        this.news = news;
        this.schedule = schedule;
    }

    public boolean isOwnedBy(Long userId) {
        return createdBy != null && createdBy.getId().equals(userId);
    }

    /** 5필드를 합쳐 시스템 프롬프트 생성. 모두 비어있으면 기본 안내 문구. */
    public String composedSystemPrompt() {
        List<String> parts = new ArrayList<>();
        if (StringUtils.hasText(style)) parts.add("[Conversation style]\n" + style.trim());
        if (StringUtils.hasText(scenario)) parts.add("[Scenario / procedure to follow]\n" + scenario.trim());
        if (StringUtils.hasText(character)) parts.add("[Character]\n" + character.trim());
        if (StringUtils.hasText(knowledge)) parts.add("[Background knowledge]\n" + knowledge.trim());
        if (StringUtils.hasText(news)) parts.add("[Today's news to bring up naturally]\n" + news.trim());
        if (StringUtils.hasText(schedule)) parts.add("[Your (the character's) recent updates to mention naturally]\n" + schedule.trim());
        if (parts.isEmpty()) {
            return "You are a friendly English conversation partner for a Korean learner. " +
                    "Reply with short natural English (1-3 sentences) and ask one follow-up question.";
        }
        return String.join("\n\n", parts);
    }
}
