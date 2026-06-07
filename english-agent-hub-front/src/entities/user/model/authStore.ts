"use client";

import { Store, useStore } from "@tanstack/react-store";
import { tokenStorage } from "@/shared/api/tokenStorage";
import { authApi } from "../api/authApi";
import type { User } from "./types";

export type AuthState = {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "anonymous";
};

export const authStore = new Store<AuthState>({
  user: null,
  status: "idle",
});

let restorePromise: Promise<void> | null = null;

export const authActions = {
  async login(email: string, password: string): Promise<User> {
    authStore.setState((s) => ({ ...s, status: "loading" }));
    const res = await authApi.login({ email, password });
    tokenStorage.set(res.accessToken, res.refreshToken);
    authStore.setState({ user: res.user, status: "authenticated" });
    return res.user;
  },

  async restore(): Promise<void> {
    if (restorePromise) {
      return restorePromise;
    }

    restorePromise = (async () => {
    const token = tokenStorage.getAccess();
    if (!token) {
      authStore.setState({ user: null, status: "anonymous" });
      return;
    }
    authStore.setState((s) => ({ ...s, status: "loading" }));
    try {
      const user = await authApi.me();
      authStore.setState({ user, status: "authenticated" });
    } catch {
      tokenStorage.clear();
      authStore.setState({ user: null, status: "anonymous" });
    }
    })();

    try {
      await restorePromise;
    } finally {
      restorePromise = null;
    }
  },

  async logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch {
      // 서버 실패해도 클라이언트 상태는 정리
    }
    tokenStorage.clear();
    authStore.setState({ user: null, status: "anonymous" });
  },

  forceAnonymous(): void {
    tokenStorage.clear();
    authStore.setState({ user: null, status: "anonymous" });
  },
};

export function useAuth() {
  return useStore(authStore);
}
