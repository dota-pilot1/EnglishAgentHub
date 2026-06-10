"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bot, KeyRound, Languages, ListTree, Loader2, Mic, MicOff, Newspaper, Paperclip, Send, Settings2, Sparkles, Square, Trash2, Volume2, WandSparkles, X } from "lucide-react";
import { agentChatApi } from "@/entities/agent/api/agentChatApi";
import type { ChatTurn, ChunkAnalysisResponse } from "@/entities/agent/api/agentChatApi";
import type { LearningAgent } from "@/entities/agent/model/learningAgents";
import { toast, toastError } from "@/shared/lib/toast";
import { Switch } from "@/shared/ui/Switch";

type ChatMessage = {
  id: string;
  role: "agent" | "learner";
  text: string;
  sourceText?: string;
  translatedText?: string;
  sourceLabel?: string;
  translatedLabel?: string;
  translating?: boolean;
  streaming?: boolean;
};

type RealtimePayload = {
  type?: string;
  response_id?: string;
  item_id?: string;
  transcript?: string;
  text?: string;
  delta?: string;
  response?: unknown;
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
};

type ExpressionFeedback = {
  source: string;
  content: string;
  loading: boolean;
};

type ChunkAnalysisState = {
  loading: boolean;
  source: string;
  data?: ChunkAnalysisResponse;
  error?: string;
};

