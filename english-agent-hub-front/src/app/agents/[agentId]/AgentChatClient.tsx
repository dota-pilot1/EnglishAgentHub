"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bot, Mic, Paperclip, Send, Trash2, Volume2, WandSparkles } from "lucide-react";
import { agentChatApi } from "@/entities/agent/api/agentChatApi";
import type { LearningAgent } from "@/entities/agent/model/learningAgents";
import { toast, toastError } from "@/shared/lib/toast";

type ChatMessage = {
  id: string;
  role: "agent" | "learner";
  text: string;
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

export function AgentChatClient({ agentId }: { agentId: string }) {
  const [agent, setAgent] = useState<LearningAgent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const realtimeTextRef = useRef(new Map<string, string>());
  const completedRealtimeItemsRef = useRef(new Set<string>());

  const voiceStatusText = useMemo(() => {
    if (voiceStatus === "connected") return "Realtime 연결됨";
    if (voiceStatus === "connecting") return "Realtime 연결 중";
    return "Realtime 연결 대기";
  }, [voiceStatus]);

  useEffect(() => {
    let mounted = true;

    agentChatApi
      .getAgent(agentId)
      .then((data) => {
        if (mounted) setAgent(data);
      })
      .catch((error) => {
        toastError(error, "에이전트 정보를 가져오지 못했습니다.");
      });

    return () => {
      mounted = false;
      peerRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [agentId]);

  const appendRealtimeMessage = (role: ChatMessage["role"], text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((current) => {
      const last = current.at(-1);
      if (last?.role === role && last.text === trimmed) return current;
      return [...current, { id: crypto.randomUUID(), role, text: trimmed }];
    });
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
  };

  const stopRealtimeSession = () => {
    peerRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioRef.current?.remove();
    peerRef.current = null;
    dataChannelRef.current = null;
    mediaStreamRef.current = null;
    audioRef.current = null;
    realtimeTextRef.current.clear();
    completedRealtimeItemsRef.current.clear();
    setVoiceStatus("idle");
    toast.success("Realtime 음성 세션이 종료되었습니다.");
  };

  const sendMessage = async () => {
    const message = input.trim();
    if (!agent || !message || sending) return;

    setInput("");

    const dataChannel = dataChannelRef.current;
    if (voiceStatus === "connected" && dataChannel?.readyState === "open") {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "learner", text: message }]);
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
      dataChannel.send(
        JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            instructions: agent.description,
          },
        })
      );
      return;
    }

    setSending(true);
    const agentResponseId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "learner", text: message },
      { id: agentResponseId, role: "agent", text: "", streaming: true },
    ]);

    try {
      await agentChatApi.streamMessage({ agentId: agent.id, message }, (delta) => {
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

  const startRealtimeSession = async () => {
    if (voiceStatus !== "idle") return;
    if (!agent) return;

    setVoiceStatus("connecting");
    try {
      const tokenResponse = await agentChatApi.createRealtimeClientSecret(agent.id);
      const clientSecret = extractClientSecret(tokenResponse.raw);
      if (!clientSecret) throw new Error("Realtime client secret이 응답에 없습니다.");

      const pc = new RTCPeerConnection();
      peerRef.current = pc;
      pc.addTransceiver("audio", { direction: "recvonly" });

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.playsInline = true;
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

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      pc.addTrack(stream.getAudioTracks()[0]);

      const dataChannel = pc.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;
      dataChannel.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data) as RealtimePayload;
          const key = getRealtimeEventKey(payload);

          if (payload.type === "conversation.item.input_audio_transcription.completed") {
            appendRealtimeMessage("learner", payload.transcript ?? "");
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
                appendRealtimeMessage("agent", text);
              }
            }
          }
        } catch {
          console.debug("Realtime event", event.data);
        }
      });
      dataChannel.addEventListener("open", () => {
        dataChannel.send(
          JSON.stringify({
            type: "response.create",
            response: {
              modalities: ["audio", "text"],
              instructions: "Greet the learner briefly and ask one short question to start the practice.",
            },
          })
        );
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
      toast.success("Realtime 음성 세션이 연결되었습니다.");
    } catch (e) {
      peerRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
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
    setMessages([]);
    toast.success("채팅 메시지를 지웠습니다.");
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

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/25">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-7xl flex-col px-4 py-4 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            대시보드
          </Link>
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground">
            <Volume2 className="h-4 w-4 text-primary" />
            {voiceStatusText}
          </div>
        </div>

        <section className="grid flex-1 gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="flex flex-col rounded-lg border border-border bg-background p-5">
            <div className={`flex h-14 w-14 items-center justify-center rounded-md border ${accentClass}`}>
              <Bot className="h-7 w-7" />
            </div>
            <p className="mt-5 text-sm font-semibold text-primary">{agent.subtitle}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{agent.title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{agent.description}</p>

            <div className="mt-5 rounded-md border border-border bg-muted/35 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Session Goal</p>
              <p className="mt-2 text-sm font-semibold leading-6">{agent.sessionGoal}</p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold">추천 시작 문장</p>
              <div className="mt-3 space-y-2">
                {agent.starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setInput(prompt);
                      textAreaRef.current?.focus();
                    }}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-5">
              <button
                type="button"
                onClick={toggleRealtimeSession}
                disabled={voiceStatus === "connecting"}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mic className="h-4 w-4" />
                {voiceStatus === "connected" ? "음성 세션 중지" : voiceStatus === "connecting" ? voiceStatusText : "음성 세션 시작"}
              </button>
            </div>
          </aside>

          <section className="flex min-h-[640px] flex-col overflow-hidden rounded-lg border border-border bg-background">
            <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight">{agent.title} 채팅</h2>
                <p className="text-sm text-muted-foreground">
                  텍스트는 Spring AI로 응답하고, 음성은 GPT Realtime API 세션으로 연결합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
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

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {messages.map((message) => {
                const isLearner = message.role === "learner";

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
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-lg border border-border bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
                    응답 생성 중...
                  </div>
                </div>
              )}
            </div>

            <footer className="border-t border-border p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInput("Give me a helpful English hint for my next answer.");
                    textAreaRef.current?.focus();
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <WandSparkles className="h-3.5 w-3.5" />
                  힌트
                </button>
                <button
                  type="button"
                  onClick={toggleRealtimeSession}
                  disabled={voiceStatus === "connecting"}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Mic className="h-3.5 w-3.5" />
                  {voiceStatus === "connected" ? "중지" : voiceStatus === "connecting" ? "연결 중" : "말하기"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInput("I will paste an article. Please summarize it and ask me a debate question.\n\n");
                    textAreaRef.current?.focus();
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  기사 첨부
                </button>
              </div>

              <div className="flex items-end gap-2 rounded-lg border border-border bg-muted/25 p-2">
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
                  placeholder="영어로 답변하거나 기사 내용을 붙여넣으세요."
                  className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  aria-label="메시지 전송"
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </footer>
          </section>
        </section>
      </div>
    </main>
  );
}
