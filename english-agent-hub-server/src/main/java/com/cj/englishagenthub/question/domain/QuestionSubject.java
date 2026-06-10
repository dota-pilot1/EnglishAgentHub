package com.cj.englishagenthub.question.domain;

public enum QuestionSubject {
    math,
    korean_history,
    english,

    // Legacy PoC subjects. Keep these so existing local rows continue to deserialize.
    elementary_math,
    algebra,
    common_sense
}