type SpeechRecognitionResultEventLike = {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

function extractClientSecret(raw: Record<string, unknown>): string | null {
  const clientSecret = raw.client_secret;
  if (typeof raw.value === "string") return raw.value;
  if (typeof clientSecret === "string") return clientSecret;
  if (
    clientSecret &&
    typeof clientSecret === "object" &&
    "value" in clientSecret &&
    typeof clientSecret.value === "string"
  ) {
    return clientSecret.value;
  }
  return null;
}

function getRealtimeEventKey(payload: RealtimePayload) {
  return payload.response_id ?? payload.item_id ?? "current";
}

function extractResponseText(response: unknown): string | null {
  const textParts: string[] = [];
  const visited = new Set<unknown>();

  const collectText = (value: unknown) => {
    if (!value || typeof value !== "object" || visited.has(value)) return;
    visited.add(value);

    if ("transcript" in value && typeof value.transcript === "string") {
      textParts.push(value.transcript);
    }
    if ("text" in value && typeof value.text === "string") {
      textParts.push(value.text);
    }

    Object.values(value).forEach(collectText);
  };

  collectText(response);
  const text = Array.from(new Set(textParts.map((part) => part.trim()).filter(Boolean))).join("\n").trim();
  return text || null;
}

function getAgentAccentClass(agentId: string) {
  const accentMap: Record<string, string> = {
    debate: "border-sky-200 bg-sky-50 text-sky-700",
    roleplay: "border-emerald-200 bg-emerald-50 text-emerald-700",
    quiz: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return accentMap[agentId] ?? "border-border bg-muted text-muted-foreground";
}

function hasKorean(text: string) {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text);
}

function getExpressionSource(message: ChatMessage) {
  if (message.sourceLabel === "English" && message.sourceText?.trim()) return message.sourceText.trim();
  if (message.translatedLabel === "English" && message.translatedText?.trim()) return message.translatedText.trim();
  if (message.text.trim()) return message.text.trim();
  return message.sourceText?.trim() ?? "";
}

function getExpressionSuggestions(feedback: ExpressionFeedback | null): string[] {
  if (!feedback?.content) return [];
  const marker = "자연스러운 표현:";
  const start = feedback.content.indexOf(marker);
  if (start < 0) return [];

  const after = feedback.content.slice(start + marker.length);
  const stops = ["왜 더 자연스러운가", "바로 쓰기"]
    .map((m) => after.indexOf(m))
    .filter((index) => index >= 0);
  const end = stops.length ? Math.min(...stops) : after.length;

  return after
    .slice(0, end)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-•]/.test(line))
    .map((line) => line.replace(/^[-•]\s*/, "").replace(/^["“”]+|["“”]+$/g, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function getExpressionReason(feedback: ExpressionFeedback | null): string {
  if (!feedback?.content) return "";
  const marker = "왜 더 자연스러운가";
  const start = feedback.content.indexOf(marker);
  if (start < 0) return "";

  let after = feedback.content.slice(start + marker.length).replace(/^[:：]\s*/, "");
  const stop = after.indexOf("바로 쓰기");
  if (stop >= 0) after = after.slice(0, stop);
  return after.trim();
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="응답 작성 중">
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
    </span>
  );
}

function ChunkAnalysisDialog({
  open,
  state,
  onClose,
}: {
  open: boolean;
  state?: ChunkAnalysisState;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !state) return null;

  const data = state.data;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chunk-analysis-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-border bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3">
          <div className="min-w-0">
            <h2 id="chunk-analysis-title" className="flex items-center gap-1.5 text-sm font-semibold">
              <ListTree className="h-4 w-4 text-primary" />
              청크 분석
            </h2>
            <p className="mt-1 break-words text-xs text-muted-foreground">{state.source}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 text-sm">
          {state.loading ? (
            <div className="flex items-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              문장을 의미 단위로 분석하는 중...
            </div>
          ) : state.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {state.error}
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="space-y-2.5">
                {data.chunks.map((chunk, index) => (
                  <div
                    key={`${index}-${chunk.en}`}
                    className="flex flex-col gap-1 border-l-2 border-primary/40 pl-3"
                  >
                    <span className="font-semibold text-foreground">{chunk.en}</span>
                    <span className="text-muted-foreground">
                      → {chunk.ko}
                      {chunk.note?.trim() ? (
                        <span className="ml-1 text-xs text-primary/80">({chunk.note.trim()})</span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
              {data.natural?.trim() && (
                <div className="border-t border-border pt-3">
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground">자연스럽게</div>
                  <p className="mt-1 font-medium leading-6 text-foreground">{data.natural.trim()}</p>
                </div>
              )}
              {data.tip?.trim() && (
                <div className="rounded-md bg-muted/60 px-3 py-2 leading-6 text-muted-foreground">
                  💡 {data.tip.trim()}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type AgentInstructions = {
  style: string;
  scenario: string;
  character: string;
  knowledge: string;
  news: string;
  schedule: string;
};

const EMPTY_INSTRUCTIONS: AgentInstructions = {
  style: "",
  scenario: "",
  character: "",
  knowledge: "",
  news: "",
  schedule: "",
};

const INSTRUCTION_TABS: { key: keyof AgentInstructions; label: string; placeholder: string }[] = [
  {
    key: "style",
    label: "대화 스타일",
    placeholder:
      "예: 친구처럼 편한 반말 톤으로, 쉬운 단어만 써서 1~2문장으로 짧게 답해줘. 가끔 더 자연스러운 표현을 한 줄 알려줘.",
  },
  {
    key: "scenario",
    label: "참고 시나리오",
    placeholder: `예 (카페 응대 시나리오):
1) 인사하고 무엇을 주문하실지 묻기
2) 사이즈(Tall/Grande/Venti) 묻기
3) 핫/아이스, 시럽, 휘핑 같은 옵션 묻기
4) 추가 메뉴 있는지 묻기
5) 매장/포장 여부 묻기
6) 결제 방식 묻고 영수증/포인트 마무리

이 절차를 한 번에 한 단계씩 진행하고, 학습자가 답하기 전엔 다음 단계로 넘어가지 마.`,
  },
  {
    key: "character",
    label: "캐릭터 정보",
    placeholder: "예: 이름은 Mike, 29살, 취미는 자전거 타기, 직업은 야구 선수.",
  },
  {
    key: "knowledge",
    label: "알고 있는 지식",
    placeholder: "예: 스타크래프트 테란 유저. 한국 음식을 좋아함. 서울에 한 번 가봤음.",
  },
  {
    key: "news",
    label: "오늘의 뉴스",
    placeholder:
      "예: 오늘 한국에 첫눈이 왔다. 손흥민이 어제 골을 넣었다. — 대화 중 자연스럽게 화제로 꺼내줘.",
  },
  {
    key: "schedule",
    label: "캐릭터 근황",
    placeholder:
      "예: 오늘 아침 자전거 탔음. 어제 경기에서 홈런 침. 요즘 한국어 공부 중. — 대화 중 자기 근황으로 자연스럽게 풀어줘.",
  },
];

function composeInstructions(instr: AgentInstructions): string {
  const parts: string[] = [];
  if (instr.style.trim()) parts.push(`[Conversation style]\n${instr.style.trim()}`);
  if (instr.scenario.trim()) parts.push(`[Scenario / procedure to follow]\n${instr.scenario.trim()}`);
  if (instr.character.trim()) parts.push(`[Character]\n${instr.character.trim()}`);
  if (instr.knowledge.trim()) parts.push(`[Background knowledge]\n${instr.knowledge.trim()}`);
  if (instr.news.trim()) parts.push(`[Today's news to bring up naturally]\n${instr.news.trim()}`);
  if (instr.schedule.trim()) parts.push(`[Your (the character's) recent updates to mention naturally]\n${instr.schedule.trim()}`);
  return parts.join("\n\n");
}

function parseStoredInstructions(stored: string | null): AgentInstructions {
  if (!stored) return EMPTY_INSTRUCTIONS;
  try {
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const read = (key: keyof AgentInstructions) =>
        typeof parsed[key] === "string" ? (parsed[key] as string) : "";
      const result: AgentInstructions = {
        style: read("style"),
        scenario: read("scenario"),
        character: read("character"),
        knowledge: read("knowledge"),
        news: read("news"),
        schedule: read("schedule"),
      };
      if (Object.values(result).some((value) => value.trim())) return result;
    }
  } catch {
    // legacy: a plain free-text string was stored — treat it as conversation style
  }
  return { ...EMPTY_INSTRUCTIONS, style: stored };
}

const REALTIME_IDLE_LIMIT_MS = 120_000;

export function AgentChatClient({ agentId }: { agentId: string }) {
  const [agent, setAgent] = useState<LearningAgent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [autoKoEn, setAutoKoEn] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [expressionFeedback, setExpressionFeedback] = useState<ExpressionFeedback | null>(null);
  const [expressionDraft, setExpressionDraft] = useState("");
  const [expressionListening, setExpressionListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [inputListening, setInputListening] = useState(false);
  const [inputTranscribing, setInputTranscribing] = useState(false);
  const [suggestingReply, setSuggestingReply] = useState(false);
  const [instr, setInstr] = useState<AgentInstructions>(EMPTY_INSTRUCTIONS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [instrDraft, setInstrDraft] = useState<AgentInstructions>(EMPTY_INSTRUCTIONS);
  const [settingsTab, setSettingsTab] = useState<keyof AgentInstructions>("style");
  const [newsLoading, setNewsLoading] = useState(false);
  const [chunkAnalysis, setChunkAnalysis] = useState<Record<string, ChunkAnalysisState>>({});
  const [openChunkId, setOpenChunkId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const expressionRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsCacheRef = useRef(new Map<string, string>());
  const realtimeTextRef = useRef(new Map<string, string>());
  const completedRealtimeItemsRef = useRef(new Set<string>());
  const realtimeResponseActiveRef = useRef(false);
  const pendingRealtimeMessagesRef = useRef<string[]>([]);
  const realtimeIdleTimerRef = useRef<number | null>(null);

  const voiceStatusText = useMemo(() => {
    if (voiceStatus === "connected") return "Realtime 연결됨";
    if (voiceStatus === "connecting") return "Realtime 연결 중";
    return "Realtime 연결 대기";
  }, [voiceStatus]);

  useEffect(() => {
    let mounted = true;
    const ttsCache = ttsCacheRef.current;

    agentChatApi
      .getAgent(agentId)
      .then((data) => {
        if (!mounted) return;
        setAgent(data);
      })
      .catch((error) => {
        toastError(error, "에이전트 정보를 가져오지 못했습니다.");
      });

    setInstr(parseStoredInstructions(window.localStorage.getItem(`agent-chat:instructions:${agentId}`)));

    return () => {
      mounted = false;
      if (realtimeIdleTimerRef.current !== null) {
        window.clearTimeout(realtimeIdleTimerRef.current);
      }
      peerRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordStreamRef.current?.getTracks().forEach((track) => track.stop());
      ttsAudioRef.current?.pause();
      ttsCache.forEach((url) => URL.revokeObjectURL(url));
      ttsCache.clear();
    };
  }, [agentId]);

  useEffect(() => {
    const storedAutoKoEn = window.localStorage.getItem("agent-chat:auto-ko-en");
    const storedMicMuted = window.localStorage.getItem("agent-chat:mic-muted");
    const storedAutoSpeak = window.localStorage.getItem("agent-chat:auto-speak");
    if (storedAutoKoEn !== null) setAutoKoEn(storedAutoKoEn === "true");
    if (storedMicMuted !== null) setMicMuted(storedMicMuted === "true");
    if (storedAutoSpeak !== null) setAutoSpeak(storedAutoSpeak === "true");
  }, []);

  useEffect(() => {
    mediaStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !micMuted;
    });
    window.localStorage.setItem("agent-chat:mic-muted", String(micMuted));
  }, [micMuted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const appendRealtimeMessage = (role: ChatMessage["role"], text: string, options?: Partial<ChatMessage>) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((current) => {
      const last = current.at(-1);
      if (last?.role === role && last.text === trimmed) return current;
      return [...current, { id: crypto.randomUUID(), role, text: trimmed, ...options }];
    });
  };

  const appendLearnerMessage = (message: {
    text: string;
    sourceText?: string;
    translatedText?: string;
    sourceLabel?: string;
    translatedLabel?: string;
  }) => {
    appendRealtimeMessage("learner", message.text, {
      sourceText: message.sourceText,
      translatedText: message.translatedText,
      sourceLabel: message.sourceLabel,
      translatedLabel: message.translatedLabel,
    });
  };

  const updateMessage = (messageId: string, updates: Partial<ChatMessage>) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              ...updates,
            }
          : message
      )
    );
  };

  const appendRealtimeDelta = (key: string, delta: string) => {
    if (!delta) return;
    const messageId = `realtime-${key}`;
    realtimeTextRef.current.set(key, `${realtimeTextRef.current.get(key) ?? ""}${delta}`);

    setMessages((current) => {
      const exists = current.some((message) => message.id === messageId);
      if (!exists) {
        return [...current, { id: messageId, role: "agent", text: delta, streaming: true }];
      }

      return current.map((message) =>
        message.id === messageId ? { ...message, text: `${message.text}${delta}`, streaming: true } : message
      );
    });
  };

  const finalizeRealtimeMessage = (key: string, fallbackText: string) => {
    const messageId = `realtime-${key}`;
    const text = (realtimeTextRef.current.get(key) ?? fallbackText).trim();
    realtimeTextRef.current.delete(key);
    if (!text) return;

    setMessages((current) => {
      const exists = current.some((message) => message.id === messageId);
      if (!exists) return [...current, { id: messageId, role: "agent", text, streaming: false }];
      return current.map((message) =>
        message.id === messageId ? { ...message, text, streaming: false } : message
      );
    });
    void translateAgentMessage(messageId, text);
  };

  const stopRealtimeSession = (options?: { silent?: boolean; message?: string }) => {
    if (realtimeIdleTimerRef.current !== null) {
      window.clearTimeout(realtimeIdleTimerRef.current);
      realtimeIdleTimerRef.current = null;
    }
    peerRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioRef.current?.remove();
    peerRef.current = null;
    dataChannelRef.current = null;
    mediaStreamRef.current = null;
    audioRef.current = null;
    realtimeTextRef.current.clear();
    completedRealtimeItemsRef.current.clear();
    realtimeResponseActiveRef.current = false;
    pendingRealtimeMessagesRef.current = [];
    setVoiceStatus("idle");
    if (!options?.silent) {
      toast.success(options?.message ?? "Realtime 음성 세션이 종료되었습니다.");
    }
  };

  const scheduleRealtimeIdleTimeout = () => {
    if (realtimeIdleTimerRef.current !== null) {
      window.clearTimeout(realtimeIdleTimerRef.current);
    }

    realtimeIdleTimerRef.current = window.setTimeout(() => {
      stopRealtimeSession({
        message: "음성 입력이 없어 비용 절감을 위해 세션을 자동 종료했습니다.",
      });
    }, REALTIME_IDLE_LIMIT_MS);
  };

  const toggleAutoKoEn = (enabled: boolean) => {
    setAutoKoEn(enabled);
    window.localStorage.setItem("agent-chat:auto-ko-en", String(enabled));
    if (voiceStatus === "connected") {
      stopRealtimeSession();
      window.setTimeout(() => {
        void startRealtimeSession(enabled, true);
      }, 0);
      toast.info("자동 번역 설정을 적용하려고 음성 세션을 다시 시작합니다.");
    }
  };

  const toggleMicMuted = (enabled: boolean) => {
    setMicMuted(enabled);
    mediaStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !enabled;
    });
  };

  const toggleAutoSpeak = (enabled: boolean) => {
    setAutoSpeak(enabled);
    window.localStorage.setItem("agent-chat:auto-speak", String(enabled));
  };

  const buildRealtimeInstructions = (override: string) => {
    const base = override.trim() || agent?.systemPrompt || "";
    if (!autoKoEn) return base;
    return (
      base +
      " When the learner speaks Korean, understand it as Korean input for English practice: translate their meaning into natural English internally, show or use the English phrasing, and respond in English unless they explicitly ask otherwise."
    );
  };

  const applyInstructions = (value: AgentInstructions) => {
    setInstr(value);
    const composed = composeInstructions(value);
    if (composed) {
      window.localStorage.setItem(`agent-chat:instructions:${agentId}`, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(`agent-chat:instructions:${agentId}`);
    }

    const dataChannel = dataChannelRef.current;
    if (voiceStatus === "connected" && dataChannel?.readyState === "open") {
      dataChannel.send(
        JSON.stringify({
          type: "session.update",
          session: { type: "realtime", instructions: buildRealtimeInstructions(composed) },
        })
      );
      toast.success("실시간 세션에 새 지침을 반영했습니다.");
    }
  };

  const openSettings = () => {
    setInstrDraft(instr);
    setSettingsTab("style");
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    applyInstructions(instrDraft);
    setSettingsOpen(false);
    toast.success("에이전트 지침을 저장했습니다.");
  };

  const loadNews = async () => {
    setNewsLoading(true);
    try {
      const { items } = await agentChatApi.fetchNews("ko");
      if (!items.length) {
        toast.info("가져올 뉴스가 없습니다.");
        return;
      }
      const formatted = ["오늘의 뉴스 (대화 중 자연스럽게 화제로 꺼내줘):", ...items.map((title, index) => `${index + 1}. ${title}`)].join(
        "\n"
      );
      setInstrDraft((draft) => ({ ...draft, news: formatted }));
      setSettingsTab("news");
      toast.success(`오늘의 뉴스 ${items.length}개를 채웠습니다.`);
    } catch (error) {
      toastError(error, "뉴스를 가져오지 못했습니다.");
    } finally {
      setNewsLoading(false);
    }
  };

  const stopSpeaking = () => {
    const audio = ttsAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setSpeakingMessageId(null);
  };

  const speakMessage = async (messageId: string, rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    if (speakingMessageId === messageId) {
      stopSpeaking();
      return;
    }
    stopSpeaking();

    try {
      let url = ttsCacheRef.current.get(messageId);
      if (!url) {
        const buffer = await agentChatApi.synthesizeSpeech(text);
        const blob = new Blob([buffer], { type: "audio/mpeg" });
        url = URL.createObjectURL(blob);
        ttsCacheRef.current.set(messageId, url);
      }

      const audio = new Audio(url);
      ttsAudioRef.current = audio;
      audio.onended = () => setSpeakingMessageId((id) => (id === messageId ? null : id));
      audio.onerror = () => setSpeakingMessageId((id) => (id === messageId ? null : id));
      setSpeakingMessageId(messageId);
      await audio.play();
    } catch (error) {
      setSpeakingMessageId((id) => (id === messageId ? null : id));
      toastError(error, "음성을 재생하지 못했습니다.");
    }
  };

  const startInputRecording = async () => {
    if (typeof MediaRecorder === "undefined") {
      toast.error("이 브라우저는 음성 녹음을 지원하지 않습니다.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      recordStreamRef.current = stream;
      recordChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        recordStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordStreamRef.current = null;
        const blob = new Blob(recordChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        recordChunksRef.current = [];
        if (blob.size === 0) return;

        setInputTranscribing(true);
        try {
          // autoKoEn ON이면 한국어/영어 둘 다 들어올 수 있으므로 언어 힌트 미지정(자동 감지).
          // OFF이면 영어 강제.
          const { text } = await agentChatApi.transcribeAudio(blob, autoKoEn ? undefined : "en");
          const trimmed = text?.trim();
          if (trimmed) setInput(trimmed);
          else toast.info("음성에서 인식된 내용이 없습니다.");
        } catch (error) {
          toastError(error, "음성 인식에 실패했습니다.");
        } finally {
          setInputTranscribing(false);
          textAreaRef.current?.focus();
        }
      };

      recorder.start();
      setInputListening(true);
    } catch (error) {
      toastError(error, "마이크를 사용할 수 없습니다.");
      setInputListening(false);
    }
  };

  const toggleInputVoiceInput = () => {
    if (inputTranscribing) return;
    if (inputListening) {
      mediaRecorderRef.current?.stop();
      setInputListening(false);
      return;
    }
    void startInputRecording();
  };

  const requestSuggestedReply = async () => {
    if (suggestingReply) return;

    const pickText = (m: ChatMessage | undefined) =>
      (m?.sourceText ?? m?.text ?? "").trim();

    const lastAgent = [...messages].reverse().find((m) => m.role === "agent");
    const lastLearner = [...messages].reverse().find((m) => m.role === "learner");

    // 최근 6개 메시지를 oldest→newest 순으로 직렬화 (코치 모델이 흐름 전체를 보도록)
    const recent = messages.slice(-6);
    const recentHistory = recent
      .map((m) => {
        const role = m.role === "agent" ? "Character" : "Learner";
        const text = pickText(m);
        return text ? `${role}: ${text}` : "";
      })
      .filter(Boolean)
      .join("\n");

    setSuggestingReply(true);
    try {
      const { text } = await agentChatApi.suggestReply({
        agentId: agent?.id,
        instructions: composeInstructions(instr) || undefined,
        lastAgentMessage: pickText(lastAgent) || undefined,
        lastLearnerMessage: pickText(lastLearner) || undefined,
        recentHistory: recentHistory || undefined,
      });
      const trimmed = text?.trim();
      if (trimmed) {
        setInput(trimmed);
        textAreaRef.current?.focus();
      } else {
        toast.info("추천 답변을 만들지 못했습니다.");
      }
    } catch (error) {
      toastError(error, "추천 답변을 가져오지 못했습니다.");
    } finally {
      setSuggestingReply(false);
    }
  };

  const withTranslationRetry = async <T,>(translate: () => Promise<T>) => {
    try {
      return await translate();
    } catch (firstError) {
      await delay(700);
      try {
        return await translate();
      } catch {
        throw firstError;
      }
    }
  };

  const prepareLearnerInput = async (message: string) => {
    const original = message.trim();
    if (!autoKoEn) {
      return { displayText: original, modelText: original };
    }

    if (!hasKorean(original)) {
      const korean = (await withTranslationRetry(() => agentChatApi.translateToKorean(original))).text.trim();
      return {
        displayText: original,
        modelText: original,
        sourceText: original,
        translatedText: korean,
        sourceLabel: "English",
        translatedLabel: "한국어",
      };
    }

    const english = (await withTranslationRetry(() => agentChatApi.translateToEnglish(original))).text.trim();
    return {
      displayText: english,
      modelText: english,
      sourceText: original,
      translatedText: english,
      sourceLabel: "한국어",
      translatedLabel: "English",
    };
  };

  const translateLearnerMessage = async (messageId: string, message: string) => {
    try {
      const learnerInput = await prepareLearnerInput(message);
      updateMessage(messageId, {
        text: learnerInput.displayText,
        sourceText: learnerInput.sourceText,
        translatedText: learnerInput.translatedText,
        sourceLabel: learnerInput.sourceLabel,
        translatedLabel: learnerInput.translatedLabel,
        translating: false,
      });
      return learnerInput.modelText;
    } catch (error) {
      toastError(error, "영어 번역을 만들지 못했습니다.");
      updateMessage(messageId, {
        translatedText: "번역 실패",
        translating: false,
      });
      return message;
    }
  };

  const translateAgentMessage = async (messageId: string, message: string) => {
    const original = message.trim();
    if (!autoKoEn || !original) return;

    updateMessage(messageId, {
      sourceText: original,
      sourceLabel: "English",
      translatedLabel: "한국어",
      translating: true,
    });

    try {
      const korean = (await withTranslationRetry(() => agentChatApi.translateToKorean(original))).text.trim();
      updateMessage(messageId, {
        sourceText: original,
        translatedText: korean,
        translating: false,
      });
    } catch (error) {
      toastError(error, "응답 번역을 만들지 못했습니다.");
      updateMessage(messageId, {
        translatedText: "번역 실패",
        translating: false,
      });
    }
  };

  const sendMessage = async () => {
    const message = input.trim();
    if (!agent || !message || sending) return;

    setInput("");
    setSending(true);
    const needsTranslation = autoKoEn;
    const learnerMessageId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      {
        id: learnerMessageId,
        role: "learner",
        text: needsTranslation ? "" : message,
        sourceText: needsTranslation ? message : undefined,
        sourceLabel: needsTranslation ? (hasKorean(message) ? "한국어" : "English") : undefined,
        translatedLabel: needsTranslation ? (hasKorean(message) ? "English" : "한국어") : undefined,
        translating: needsTranslation,
      },
    ]);

    const modelText = needsTranslation ? await translateLearnerMessage(learnerMessageId, message) : message;

    const dataChannel = dataChannelRef.current;
    if (voiceStatus === "connected" && dataChannel?.readyState === "open") {
      requestRealtimeResponse(modelText);
      setSending(false);
      return;
    }

    const agentResponseId = crypto.randomUUID();
    let responseText = "";

    // 호출 시점의 대화 히스토리(최대 20턴)를 직렬화 — 새 learner는 message로 따로 가므로 제외
    const pickText = (m: ChatMessage) => (m.sourceText ?? m.text ?? "").trim();
    const history = messages
      .slice(-20)
      .map<ChatTurn | null>((m) => {
        const content = pickText(m);
        if (!content) return null;
        return { role: m.role === "agent" ? "assistant" : "user", content };
      })
      .filter((t): t is ChatTurn => t !== null);

    setMessages((current) => [
      ...current,
      { id: agentResponseId, role: "agent", text: "", streaming: true },
    ]);

    try {
      await agentChatApi.streamMessage({ agentId: agent.id, message: modelText, instructions: composeInstructions(instr) || undefined, history }, (delta) => {
        responseText += delta;
        setMessages((current) =>
          current.map((item) =>
            item.id === agentResponseId ? { ...item, text: `${item.text}${delta}` } : item
          )
        );
      });
      setMessages((current) =>
        current.map((item) =>
          item.id === agentResponseId ? { ...item, streaming: false, text: item.text.trim() } : item
        )
      );
      void translateAgentMessage(agentResponseId, responseText);
      if (autoSpeak) void speakMessage(agentResponseId, responseText);
    } catch (e) {
      toastError(e, "AI 응답을 가져오지 못했습니다.");
      setMessages((current) =>
        current.map((item) =>
          item.id === agentResponseId
            ? {
                id: agentResponseId,
                role: "agent",
                streaming: false,
                text: "OpenAI 설정 또는 서버 연결을 확인해주세요. API 키가 없으면 실제 응답을 생성할 수 없습니다.",
              }
            : item
        )
      );
    } finally {
      setSending(false);
    }
  };

  const sendRealtimeResponseCreate = () => {
    const dataChannel = dataChannelRef.current;
    if (dataChannel?.readyState !== "open") return;
    realtimeResponseActiveRef.current = true;
    dataChannel.send(
      JSON.stringify({
        type: "response.create",
      })
    );
  };

  const flushPendingRealtimeMessage = () => {
    if (realtimeResponseActiveRef.current) return;
    const message = pendingRealtimeMessagesRef.current.shift();
    if (!message) return;

    const dataChannel = dataChannelRef.current;
    if (dataChannel?.readyState !== "open") {
      pendingRealtimeMessagesRef.current.unshift(message);
      return;
    }

    dataChannel.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: message }],
        },
      })
    );
    sendRealtimeResponseCreate();
  };

  const requestRealtimeResponse = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    scheduleRealtimeIdleTimeout();
    pendingRealtimeMessagesRef.current.push(trimmed);
    flushPendingRealtimeMessage();
  };

  const handleRealtimeResponseComplete = () => {
    realtimeResponseActiveRef.current = false;
    flushPendingRealtimeMessage();
  };

  const handleRealtimeError = (payload: RealtimePayload) => {
    if (payload.error?.code === "conversation_already_has_active_response") {
      realtimeResponseActiveRef.current = true;
      console.warn("Realtime response is already active; queued pending input.", payload);
      return;
    }

    const errorMessage = payload.error?.message ?? "Realtime 응답 생성 중 오류가 발생했습니다.";
    console.warn("Realtime error", payload);
    realtimeResponseActiveRef.current = false;
    flushPendingRealtimeMessage();
    toast.error(errorMessage);
  };

  const handleRealtimeTranscript = async (transcript: string) => {
    const original = transcript.trim();
    if (!original) return;
    scheduleRealtimeIdleTimeout();

    if (!autoKoEn) {
      appendLearnerMessage({ text: original });
      return;
    }

    const needsTranslation = autoKoEn;
    const learnerMessageId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      {
        id: learnerMessageId,
        role: "learner",
        text: needsTranslation ? "" : original,
        sourceText: needsTranslation ? original : undefined,
        sourceLabel: needsTranslation ? (hasKorean(original) ? "한국어" : "English") : undefined,
        translatedLabel: needsTranslation ? (hasKorean(original) ? "English" : "한국어") : undefined,
        translating: needsTranslation,
      },
    ]);

    const modelText = needsTranslation ? await translateLearnerMessage(learnerMessageId, original) : original;
    requestRealtimeResponse(modelText);
  };

  const startRealtimeSession = async (autoKoEnOverride = autoKoEn, force = false) => {
    if (!force && voiceStatus !== "idle") return;
    if (!agent) return;

    setVoiceStatus("connecting");
    try {
      const tokenResponse = await agentChatApi.createRealtimeClientSecret(agent.id, autoKoEnOverride, composeInstructions(instr) || undefined);
      const clientSecret = extractClientSecret(tokenResponse.raw);
      if (!clientSecret) throw new Error("Realtime client secret이 응답에 없습니다.");

      const pc = new RTCPeerConnection();
      peerRef.current = pc;
      pc.addTransceiver("audio", { direction: "recvonly" });

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.setAttribute("playsinline", "true");
      audio.controls = false;
      audio.style.display = "none";
      document.body.appendChild(audio);
      audioRef.current = audio;
      pc.ontrack = (event) => {
        audio.srcObject = event.streams[0];
        void audio.play().catch(() => {
          toast.error("브라우저가 오디오 자동재생을 막았습니다. 음성 세션 버튼을 다시 눌러주세요.");
        });
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });
      mediaStreamRef.current = stream;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !micMuted;
      });
      pc.addTrack(stream.getAudioTracks()[0]);

      const dataChannel = pc.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;
      dataChannel.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data) as RealtimePayload;
          const key = getRealtimeEventKey(payload);

          if (payload.type === "error") {
            handleRealtimeError(payload);
            return;
          }

          if (payload.type === "conversation.item.input_audio_transcription.completed") {
            void handleRealtimeTranscript(payload.transcript ?? "");
          }

          if (
            payload.type === "response.text.delta" ||
            payload.type === "response.output_text.delta" ||
            payload.type === "response.audio_transcript.delta" ||
            payload.type === "response.output_audio_transcript.delta"
          ) {
            appendRealtimeDelta(key, payload.delta ?? "");
          }

          if (
            payload.type === "response.text.done" ||
            payload.type === "response.output_text.done" ||
            payload.type === "response.audio_transcript.done" ||
            payload.type === "response.output_audio_transcript.done"
          ) {
            completedRealtimeItemsRef.current.add(key);
            finalizeRealtimeMessage(key, payload.transcript ?? payload.text ?? "");
          }

          if (payload.type === "response.done") {
            console.debug("Realtime response done", payload);
            if (!completedRealtimeItemsRef.current.has(key)) {
              const text = extractResponseText(payload.response);
              if (text) {
                completedRealtimeItemsRef.current.add(key);
                const messageId = `realtime-${key}`;
                appendRealtimeMessage("agent", text, { id: messageId });
                void translateAgentMessage(messageId, text);
              }
            }
            handleRealtimeResponseComplete();
          }
        } catch {
          console.debug("Realtime event", event.data);
        }
      });
      dataChannel.addEventListener("open", () => {
        sendRealtimeResponseCreate();
      });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Realtime 연결 실패: ${sdpResponse.status}`);
      }

      await pc.setRemoteDescription({
        type: "answer",
        sdp: await sdpResponse.text(),
      });

      setVoiceStatus("connected");
      scheduleRealtimeIdleTimeout();
      toast.success("Realtime 음성 세션이 연결되었습니다.");
    } catch (e) {
      peerRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioRef.current?.remove();
      peerRef.current = null;
      mediaStreamRef.current = null;
      audioRef.current = null;
      setVoiceStatus("idle");
      toastError(e, "Realtime 세션을 시작하지 못했습니다.");
    }
  };

  const toggleRealtimeSession = () => {
    if (voiceStatus === "connected") {
      stopRealtimeSession();
      return;
    }

    void startRealtimeSession();
  };

  const clearChatMessages = () => {
    realtimeTextRef.current.clear();
    completedRealtimeItemsRef.current.clear();
    stopSpeaking();
    ttsCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
    ttsCacheRef.current.clear();
    setMessages([]);
    setExpressionFeedback(null);
    setChunkAnalysis({});
    setOpenChunkId(null);
    toast.success("채팅 메시지를 지웠습니다.");
  };

  const requestExpressionFeedbackForText = async (text: string) => {
    const source = text.trim();
    if (!source) return;

    setExpressionFeedback({ source, content: "", loading: true });

    try {
      const response = await agentChatApi.getExpressionFeedback(source);
      setExpressionFeedback({ source, content: response.content, loading: false });
    } catch (error) {
      toastError(error, "표현 피드백을 가져오지 못했습니다.");
      setExpressionFeedback({
        source,
        content: "표현 피드백을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
        loading: false,
      });
    }
  };

  const requestExpressionFeedback = (message: ChatMessage) => {
    void requestExpressionFeedbackForText(getExpressionSource(message));
  };

  const requestChunkAnalysis = async (messageId: string, text: string) => {
    const source = text.trim();
    if (!source) return;

    setOpenChunkId(messageId);

    const existing = chunkAnalysis[messageId];
    // 이미 분석됐거나 분석 중이면 다이얼로그만 다시 연다
    if (existing && (existing.loading || existing.data || existing.error)) return;

    setChunkAnalysis((current) => ({
      ...current,
      [messageId]: { loading: true, source },
    }));

    try {
      const data = await agentChatApi.analyzeChunks(source);
      setChunkAnalysis((current) => ({
        ...current,
        [messageId]: { loading: false, source, data },
      }));
    } catch (error) {
      toastError(error, "청크 분석을 가져오지 못했습니다.");
      setChunkAnalysis((current) => ({
        ...current,
        [messageId]: {
          loading: false,
          source,
          error: "청크 분석을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
        },
      }));
    }
  };

  const toggleExpressionVoiceInput = () => {
    if (expressionListening) {
      expressionRecognitionRef.current?.stop();
      setExpressionListening(false);
      return;
    }

    const SpeechRecognition =
      (window as SpeechRecognitionWindow).SpeechRecognition ??
      (window as SpeechRecognitionWindow).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("이 브라우저는 보조 음성 입력을 지원하지 않습니다.");
      return;
    }

    const recognition = new SpeechRecognition();
    expressionRecognitionRef.current = recognition;
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length })
        .map((_, index) => event.results[index][0]?.transcript)
        .filter(Boolean)
        .join(" ")
        .trim();
      if (transcript) setExpressionDraft((current) => (current ? `${current} ${transcript}` : transcript));
    };
    recognition.onerror = () => {
      toast.error("음성 입력을 인식하지 못했습니다.");
      setExpressionListening(false);
    };
    recognition.onend = () => {
      setExpressionListening(false);
    };
    setExpressionListening(true);
    recognition.start();
  };

  const checkExpressionDraft = () => {
    void requestExpressionFeedbackForText(expressionDraft);
  };

  if (!agent) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] bg-muted/25">
        <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-7xl items-center justify-center px-4 py-4 sm:px-6">
          <div className="rounded-lg border border-border bg-background px-5 py-4 text-sm text-muted-foreground">
            에이전트 정보를 불러오는 중...
          </div>
        </div>
      </main>
    );
  }

  const accentClass = getAgentAccentClass(agent.id);
  const hasCustomInstructions = composeInstructions(instr).length > 0;

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/25">
      <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            대시보드
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground">
              <Volume2 className="h-4 w-4 text-primary" />
              {voiceStatusText}
            </div>
            <button
              type="button"
              onClick={openSettings}
              title="에이전트 지침(페르소나) 설정"
              className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors ${
                hasCustomInstructions
                  ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              {hasCustomInstructions ? "지침 (사용자 설정)" : "지침 설정"}
            </button>
            <button
              type="button"
              onClick={toggleRealtimeSession}
              disabled={voiceStatus === "connecting"}
              title="OpenAI Realtime API 실시간 음성 대화 (사용량 과금이 큰 고급 모드입니다)"
              className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                voiceStatus === "connected"
                  ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {voiceStatus === "connected"
                ? "실시간 종료"
                : voiceStatus === "connecting"
                  ? "연결 중"
                  : "실시간 회화 (고급)"}
            </button>
          </div>
        </div>

        <section className="mb-4 rounded-lg border border-border bg-background px-4 py-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <button
              type="button"
              onClick={openSettings}
              title="에이전트 지침(페르소나) 변경"
              className="group flex min-w-0 items-center gap-3 rounded-md text-left transition-colors hover:bg-accent/40"
            >
              <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md border transition-transform group-hover:scale-105 ${accentClass}`}>
                <Bot className="h-5 w-5" />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm group-hover:text-primary">
                  <Settings2 className="h-2.5 w-2.5" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight group-hover:text-primary">{agent.title}</h1>
                  <span className="text-xs font-semibold text-primary">{agent.subtitle}</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {agent.level}
                  </span>
                  {hasCustomInstructions && (
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      사용자 지침
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{agent.sessionGoal}</p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  AI 응답은 개인 OpenAI API 키가 필요합니다.
                  <Link href="/profile" className="font-semibold text-foreground underline-offset-4 hover:underline">
                    프로필에서 등록
                  </Link>
                </p>
              </div>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2.5 text-xs font-semibold text-muted-foreground">
                <Languages className="h-3.5 w-3.5 text-primary" />
                자동 번역
                <Switch
                  checked={autoKoEn}
                  onCheckedChange={toggleAutoKoEn}
                  disabled={voiceStatus === "connecting"}
                  aria-label="자동 번역"
                />
              </label>
              <label className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2.5 text-xs font-semibold text-muted-foreground">
                {micMuted ? <MicOff className="h-3.5 w-3.5 text-destructive" /> : <Mic className="h-3.5 w-3.5 text-primary" />}
                음소거
                <Switch
                  checked={micMuted}
                  onCheckedChange={toggleMicMuted}
                  disabled={voiceStatus === "connecting"}
                  aria-label="마이크 음소거"
                />
              </label>
              <label className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2.5 text-xs font-semibold text-muted-foreground">
                <Volume2 className="h-3.5 w-3.5 text-primary" />
                답변 읽기
                <Switch
                  checked={autoSpeak}
                  onCheckedChange={toggleAutoSpeak}
                  aria-label="AI 답변 자동 읽기"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">

          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background">
            <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight">{agent.title} 채팅</h2>
                <p className="text-sm text-muted-foreground">
                  텍스트 채팅 + 음성 입력 + 답변 읽어주기(TTS)로 연습하세요. 실시간 음성 대화는 우상단 고급 버튼으로 사용할 수 있습니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  title={autoKoEn ? "한국어와 영어 입력에 번역을 함께 표시" : "입력 원문만 표시"}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold ${
                    autoKoEn
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <Languages className="h-3.5 w-3.5" />
                  자동 번역
                </span>
                <span
                  title={micMuted ? "마이크 입력을 Realtime 세션으로 보내지 않음" : "마이크 입력 전송 중"}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold ${
                    micMuted
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {micMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  {micMuted ? "음소거" : "마이크"}
                </span>
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  {agent.level}
                </span>
                <button
                  type="button"
                  aria-label="채팅 메시지 지우기"
                  title="채팅 메시지 지우기"
                  onClick={clearChatMessages}
                  disabled={messages.length === 0 || sending}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 pb-8">
              {messages.length === 0 && !sending && (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${accentClass}`}>
                    <Bot className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    아래 문장으로 시작하거나, 자유롭게 말을 걸어보세요.
                  </p>
                  <div className="flex max-w-md flex-wrap justify-center gap-2">
                    {agent.starterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => {
                          setInput(prompt);
                          textAreaRef.current?.focus();
                        }}
                        className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((message) => {
                const isLearner = message.role === "learner";
                const isTyping =
                  !isLearner && message.streaming && !message.text.trim() && !message.sourceText;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isLearner ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-6 ${
                        isLearner
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-muted/35 text-foreground"
                      } whitespace-pre-wrap`}
                    >
                      {message.sourceText ? (
                        <div className="space-y-2 whitespace-normal">
                          <div>
                            <div
                              className={`mb-1 text-[10px] font-semibold uppercase ${
                                isLearner ? "text-primary-foreground/60" : "text-muted-foreground"
                              }`}
                            >
                              {message.sourceLabel ?? "원문"}
                            </div>
                            <div className="whitespace-pre-wrap">{message.sourceText}</div>
                          </div>
                          <div className={`border-t pt-2 ${isLearner ? "border-primary-foreground/20" : "border-border"}`}>
                            <div
                              className={`mb-1 text-[10px] font-semibold uppercase ${
                                isLearner ? "text-primary-foreground/60" : "text-muted-foreground"
                              }`}
                            >
                              {message.translatedLabel ?? "번역"}
                            </div>
                            <div className="whitespace-pre-wrap font-medium">
                              {message.translating ? "번역 중..." : message.translatedText}
                            </div>
                          </div>
                        </div>
                      ) : isTyping ? (
                        <TypingDots />
                      ) : (
                        message.text
                      )}
                      {isLearner && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-primary-foreground/20 pt-2">
                          <button
                            type="button"
                            onClick={() => void requestExpressionFeedback(message)}
                            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-primary-foreground/10 px-2 text-xs font-semibold text-primary-foreground/85 transition-colors hover:bg-primary-foreground/20"
                          >
                            <WandSparkles className="h-3.5 w-3.5" />
                            자연스러운 표현
                          </button>
                          {getExpressionSource(message).trim() && (
                            <button
                              type="button"
                              onClick={() => void speakMessage(message.id, getExpressionSource(message))}
                              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-primary-foreground/10 px-2 text-xs font-semibold text-primary-foreground/85 transition-colors hover:bg-primary-foreground/20"
                            >
                              {speakingMessageId === message.id ? (
                                <>
                                  <Square className="h-3.5 w-3.5" />
                                  중지
                                </>
                              ) : (
                                <>
                                  <Volume2 className="h-3.5 w-3.5" />
                                  듣기
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                      {!isLearner && !message.streaming && (message.sourceText ?? message.text).trim() && (
                        <div className="mt-3 border-t border-border pt-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void speakMessage(message.id, (message.sourceText ?? message.text).trim())}
                              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-muted px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                              {speakingMessageId === message.id ? (
                                <>
                                  <Square className="h-3.5 w-3.5" />
                                  중지
                                </>
                              ) : (
                                <>
                                  <Volume2 className="h-3.5 w-3.5" />
                                  듣기
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void requestChunkAnalysis(message.id, (message.sourceText ?? message.text).trim())
                              }
                              disabled={chunkAnalysis[message.id]?.loading}
                              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-muted px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
                            >
                              {chunkAnalysis[message.id]?.loading ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  분석 중
                                </>
                              ) : (
                                <>
                                  <ListTree className="h-3.5 w-3.5" />
                                  청크 분석
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {sending &&
                !messages.some(
                  (m) => m.role === "agent" && m.streaming && !m.text.trim() && !m.sourceText
                ) && (
                  <div className="flex justify-start">
                    <div className="rounded-lg border border-border bg-muted/35 px-4 py-3">
                      <TypingDots />
                    </div>
                  </div>
                )}
              <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            <footer className="border-t border-border p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  title="대화 흐름에 맞춰 다음에 내가 할 영어 답변을 한 줄 추천받습니다 (입력창에 채워짐)"
                  onClick={() => void requestSuggestedReply()}
                  disabled={suggestingReply}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {suggestingReply ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <WandSparkles className="h-3.5 w-3.5" />
                  )}
                  {suggestingReply ? "추천 중..." : "추천 답변"}
                </button>
                <button
                  type="button"
                  onClick={toggleInputVoiceInput}
                  disabled={inputTranscribing}
                  title="마이크로 영어를 말하면 OpenAI 음성 인식으로 정확하게 받아써 줍니다"
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    inputListening
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {inputListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  {inputTranscribing ? "인식 중..." : inputListening ? "녹음 중지" : "음성 입력"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInput("Let's talk about something casual from daily life.");
                    textAreaRef.current?.focus();
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  가벼운 대화
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/25 p-2">
                <textarea
                  ref={textAreaRef}
                  rows={2}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                      void sendMessage();
                    }
                  }}
                  placeholder="영어나 한국어로 편하게 답변해보세요. (⌘/Ctrl + Enter 전송)"
                  className="min-h-12 flex-1 resize-none self-stretch bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  aria-label="메시지 전송"
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="inline-flex h-11 shrink-0 items-center gap-1.5 self-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  전송
                </button>
              </div>
            </footer>
          </section>

          <aside className="flex min-h-[320px] min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-background xl:min-h-0">
            <header className="border-b border-border px-4 py-3">
              <h2 className="text-base font-bold tracking-tight">표현 준비</h2>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/25 p-3">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Draft</p>
                  <textarea
                    rows={4}
                    value={expressionDraft}
                    onChange={(event) => setExpressionDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                        checkExpressionDraft();
                      }
                    }}
                    placeholder="한국어로 먼저 말하고 싶은 내용을 적거나 음성으로 입력해보세요."
                    className="mt-2 min-h-24 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={checkExpressionDraft}
                      disabled={!expressionDraft.trim() || expressionFeedback?.loading}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <WandSparkles className="h-3.5 w-3.5" />
                      표현 확인
                    </button>
                    <button
                      type="button"
                      onClick={toggleExpressionVoiceInput}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {expressionListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      {expressionListening ? "중지" : "음성 입력"}
                    </button>
                  </div>
                </div>

                {!expressionFeedback ? (
                  <div className="rounded-lg border border-dashed border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
                    먼저 표현을 확인하거나, 대화 메시지 아래의 자연스러운 표현 버튼을 눌러보세요.
                  </div>
                ) : (
                  <>
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Selected sentence</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6">{expressionFeedback.source}</p>
                  </div>

                  {expressionFeedback.loading ? (
                    <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                      표현을 확인하는 중...
                    </div>
                  ) : getExpressionSuggestions(expressionFeedback).length > 0 ? (
                    <>
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase text-primary">추천 표현</p>
                        {getExpressionSuggestions(expressionFeedback).map((suggestion, index) => (
                          <div key={`${index}-${suggestion}`} className="rounded-lg border border-border bg-background p-3">
                            <p className="text-sm font-medium leading-6">{suggestion}</p>
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() => void speakMessage(suggestion, suggestion)}
                                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                              >
                                {speakingMessageId === suggestion ? (
                                  <>
                                    <Square className="h-3.5 w-3.5" />
                                    중지
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="h-3.5 w-3.5" />
                                    듣기
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setInput(suggestion);
                                  textAreaRef.current?.focus();
                                }}
                                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-primary px-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                              >
                                <Send className="h-3.5 w-3.5" />
                                바로 입력
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {getExpressionReason(expressionFeedback) && (
                        <details className="rounded-lg border border-border bg-muted/20 p-3">
                          <summary className="cursor-pointer text-[10px] font-semibold uppercase text-muted-foreground">
                            왜 더 자연스러운가
                          </summary>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {getExpressionReason(expressionFeedback)}
                          </p>
                        </details>
                      )}
                    </>
                  ) : (
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Feedback</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{expressionFeedback.content}</p>
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>

      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-bold tracking-tight">에이전트 지침 설정</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  이 세션에만 적용되는 개인 지침입니다. 텍스트 채팅은 다음 메시지부터, 실시간 음성은 즉시 반영됩니다.
                </p>
              </div>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setSettingsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
                {INSTRUCTION_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSettingsTab(tab.key)}
                    className={`relative -mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                      settingsTab === tab.key
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {instrDraft[tab.key].trim() && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${settingsTab === tab.key ? "bg-primary" : "bg-primary/50"}`}
                        aria-label="작성됨"
                      />
                    )}
                  </button>
                ))}
              </div>

              {INSTRUCTION_TABS.filter((tab) => tab.key === settingsTab).map((tab) => (
                <div key={tab.key} className="relative">
                  {tab.key === "news" && (
                    <button
                      type="button"
                      onClick={loadNews}
                      disabled={newsLoading}
                      title="구글 뉴스에서 오늘 헤드라인을 가져옵니다"
                      className="absolute right-2 top-2 z-10 inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Newspaper className="h-3.5 w-3.5" />
                      {newsLoading ? "불러오는 중..." : "오늘 뉴스 가져오기"}
                    </button>
                  )}
                  <textarea
                    rows={11}
                    value={instrDraft[tab.key]}
                    onChange={(event) => setInstrDraft((draft) => ({ ...draft, [tab.key]: event.target.value }))}
                    placeholder={tab.placeholder}
                    className={`w-full resize-y rounded-md border border-border bg-background px-3 pb-2 text-sm leading-6 outline-none placeholder:text-muted-foreground ${
                      tab.key === "news" ? "pt-11" : "pt-2"
                    }`}
                  />
                </div>
              ))}
              <p className="mt-2 text-xs text-muted-foreground">
                다섯 항목은 하나의 지침으로 합쳐 적용됩니다. 모두 비우면 이 에이전트의 기본 지침을 사용합니다.
              </p>
            </div>

            <footer className="flex items-center justify-between gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  const hasAny = Object.values(instrDraft).some((v) => v.trim());
                  if (hasAny && !confirm("작성한 5개 항목을 모두 비울까요?")) return;
                  setInstrDraft(EMPTY_INSTRUCTIONS);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-dashed border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                전체 비우기
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={saveSettings}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Settings2 className="h-4 w-4" />
                  저장
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
      <ChunkAnalysisDialog
        open={openChunkId !== null}
        state={openChunkId ? chunkAnalysis[openChunkId] : undefined}
        onClose={() => setOpenChunkId(null)}
      />
    </main>
  );
}
