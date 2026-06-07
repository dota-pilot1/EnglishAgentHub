import { api } from "@/shared/api/axios";

export type CharacterResponse = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  level: string;
  sessionGoal: string;
  skills: string[];
  starterPrompts: string[];
  systemPrompt: string;
  custom: boolean;
  createdById: number | null;
  createdByName: string | null;
  style: string | null;
  scenario: string | null;
  character: string | null;
  knowledge: string | null;
  news: string | null;
  schedule: string | null;
};

export type CharacterUpsertRequest = {
  title: string;
  subtitle?: string;
  description?: string;
  level?: string;
  sessionGoal?: string;
  skills?: string[];
  starterPrompts?: string[];
  style?: string;
  scenario?: string;
  character?: string;
  knowledge?: string;
  news?: string;
  schedule?: string;
};

export const characterApi = {
  list: () => api.get<CharacterResponse[]>("/api/characters").then((r) => r.data),
  get: (id: string) => api.get<CharacterResponse>(`/api/characters/${id}`).then((r) => r.data),
  create: (body: CharacterUpsertRequest) =>
    api.post<CharacterResponse>("/api/characters", body).then((r) => r.data),
  update: (id: string, body: CharacterUpsertRequest) =>
    api.put<CharacterResponse>(`/api/characters/${id}`, body).then((r) => r.data),
  delete: (id: string) =>
    api.delete<void>(`/api/characters/${id}`).then(() => undefined),
};
