package com.cj.englishagenthub.question.application;

import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import com.cj.englishagenthub.question.domain.Question;
import com.cj.englishagenthub.question.domain.QuestionDifficulty;
import com.cj.englishagenthub.question.domain.QuestionSubject;
import com.cj.englishagenthub.question.infrastructure.QuestionRepository;
import com.cj.englishagenthub.question.presentation.dto.QuestionResponse;
import com.cj.englishagenthub.question.presentation.dto.QuestionUpsertRequest;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;

    @Transactional(readOnly = true)
    public List<QuestionResponse> list(
            QuestionSubject subject,
            QuestionDifficulty difficulty,
            String category,
            String topic,
            String keyword
    ) {
        Specification<Question> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (subject != null) {
                if (subject == QuestionSubject.math) {
                    predicates.add(root.get("subject").in(QuestionSubject.math, QuestionSubject.elementary_math, QuestionSubject.algebra));
                } else if (subject == QuestionSubject.korean_history) {
                    predicates.add(root.get("subject").in(QuestionSubject.korean_history, QuestionSubject.common_sense));
                } else {
                    predicates.add(cb.equal(root.get("subject"), subject));
                }
            }
            if (difficulty != null) predicates.add(cb.equal(root.get("difficulty"), difficulty));
            if (StringUtils.hasText(category)) {
                predicates.add(cb.like(cb.lower(root.get("category")), contains(category)));
            }
            if (StringUtils.hasText(topic)) {
                predicates.add(cb.like(cb.lower(root.get("topic")), contains(topic)));
            }
            if (StringUtils.hasText(keyword)) {
                String pattern = contains(keyword);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("question")), pattern),
                        cb.like(cb.lower(root.get("answer")), pattern),
                        cb.like(cb.lower(root.get("explanation")), pattern),
                        cb.like(cb.lower(root.get("embeddingText")), pattern)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        return questionRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(QuestionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public QuestionResponse get(String id) {
        return QuestionResponse.from(loadOrThrow(id));
    }

    @Transactional
    public QuestionResponse create(QuestionUpsertRequest req) {
        Question saved = questionRepository.save(Question.create(
                req.subject(),
                req.category(),
                req.topic(),
                req.difficulty(),
                req.question(),
                req.choices(),
                req.answer(),
                req.explanation(),
                req.keywords(),
                req.embeddingText()
        ));
        return QuestionResponse.from(saved);
    }

    @Transactional
    public QuestionResponse update(String id, QuestionUpsertRequest req) {
        Question target = loadOrThrow(id);
        target.update(
                req.subject(),
                req.category(),
                req.topic(),
                req.difficulty(),
                req.question(),
                req.choices(),
                req.answer(),
                req.explanation(),
                req.keywords(),
                req.embeddingText()
        );
        return QuestionResponse.from(target);
    }

    @Transactional
    public void delete(String id) {
        Question target = loadOrThrow(id);
        questionRepository.delete(target);
    }

    private Question loadOrThrow(String id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUESTION_NOT_FOUND));
    }

    private String contains(String value) {
        return "%" + value.trim().toLowerCase() + "%";
    }
}
