import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "./tokenStorage";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4301";

export const api = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

const AUTH_PATHS = ["/api/auth/login", "/api/auth/signup", "/api/auth/refresh"];
const PUBLIC_PATHS = ["/api/agents", "/api/site-settings", "/api/menus"];

api.interceptors.request.use((config) => {
  if (AUTH_PATHS.some((p) => config.url?.includes(p))) return config;
  if (PUBLIC_PATHS.some((p) => config.url?.startsWith(p))) return config;
  const token = tokenStorage.getAccess();
  if (token) {
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

type Retryable = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (e: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
}

async function refreshTokens(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error("no refresh token");
  const res = await fetch(`${baseURL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
  const data: { accessToken: string; refreshToken: string } = await res.json();
  tokenStorage.set(data.accessToken, data.refreshToken);
  return data.accessToken;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as Retryable | undefined;
    const status = error.response?.status;

    if (status !== 401 || !original || original._retry) return Promise.reject(error);
    if (AUTH_PATHS.some((p) => original.url?.includes(p))) return Promise.reject(error);

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken: string) => {
            (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshTokens();
      flushQueue(null, newToken);
      (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (e) {
      flushQueue(e, null);
      tokenStorage.clear();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export function isAxiosError<T = unknown>(e: unknown): e is AxiosError<T> {
  return axios.isAxiosError(e);
}
