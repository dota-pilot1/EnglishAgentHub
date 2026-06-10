package com.cj.englishagenthub.question.application;

import com.cj.englishagenthub.question.domain.EmbeddingStatus;
import com.cj.englishagenthub.question.domain.Question;
import com.cj.englishagenthub.question.infrastructure.QuestionRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionEmbeddingService {

    private final QuestionRepository questionRepository;
    private final EmbeddingModel embeddingModel;
    private final EntityManager entityManager;

    @Value("${spring.ai.openai.embedding.options.model:text-embedding-3-small}")
    private String embeddingModelName;

    public record EmbeddingBatchResult(int picked, int completed, int failed, long stillPending) {}

    public record EmbeddingCounts(long pending, long completed, long failed) {}

    @Transactional(readOnly = true)
    public long countPending() {
        return questionRepository.countByEmbeddingStatus(EmbeddingStatus.PENDING)
                + questionRepository.countByEmbeddingStatus(EmbeddingStatus.FAILED);
    }

    @Transactional(readOnly = true)
    public EmbeddingCounts counts() {
        return new EmbeddingCounts(
                questionRepository.countByEmbeddingStatus(EmbeddingStatus.PENDING),
                questionRepository.countByEmbeddingStatus(EmbeddingStatus.COMPLETED),
                questionRepository.countByEmbeddingStatus(EmbeddingStatus.FAILED)
        );
    }

    @Transactional
    public EmbeddingBatchResult embedPending(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        List<Question> targets = questionRepository.findByEmbeddingStatusInOrderByCreatedAtAsc(
                List.of(EmbeddingStatus.PENDING, EmbeddingStatus.FAILED),
                PageRequest.of(0, safeLimit)
        );
        if (targets.isEmpty()) {
            return new EmbeddingBatchResult(0, 0, 0, 0);
        }

        List<String> texts = targets.stream().map(Question::getEmbeddingText).toList();

        EmbeddingResponse response;
        try {
            response = embeddingModel.embedForResponse(texts);
        } catch (Exception e) {
            log.error("Embedding batch failed for {} questions", targets.size(), e);
            String msg = e.getMessage();
            for (Question q : targets) q.markFailed(msg);
            return new EmbeddingBatchResult(targets.size(), 0, targets.size(), countPending());
        }

        int completed = 0;
        int failed = 0;
        for (int i = 0; i < targets.size(); i++) {
            Question q = targets.get(i);
            try {
                float[] vector = response.getResults().get(i).getOutput();
                entityManager.createNativeQuery(
                                "UPDATE questions SET embedding_vector = CAST(:v AS vector) WHERE id = :id")
                        .setParameter("v", toVectorLiteral(vector))
                        .setParameter("id", q.getId())
                        .executeUpdate();
                q.markEmbedded(embeddingModelName);
                completed++;
            } catch (Exception e) {
                log.warn("Embedding write failed for question {}", q.getId(), e);
                q.markFailed(e.getMessage());
                failed++;
            }
        }
        return new EmbeddingBatchResult(targets.size(), completed, failed, countPending());
    }

    private static String toVectorLiteral(float[] vector) {
        StringBuilder sb = new StringBuilder(vector.length * 10);
        sb.append('[');
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(vector[i]);
        }
        sb.append(']');
        return sb.toString();
    }
}
