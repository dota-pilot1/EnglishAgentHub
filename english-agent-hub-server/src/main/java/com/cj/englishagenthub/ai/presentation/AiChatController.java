package com.cj.englishagenthub.ai.presentation;

import com.cj.englishagenthub.ai.application.AiChatService;
import com.cj.englishagenthub.ai.presentation.dto.AiChatMessageRequest;
import com.cj.englishagenthub.ai.presentation.dto.AiChatMessageResponse;
import com.cj.englishagenthub.ai.presentation.dto.ExpressionFeedbackRequest;
import com.cj.englishagenthub.ai.presentation.dto.ExpressionFeedbackResponse;
import com.cj.englishagenthub.ai.presentation.dto.NewsResponse;
import com.cj.englishagenthub.ai.presentation.dto.SpeechRequest;
import com.cj.englishagenthub.ai.presentation.dto.TranscribeResponse;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToEnglishRequest;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToEnglishResponse;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToKoreanRequest;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToKoreanResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AI Chat", description = "Spring AI 기반 영어 학습 채팅")
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    @Operation(summary = "AI 텍스트 채팅")
    public AiChatMessageResponse chat(@Valid @RequestBody AiChatMessageRequest request) {
        return aiChatService.chat(request);
    }

    @PostMapping("/translate-to-english")
    @Operation(summary = "영어 학습용 한영 변환")
    public TranslateToEnglishResponse translateToEnglish(@Valid @RequestBody TranslateToEnglishRequest request) {
        return aiChatService.translateToEnglish(request);
    }

    @PostMapping("/translate-to-korean")
    @Operation(summary = "영어 학습용 영한 변환")
    public TranslateToKoreanResponse translateToKorean(@Valid @RequestBody TranslateToKoreanRequest request) {
        return aiChatService.translateToKorean(request);
    }

    @PostMapping("/expression-feedback")
    @Operation(summary = "자연스러운 영어 표현 피드백")
    public ExpressionFeedbackResponse expressionFeedback(@Valid @RequestBody ExpressionFeedbackRequest request) {
        return aiChatService.expressionFeedback(request);
    }

    @PostMapping(value = "/speech", produces = "audio/mpeg")
    @Operation(summary = "텍스트 음성 변환 (TTS)")
    public byte[] speech(@Valid @RequestBody SpeechRequest request) {
        return aiChatService.speech(request);
    }

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "음성 → 텍스트 (STT)")
    public TranscribeResponse transcribe(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "language", required = false) String language) {
        return aiChatService.transcribe(file, language);
    }

    @GetMapping("/news")
    @Operation(summary = "오늘의 뉴스 헤드라인")
    public NewsResponse news(@RequestParam(value = "lang", required = false) String lang) {
        return aiChatService.fetchNews(lang);
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "AI 텍스트 채팅 스트리밍")
    public SseEmitter chatStream(@Valid @RequestBody AiChatMessageRequest request) {
        SseEmitter emitter = new SseEmitter(120_000L);

        aiChatService.stream(request)
                .subscribe(
                        chunk -> sendChunk(emitter, chunk),
                        error -> sendErrorAndComplete(emitter, error),
                        emitter::complete
                );

        return emitter;
    }

    private void sendChunk(SseEmitter emitter, String chunk) {
        try {
            emitter.send(SseEmitter.event().data(chunk));
        } catch (IOException e) {
            emitter.complete();
        }
    }

    private void sendErrorAndComplete(SseEmitter emitter, Throwable error) {
        log.error("AI stream failed", error);
        try {
            emitter.send(SseEmitter.event()
                    .name("error")
                    .data("AI 요청 처리 중 오류가 발생했습니다."));
        } catch (IOException ignored) {
            // Client has already gone away.
        } finally {
            emitter.complete();
        }
    }
}
