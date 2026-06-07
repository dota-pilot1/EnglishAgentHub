package com.cj.englishagenthub.ai.application;

import com.cj.englishagenthub.ai.infrastructure.OpenAiClientResolver;
import com.cj.englishagenthub.ai.presentation.dto.AiChatMessageRequest;
import com.cj.englishagenthub.ai.presentation.dto.AiChatMessageResponse;
import com.cj.englishagenthub.ai.presentation.dto.ChatTurn;
import com.cj.englishagenthub.ai.presentation.dto.ChunkAnalysisRequest;
import com.cj.englishagenthub.ai.presentation.dto.ChunkAnalysisResponse;
import com.cj.englishagenthub.ai.presentation.dto.ExpressionFeedbackRequest;
import com.cj.englishagenthub.ai.presentation.dto.SuggestReplyRequest;
import com.cj.englishagenthub.ai.presentation.dto.SuggestReplyResponse;
import com.cj.englishagenthub.ai.presentation.dto.ExpressionFeedbackResponse;
import com.cj.englishagenthub.ai.presentation.dto.NewsResponse;
import com.cj.englishagenthub.ai.presentation.dto.SpeechRequest;
import com.cj.englishagenthub.ai.presentation.dto.TranscribeResponse;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToEnglishRequest;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToEnglishResponse;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToKoreanRequest;
import com.cj.englishagenthub.ai.presentation.dto.TranslateToKoreanResponse;
import com.cj.englishagenthub.common.exception.BusinessException;
import com.cj.englishagenthub.common.exception.ErrorCode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatService {

    private final OpenAiClientResolver openAiClientResolver;
    private final AgentResolver agentResolver;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${openai.translation.model:gpt-5-nano}")
    private String translationModel;

    @Value("${openai.transcribe.model:gpt-4o-mini-transcribe}")
    private String transcribeModel;

    @Value("${openai.tts.model:gpt-4o-mini-tts}")
    private String ttsModel;

    @Value("${openai.tts.voice:alloy}")
    private String ttsVoice;

    public AiChatMessageResponse chat(AiChatMessageRequest request) {
        requireOpenAiApiKey();

        String systemPrompt = agentResolver.resolveSystemPrompt(request.agentId(), request.instructions());
        ChatClient.Builder builder = requireChatClientBuilder();

        String content = builder.build()
                .prompt()
                .system(systemPrompt)
                .messages(buildConversation(request))
                .call()
                .content();

        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        return new AiChatMessageResponse(request.agentId(), content, Instant.now());
    }

    public Flux<String> stream(AiChatMessageRequest request) {
        requireOpenAiApiKey();

        String systemPrompt = agentResolver.resolveSystemPrompt(request.agentId(), request.instructions());
        ChatClient.Builder builder = requireChatClientBuilder();

        return builder.build()
                .prompt()
                .system(systemPrompt)
                .messages(buildConversation(request))
                .stream()
                .content()
                .filter(StringUtils::hasText);
    }

    /**
     * 대화 history(과거 턴들) + 현재 user 메시지를 ChatClient에 넘길 Message 리스트로 변환.
     * history가 없으면 단일 user 메시지만 반환.
     */
    private List<Message> buildConversation(AiChatMessageRequest request) {
        List<Message> messages = new ArrayList<>();
        if (request.history() != null) {
            for (ChatTurn t : request.history()) {
                if (t == null || !StringUtils.hasText(t.content())) continue;
                String role = t.role() == null ? "" : t.role().toLowerCase();
                if ("assistant".equals(role) || "agent".equals(role)) {
                    messages.add(new AssistantMessage(t.content()));
                } else {
                    messages.add(new UserMessage(t.content()));
                }
            }
        }
        messages.add(new UserMessage(request.message()));
        return messages;
    }

    public TranslateToEnglishResponse translateToEnglish(TranslateToEnglishRequest request) {
        requireOpenAiApiKey();

        ChatClient.Builder builder = requireChatClientBuilder();

        String content = translateWithRetry(() -> builder.build()
                .prompt()
                .options(translationOptions())
                .system("Translate the user's message into natural English for an English learning chat. If it is already English, lightly clean up obvious speech recognition noise. Return only the English sentence, with no explanation.")
                .user(request.text())
                .call()
                .content());

        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        return new TranslateToEnglishResponse(content.trim());
    }

    public TranslateToKoreanResponse translateToKorean(TranslateToKoreanRequest request) {
        requireOpenAiApiKey();

        ChatClient.Builder builder = requireChatClientBuilder();

        String content = translateWithRetry(() -> builder.build()
                .prompt()
                .options(translationOptions())
                .system("Translate the user's English message into natural Korean for an English learning chat. Preserve the meaning and tone. Return only the Korean translation, with no explanation.")
                .user(request.text())
                .call()
                .content());

        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        return new TranslateToKoreanResponse(content.trim());
    }

    public ExpressionFeedbackResponse expressionFeedback(ExpressionFeedbackRequest request) {
        requireOpenAiApiKey();

        ChatClient.Builder builder = requireChatClientBuilder();

        String content = builder.build()
                .prompt()
                .options(translationOptions(384))
                .system("""
                        You are an English expression coach for Korean learners.
                        The user may provide Korean or English.
                        If the user provides Korean, first infer what they want to say and provide natural English expressions.
                        If the user provides English, explain whether it sounds natural and improve it if needed.
                        Provide 2 or 3 natural English alternatives when helpful.
                        Explain briefly in Korean.
                        Keep the response concise and practical.
                        Use this format:
                        자연스러운 표현:
                        - ...

                        왜 더 자연스러운가:
                        ...

                        바로 쓰기:
                        ...
                        """)
                .user(request.text())
                .call()
                .content();

        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        return new ExpressionFeedbackResponse(content.trim());
    }

    public SuggestReplyResponse suggestReply(SuggestReplyRequest request) {
        requireOpenAiApiKey();

        ChatClient.Builder builder = requireChatClientBuilder();

        // 캐릭터 컨텍스트: agentId+instructions 오버라이드를 해석해 코치 프롬프트에 박는다.
        String characterContext;
        try {
            characterContext = agentResolver.resolveSystemPrompt(request.agentId(), request.instructions());
        } catch (BusinessException e) {
            characterContext = "(no specific character)";
        }

        StringBuilder userBlock = new StringBuilder();
        if (StringUtils.hasText(request.recentHistory())) {
            userBlock.append("Recent conversation (oldest → newest):\n")
                    .append(request.recentHistory().trim())
                    .append("\n\n");
        }
        if (StringUtils.hasText(request.lastAgentMessage())) {
            userBlock.append("Character's MOST RECENT message (answer this precisely):\n\"")
                    .append(request.lastAgentMessage().trim()).append("\"\n\n");
        }
        if (StringUtils.hasText(request.lastLearnerMessage()) && !StringUtils.hasText(request.recentHistory())) {
            userBlock.append("Learner's previous message (for context):\n\"")
                    .append(request.lastLearnerMessage().trim()).append("\"\n\n");
        }
        if (userBlock.length() == 0) {
            userBlock.append("(no prior turns — suggest a natural opening line.)");
        }

        String content = builder.build()
                .prompt()
                .system("""
                        You are a private coach for a Korean English learner.
                        The learner is in a roleplay/conversation with an AI character described below.
                        Your job: suggest ONE short, natural English line the LEARNER can say next.

                        Strict rules:
                        - Reply with ONLY the suggested English line.
                        - No quotes, no Korean, no labels, no explanation, no leading dash.
                        - Keep it short and natural for spoken conversation (typically under 15 words).
                        - Directly and concretely answer the character's MOST RECENT message.
                          If they ask an A-or-B question, pick one and answer it directly.
                          If they ask for information, give that information first.
                          Add at most one short detail; do NOT change the topic.
                        - Stay consistent with the learner's previous messages (do not contradict them).
                        - If the learner has not spoken yet, suggest a natural opening line.

                        Character context:
                        """ + characterContext)
                .user(userBlock.toString().trim())
                .call()
                .content();

        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        // 모델이 가끔 따옴표·접두사를 붙이는 경우 정리.
        String cleaned = content.trim();
        if (cleaned.startsWith("\"") && cleaned.endsWith("\"") && cleaned.length() > 1) {
            cleaned = cleaned.substring(1, cleaned.length() - 1).trim();
        }
        if (cleaned.startsWith("- ")) cleaned = cleaned.substring(2).trim();

        return new SuggestReplyResponse(cleaned);
    }

    public ChunkAnalysisResponse chunkAnalysis(ChunkAnalysisRequest request) {
        requireOpenAiApiKey();

        ChatClient.Builder builder = requireChatClientBuilder();

        String content = builder.build()
                .prompt()
                .options(translationOptions(1500))
                .system("""
                        You break an English sentence into meaning chunks to help a Korean learner
                        understand how the sentence is built, in the order an English speaker thinks.

                        Return ONLY a JSON object, no markdown, no code fences, no extra text.
                        Shape:
                        {
                          "chunks": [{"en": "...", "ko": "...", "note": "..."}],
                          "natural": "...",
                          "tip": "..."
                        }

                        Rules:
                        - Split the sentence into short, natural chunks (a few words each):
                          subject, verb phrase, prepositional phrase, conjunctions like "and/but/that", etc.
                        - Keep the chunks in the ORIGINAL English order. Cover the whole sentence.
                        - For each chunk: "en" is the English chunk exactly as it appears,
                          "ko" is its natural Korean meaning, and "note" is an optional very short
                          Korean hint about its role (e.g. "주어", "동사구", "앞 내용을 that으로 받음").
                          Use an empty string for "note" when not helpful.
                        - "natural" is one smooth, natural full Korean translation of the whole sentence.
                        - "tip" is one short Korean sentence about the sentence's structure or a pattern
                          worth noticing (e.g. how English chains clauses with "that"). Keep it practical.
                        - Write all Korean naturally.
                        """)
                .user(request.text())
                .call()
                .content();

        ChunkAnalysisResponse result = parseChunkAnalysis(content);

        if (result == null || result.chunks() == null || result.chunks().isEmpty()) {
            log.error("Chunk analysis returned no chunks. raw={}", content);
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        return result;
    }

    public TranscribeResponse transcribe(MultipartFile file, String language) {
        requireOpenAiApiKey();

        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }

        try {
            final String filename = StringUtils.hasText(file.getOriginalFilename())
                    ? file.getOriginalFilename()
                    : "audio.webm";
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };

            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            form.add("file", resource);
            form.add("model", transcribeModel);
            // language가 비어 있으면 보내지 않음 → Whisper 자동 감지(한국어/영어 혼용 시 오인식 방지)
            if (StringUtils.hasText(language)) {
                form.add("language", language.trim());
            }
            form.add("response_format", "json");

            Map<String, Object> response = RestClient.create("https://api.openai.com")
                    .post()
                    .uri("/v1/audio/transcriptions")
                    .header("Authorization", "Bearer " + requireEffectiveApiKey())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(form)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });

            Object text = response == null ? null : response.get("text");
            if (text == null || !StringUtils.hasText(text.toString())) {
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            }

            return new TranscribeResponse(text.toString().trim());
        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            log.warn("Failed to read audio upload. error={}", e.getMessage());
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        } catch (Exception e) {
            log.warn("Transcription failed. model={}, error={}", transcribeModel, e.getMessage());
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }
    }

    public byte[] speech(SpeechRequest request) {
        requireOpenAiApiKey();

        String voice = StringUtils.hasText(request.voice()) ? request.voice() : ttsVoice;
        Map<String, Object> body = Map.of(
                "model", ttsModel,
                "input", request.text(),
                "voice", voice,
                "response_format", "mp3"
        );

        try {
            byte[] audio = RestClient.create("https://api.openai.com")
                    .post()
                    .uri("/v1/audio/speech")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + requireEffectiveApiKey())
                    .body(body)
                    .retrieve()
                    .body(byte[].class);

            if (audio == null || audio.length == 0) {
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            }

            return audio;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("TTS request failed. model={}, error={}", ttsModel, e.getMessage());
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }
    }

    private static final Pattern RSS_ITEM_PATTERN = Pattern.compile("<item>(.*?)</item>", Pattern.DOTALL);
    private static final Pattern RSS_TITLE_PATTERN =
            Pattern.compile("<title>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</title>", Pattern.DOTALL);

    public NewsResponse fetchNews(String lang) {
        String url = "en".equalsIgnoreCase(lang)
                ? "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"
                : "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko";

        try {
            String xml = RestClient.create()
                    .get()
                    .uri(url)
                    .header("User-Agent", "Mozilla/5.0 (compatible; EnglishAgentHub/1.0)")
                    .retrieve()
                    .body(String.class);

            List<String> titles = parseRssTitles(xml, 10);
            if (titles.isEmpty()) {
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            }
            return new NewsResponse(titles);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("News fetch failed. url={}, error={}", url, e.getMessage());
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }
    }

    private List<String> parseRssTitles(String xml, int limit) {
        List<String> titles = new ArrayList<>();
        if (!StringUtils.hasText(xml)) {
            return titles;
        }

        Matcher itemMatcher = RSS_ITEM_PATTERN.matcher(xml);
        while (itemMatcher.find() && titles.size() < limit) {
            Matcher titleMatcher = RSS_TITLE_PATTERN.matcher(itemMatcher.group(1));
            if (titleMatcher.find()) {
                String title = decodeHtmlEntities(titleMatcher.group(1).trim());
                if (StringUtils.hasText(title)) {
                    titles.add(title);
                }
            }
        }
        return titles;
    }

    private String decodeHtmlEntities(String value) {
        return value
                .replace("&#39;", "'")
                .replace("&quot;", "\"")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&amp;", "&");
    }

    private ChunkAnalysisResponse parseChunkAnalysis(String content) {
        if (!StringUtils.hasText(content)) {
            return null;
        }

        String json = content.trim();
        // ```json ... ``` 같은 코드펜스 제거
        if (json.startsWith("```")) {
            json = json.replaceAll("^```[a-zA-Z]*\\s*", "").replaceAll("\\s*```$", "").trim();
        }
        int start = json.indexOf('{');
        int end = json.lastIndexOf('}');
        if (start >= 0 && end > start) {
            json = json.substring(start, end + 1);
        }

        try {
            return objectMapper.readValue(json, ChunkAnalysisResponse.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse chunk analysis JSON. raw={}", content, e);
            throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
        }
    }

    private OpenAiChatOptions.Builder translationOptions() {
        return translationOptions(256);
    }

    private OpenAiChatOptions.Builder translationOptions(int maxCompletionTokens) {
        return OpenAiChatOptions.builder()
                .model(translationModel)
                .reasoningEffort("minimal")
                .verbosity("low")
                .maxCompletionTokens(maxCompletionTokens);
    }

    private void requireOpenAiApiKey() {
        if (!openAiClientResolver.hasUsableKey()) {
            throw new BusinessException(ErrorCode.OPENAI_NOT_CONFIGURED);
        }
    }

    private ChatClient.Builder requireChatClientBuilder() {
        ChatClient.Builder builder = openAiClientResolver.resolveChatClientBuilder();
        if (builder == null) {
            throw new BusinessException(ErrorCode.OPENAI_NOT_CONFIGURED);
        }
        return builder;
    }

    private String requireEffectiveApiKey() {
        String key = openAiClientResolver.getEffectiveApiKey();
        if (!StringUtils.hasText(key)) {
            throw new BusinessException(ErrorCode.OPENAI_NOT_CONFIGURED);
        }
        return key;
    }

    private String translateWithRetry(Supplier<String> translation) {
        try {
            return translation.get();
        } catch (Exception first) {
            log.warn("Translation request failed. Retrying once. model={}, error={}", translationModel, first.getMessage());
            try {
                Thread.sleep(700);
                return translation.get();
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            } catch (Exception second) {
                log.warn("Translation retry failed. model={}, error={}", translationModel, second.getMessage());
                throw new BusinessException(ErrorCode.AI_REQUEST_FAILED);
            }
        }
    }
}
