package com.cj.englishagenthub.question.infrastructure;

import com.cj.englishagenthub.question.domain.EmbeddingStatus;
import com.cj.englishagenthub.question.domain.Question;
import com.cj.englishagenthub.question.domain.QuestionDifficulty;
import com.cj.englishagenthub.question.domain.QuestionSubject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface QuestionRepository extends JpaRepository<Question, String>, JpaSpecificationExecutor<Question> {
    boolean existsBySubjectAndTopicAndQuestion(QuestionSubject subject, String topic, String question);
    long countBySubjectAndDifficulty(QuestionSubject subject, QuestionDifficulty difficulty);
    Optional<Question> findFirstByQuestion(String question);
    List<Question> findByEmbeddingStatusInOrderByCreatedAtAsc(Collection<EmbeddingStatus> statuses, Pageable pageable);
    long countByEmbeddingStatus(EmbeddingStatus status);
}
