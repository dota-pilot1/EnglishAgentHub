import { api } from "@/shared/api/axios";

export type OpenAiApiKeyResponse = {
  configured: boolean;
  maskedKey: string;
};

export type OpenAiApiKeyValidationResponse = {
  valid: boolean;
  message: string;
};

export const userApiKeyApi = {
  getOpenAi: () =>
    api.get<OpenAiApiKeyResponse>("/api/users/me/api-key/openai").then((r) => r.data),

  saveOpenAi: (apiKey: string) =>
    api
      .put<OpenAiApiKeyResponse>("/api/users/me/api-key/openai", { apiKey })
      .then((r) => r.data),

  deleteOpenAi: () =>
    api.delete<void>("/api/users/me/api-key/openai").then(() => undefined),

  validateOpenAi: () =>
    api
      .post<OpenAiApiKeyValidationResponse>("/api/users/me/api-key/openai/validate")
      .then((r) => r.data),
};
