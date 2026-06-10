package com.cj.englishagenthub.question.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private QuestionSubject subject;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 100)
    private String topic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuestionDifficulty difficulty;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "question_choices", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "choice", length = 500)
    private List<String> choices = new ArrayList<>();

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String explanation;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "question_keywords", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "keyword", length = 100)
    private List<String> keywords = new ArrayList<>();

    @Column(nullable = false, columnDefinition = "TEXT")
    private String embeddingText;

    @Column(name = "embedding_text_hash", length = 64)
    private String embeddingTextHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "embedding_status", nullable = false, columnDefinition = "varchar(20)")
    private EmbeddingStatus embeddingStatus = EmbeddingStatus.PENDING;

    @Column(name = "embedding_model", length = 50)
    private String embeddingModel;

    @Column(name = "embedded_at")
    private Instant embeddedAt;

    @Column(name = "embedding_error", columnDefinition = "TEXT")
    private String embeddingError;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static Question create(
            QuestionSubject subject,
            String category,
            String topic,
            QuestionDifficulty difficulty,
            String question,
            List<String> choices,
            String answer,
            String explanation,
            List<String> keywords,
            String embeddingText
    ) {
        Question q = new Question();
        q.apply(subject, category, topic, difficulty, question, choices, answer, explanation, keywords, embeddingText);
        return q;
    }

    public void update(
            QuestionSubject subject,
            String category,
            String topic,
            QuestionDifficulty difficulty,
            String question,
            List<String> choices,
            String answer,
            String explanation,
            List<String> keywords,
            String embeddingText
    ) {
        apply(subject, category, topic, difficulty, question, choices, answer, explanation, keywords, embeddingText);
    }

    private void apply(
            QuestionSubject subject,
            String category,
            String topic,
            QuestionDifficulty difficulty,
            String question,
            List<String> choices,
            String answer,
            String explanation,
            List<String> keywords,
            String embeddingText
    ) {
        this.subject = subject;
        this.category = category;
        this.topic = topic;
        this.difficulty = difficulty;
        this.question = question;
        this.choices = normalizeList(choices);
        this.answer = answer;
        this.explanation = explanation;
        this.keywords = normalizeList(keywords);
        this.embeddingText = StringUtils.hasText(embeddingText)
                ? embeddingText.trim()
                : composeEmbeddingText(subject, category, topic, difficulty, question, answer, explanation, this.keywords);
        String newHash = sha256(this.embeddingText);
        if (!newHash.equals(this.embeddingTextHash)) {
            this.embeddingTextHash = newHash;
            this.embeddingStatus = EmbeddingStatus.PENDING;
            this.embeddedAt = null;
            this.embeddingError = null;
        }
    }

    public void markEmbedded(String model) {
        this.embeddingStatus = EmbeddingStatus.COMPLETED;
        this.embeddingModel = model;
        this.embeddedAt = Instant.now();
        this.embeddingError = null;
    }

    public void markFailed(String error) {
        this.embeddingStatus = EmbeddingStatus.FAILED;
        this.embeddingError = error == null ? null : error.substring(0, Math.min(error.length(), 2000));
    }

    private static String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public static String composeEmbeddingText(
            QuestionSubject subject,
            String category,
            String topic,
            QuestionDifficulty difficulty,
            String question,
            String answer,
            String explanation,
            List<String> keywords
    ) {
        return String.join("\n",
                "과목: " + subjectLabel(subject),
                "카테고리: " + safe(category),
                "주제: " + safe(topic),
                "난이도: " + difficultyLabel(difficulty),
                "문제: " + safe(question),
                "정답: " + safe(answer),
                "해설: " + safe(explanation),
                "키워드: " + String.join(", ", normalizeList(keywords))
        );
    }

    private static List<String> normalizeList(List<String> values) {
        if (values == null) return new ArrayList<>();
        return new ArrayList<>(values.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .toList());
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private static String subjectLabel(QuestionSubject subject) {
        if (subject == null) return "";
        return switch (subject) {
            case math, elementary_math, algebra -> "수학";
            case korean_history, common_sense -> "한국사";
            case english -> "영어";
        };
    }

    private static String difficultyLabel(QuestionDifficulty difficulty) {
        if (difficulty == null) return "";
        return switch (difficulty) {
            case easy -> "하";
            case medium -> "중";
            case hard -> "상";
        };
    }
}
