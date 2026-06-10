package com.cj.englishagenthub.config;

import com.cj.englishagenthub.question.domain.Question;
import com.cj.englishagenthub.question.domain.QuestionDifficulty;
import com.cj.englishagenthub.question.domain.QuestionSubject;
import com.cj.englishagenthub.question.infrastructure.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@Order(5)
@RequiredArgsConstructor
public class QuestionSeeder implements ApplicationRunner {

    private final QuestionRepository questionRepository;

    private record QuestionDef(
            QuestionSubject subject,
            String category,
            String topic,
            QuestionDifficulty difficulty,
            String question,
            List<String> choices,
            String answer,
            String explanation,
            List<String> keywords
    ) {
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<QuestionDef> seeds = List.of(
                q(QuestionSubject.math, "산수", "덧셈", QuestionDifficulty.easy,
                        "23 + 48 = ?", null, "71", "23과 48을 더하면 71입니다.",
                        List.of("초등 산수", "덧셈", "받아올림")),
                q(QuestionSubject.math, "산수", "뺄셈", QuestionDifficulty.easy,
                        "95 - 37 = ?", null, "58", "95에서 37을 빼면 58입니다.",
                        List.of("초등 산수", "뺄셈", "받아내림")),
                q(QuestionSubject.math, "산수", "곱셈", QuestionDifficulty.easy,
                        "12 x 7 = ?", null, "84", "12를 7번 더하면 84입니다.",
                        List.of("초등 산수", "곱셈", "구구단")),
                q(QuestionSubject.math, "산수", "나눗셈", QuestionDifficulty.easy,
                        "72 ÷ 8 = ?", null, "9", "8 x 9 = 72이므로 몫은 9입니다.",
                        List.of("초등 산수", "나눗셈", "몫")),
                q(QuestionSubject.math, "산수", "분수", QuestionDifficulty.medium,
                        "1/2 + 1/3 = ?", null, "5/6", "공통분모 6으로 바꾸면 3/6 + 2/6 = 5/6입니다.",
                        List.of("초등 산수", "분수", "통분")),
                q(QuestionSubject.math, "산수", "소수", QuestionDifficulty.medium,
                        "3.5 + 2.75 = ?", null, "6.25", "소수점을 맞춰 더하면 6.25입니다.",
                        List.of("초등 산수", "소수", "소수 덧셈")),

                q(QuestionSubject.math, "이차방정식", "인수분해", QuestionDifficulty.medium,
                        "x² - 5x + 6 = 0의 해를 구하시오.", null, "x = 2, 3",
                        "인수분해하면 (x-2)(x-3)=0이므로 해는 2와 3입니다.",
                        List.of("이차방정식", "인수분해", "근")),
                q(QuestionSubject.math, "이차방정식", "인수분해", QuestionDifficulty.medium,
                        "x² + 2x - 8 = 0의 해를 구하시오.", null, "x = 2, -4",
                        "인수분해하면 (x-2)(x+4)=0이므로 해는 2와 -4입니다.",
                        List.of("이차방정식", "인수분해", "근")),
                q(QuestionSubject.math, "이차방정식", "근의 공식", QuestionDifficulty.medium,
                        "2x² - 3x - 2 = 0의 해를 근의 공식으로 구하시오.", null, "x = 2, -1/2",
                        "근의 공식에 a=2, b=-3, c=-2를 대입하면 x=(3±5)/4입니다.",
                        List.of("이차방정식", "근의 공식", "계수")),
                q(QuestionSubject.math, "이차방정식", "완전제곱식", QuestionDifficulty.medium,
                        "x² + 6x + 9 = 0의 해를 구하시오.", null, "x = -3",
                        "(x+3)²=0이므로 중근 x=-3입니다.",
                        List.of("이차방정식", "완전제곱식", "중근")),
                q(QuestionSubject.math, "이차방정식", "판별식", QuestionDifficulty.hard,
                        "x² - 4x + k = 0이 중근을 가질 때 k의 값을 구하시오.", null, "k = 4",
                        "중근 조건은 판별식 b²-4ac=0입니다. 16-4k=0이므로 k=4입니다.",
                        List.of("이차방정식", "판별식", "중근")),
                q(QuestionSubject.math, "이차방정식", "근과 계수 관계", QuestionDifficulty.hard,
                        "방정식 x² - 7x + 10 = 0의 두 근의 합과 곱을 구하시오.", null, "합 7, 곱 10",
                        "x²+bx+c=0에서 두 근의 합은 -b, 곱은 c입니다.",
                        List.of("이차방정식", "근과 계수 관계", "근의 합", "근의 곱")),

                q(QuestionSubject.korean_history, "조선시대", "훈민정음", QuestionDifficulty.easy,
                        "세종대왕이 창제한 문자는?", List.of("한글", "한자", "가나", "라틴 문자"), "한글",
                        "세종대왕은 훈민정음을 창제했고 오늘날 한글로 불립니다.",
                        List.of("한국사", "조선시대", "세종대왕", "한글", "훈민정음")),
                q(QuestionSubject.korean_history, "삼국시대", "삼국통일", QuestionDifficulty.medium,
                        "신라가 삼국 통일 과정에서 연합한 나라는?", List.of("당", "수", "명", "청"), "당",
                        "신라는 당과 연합하여 백제와 고구려를 멸망시킨 뒤 삼국 통일을 추진했습니다.",
                        List.of("한국사", "삼국시대", "신라", "당", "삼국통일")),
                q(QuestionSubject.korean_history, "고려시대", "대외항쟁", QuestionDifficulty.medium,
                        "고려 시대 몽골 침입에 맞서 강화도로 천도한 왕은?", null, "고종",
                        "고려 고종 때 몽골 침입에 대응해 수도를 강화도로 옮겼습니다.",
                        List.of("한국사", "고려시대", "몽골 침입", "강화도", "고종")),
                q(QuestionSubject.korean_history, "조선시대", "임진왜란", QuestionDifficulty.medium,
                        "임진왜란 때 한산도 대첩을 이끈 장군은?", List.of("이순신", "권율", "김유신", "강감찬"), "이순신",
                        "이순신은 한산도 대첩에서 학익진 전술로 일본 수군을 격파했습니다.",
                        List.of("한국사", "조선시대", "임진왜란", "이순신", "한산도 대첩")),
                q(QuestionSubject.korean_history, "근현대사", "독립운동", QuestionDifficulty.medium,
                        "1919년 전국적으로 일어난 독립운동은?", List.of("3·1 운동", "6월 민주 항쟁", "갑신정변", "동학 농민 운동"), "3·1 운동",
                        "3·1 운동은 1919년 일제 강점기에 전국적으로 전개된 독립운동입니다.",
                        List.of("한국사", "근현대사", "독립운동", "3·1 운동")),

                q(QuestionSubject.english, "중등 영어", "단어뜻", QuestionDifficulty.easy,
                        "다음 단어의 뜻은? \"increase\"", List.of("증가하다", "감소하다", "멈추다", "빌리다"), "증가하다",
                        "increase는 수나 양이 늘어나다, 증가하다는 뜻입니다.",
                        List.of("영어", "중등 영어", "단어", "뜻", "increase")),
                q(QuestionSubject.english, "중등 영어", "문장해석", QuestionDifficulty.easy,
                        "He is interested in science. 해석하시오.", null, "그는 과학에 관심이 있다.",
                        "be interested in은 '~에 관심이 있다'라는 뜻입니다.",
                        List.of("영어", "중등 영어", "문장 해석", "be interested in", "science")),
                q(QuestionSubject.english, "중등 영어", "문법기초", QuestionDifficulty.medium,
                        "She usually ____ breakfast at 7 a.m.", List.of("has", "have", "having", "had"), "has",
                        "주어 She는 3인칭 단수이고 현재 습관이므로 has가 맞습니다.",
                        List.of("영어", "중등 영어", "현재시제", "3인칭 단수")),
                q(QuestionSubject.english, "고등 영어", "어휘추론", QuestionDifficulty.medium,
                        "다음 단어와 뜻이 가장 비슷한 것은? \"begin\"", List.of("start", "finish", "close", "forget"), "start",
                        "begin과 start는 둘 다 시작하다는 뜻입니다.",
                        List.of("영어", "고등 영어", "어휘추론", "begin", "start")),
                q(QuestionSubject.english, "중등 영어", "내용일치", QuestionDifficulty.medium,
                        "Tom walks to school every day. How does Tom go to school?", List.of("By bus", "On foot", "By bike", "By train"), "On foot",
                        "walks to school은 걸어서 학교에 간다는 뜻입니다.",
                        List.of("영어", "중등 영어", "내용일치", "walk", "school"))
        );

        int created = 0;
        for (QuestionDef seed : seeds) {
            if (questionRepository.existsBySubjectAndTopicAndQuestion(seed.subject(), seed.topic(), seed.question())) {
                continue;
            }
            var existing = questionRepository.findFirstByQuestion(seed.question());
            if (existing.isPresent()) {
                existing.get().update(
                        seed.subject(),
                        seed.category(),
                        seed.topic(),
                        seed.difficulty(),
                        seed.question(),
                        seed.choices(),
                        seed.answer(),
                        seed.explanation(),
                        seed.keywords(),
                        null
                );
                continue;
            }
            questionRepository.save(Question.create(
                    seed.subject(),
                    seed.category(),
                    seed.topic(),
                    seed.difficulty(),
                    seed.question(),
                    seed.choices(),
                    seed.answer(),
                    seed.explanation(),
                    seed.keywords(),
                    null
            ));
            created++;
        }
        if (created > 0) log.info("Seeded {} questions", created);
    }

    private QuestionDef q(
            QuestionSubject subject,
            String category,
            String topic,
            QuestionDifficulty difficulty,
            String question,
            List<String> choices,
            String answer,
            String explanation,
            List<String> keywords
    ) {
        return new QuestionDef(subject, category, topic, difficulty, question, choices, answer, explanation, keywords);
    }
}
