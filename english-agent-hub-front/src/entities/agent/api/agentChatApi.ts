import { api } from "@/shared/api/axios";
import { tokenStorage } from "@/shared/api/tokenStorage";
import type { LearningAgent } from "@/entities/agent/model/learningAgents";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4301";

export type AiChatMessage = {
  agentId: string;
  message: string;
  instructions?: string;
};

export type AiChatMessageResponse = {
  agentId: string;
  content: string;
  createdAt: string;
};

export type RealtimeClientSecretResponse = {
  model: string;
  voice: string;
  raw: Record<string, unknown>;
};

export type TranslateToEnglishResponse = {
  text: string;
};

export type TranslateToKoreanResponse = {
  text: string;
};

export type ExpressionFeedbackResponse = {
  content: string;
};

async function refreshTokens(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error("no refresh token");

  const response = await fetch(`${baseURL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) throw new Error(`refresh failed: ${response.status}`);

  const data: { accessToken: string; refreshToken: string } = await response.json();
  tokenStorage.set(data.accessToken, data.refreshToken);
  return data.accessToken;
}

async function fetchMessageStream(body: AiChatMessage, token: string | null) {
  return fetch(`${baseURL}/api/ai/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export const agentChatApi = {
  getAgents: () => api.get<LearningAgent[]>("/api/agents").then((r) => r.data),

  getAgent: (agentId: string) => api.get<LearningAgent>(`/api/agents/${agentId}`).then((r) => r.data),

  sendMessage: (body: AiChatMessage) =>
    api.post<AiChatMessageResponse>("/api/ai/chat", body).then((r) => r.data),

  streamMessage: async (body: AiChatMessage, onDelta: (delta: string) => void) => {
    let response = await fetchMessageStream(body, tokenStorage.getAccess());

    if (response.status === 401) {
      try {
        response = await fetchMessageStream(body, await refreshTokens());
      } catch (error) {
        tokenStorage.clear();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        throw error;
      }
    }

    if (!response.ok || !response.body) {
      throw new Error(`stream failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      events.forEach((event) => {
        const lines = event.split("\n");
        const eventName = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
        const data = lines
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5))
          .join("\n");

        if (eventName === "error") throw new Error(data || "stream failed");
        if (data) onDelta(data);
      });
    }

    if (buffer.trim()) {
      const lines = buffer.split("\n");
      const eventName = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
      const data = lines
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5))
        .join("\n");

      if (eventName === "error") throw new Error(data || "stream failed");
      if (data) onDelta(data);
    }
  },

  createRealtimeClientSecret: (agentId: string, autoKoEn = false, instructions?: string) =>
    api
      .post<RealtimeClientSecretResponse>("/api/realtime/client-secret", { agentId, autoKoEn, instructions })
      .then((r) => r.data),

  translateToEnglish: (text: string) =>
    api
      .post<TranslateToEnglishResponse>("/api/ai/translate-to-english", { text })
      .then((r) => r.data),

  translateToKorean: (text: string) =>
    api
      .post<TranslateToKoreanResponse>("/api/ai/translate-to-korean", { text })
      .then((r) => r.data),

  getExpressionFeedback: (text: string) =>
    api
      .post<ExpressionFeedbackResponse>("/api/ai/expression-feedback", { text })
      .then((r) => r.data),

  synthesizeSpeech: (text: string) =>
    api
      .post<ArrayBuffer>(
        "/api/ai/speech",
        { text },
        { responseType: "arraybuffer", timeout: 30_000 }
      )
      .then((r) => r.data),

  transcribeAudio: async (audio: Blob, language = "en") => {
    const ext = audio.type.includes("ogg")
      ? "ogg"
      : audio.type.includes("mp4")
        ? "mp4"
        : audio.type.includes("mpeg")
          ? "mp3"
          : "webm";
    const form = new FormData();
    form.append("file", audio, `audio.${ext}`);
    form.append("language", language);

    const doFetch = (token: string | null) =>
      fetch(`${baseURL}/api/ai/transcribe`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });

    let response = await doFetch(tokenStorage.getAccess());
    if (response.status === 401) {
      response = await doFetch(await refreshTokens());
    }
    if (!response.ok) throw new Error(`transcribe failed: ${response.status}`);
    return (await response.json()) as { text: string };
  },
};
