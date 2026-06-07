"use client";

import { Store } from "@tanstack/react-store";

export const THEME_COLORS = [
  { id: "default", label: "Default", color: "#18181b" },
  { id: "rose", label: "Rose", color: "#ec4899" },
  { id: "amber", label: "Amber", color: "#f59e0b" },
  { id: "mint", label: "Mint", color: "#10b981" },
  { id: "lavender", label: "Lavender", color: "#a78bfa" },
  { id: "peach", label: "Peach", color: "#fb923c" },
  { id: "sky", label: "Sky", color: "#38bdf8" },
] as const;

export type ThemeColorId = (typeof THEME_COLORS)[number]["id"];

const STORAGE_KEY = "theme-color";

function isValidColor(v: string | null): v is ThemeColorId {
  return !!v && THEME_COLORS.some((t) => t.id === v);
}

function readInitial(): ThemeColorId {
  if (typeof window === "undefined") return "default";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isValidColor(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "default";
}

export const themeColorStore = new Store<{ color: ThemeColorId }>({
  color: "default",
});

export const themeColorActions = {
  hydrate() {
    const next = readInitial();
    themeColorStore.setState({ color: next });
    applyToDom(next);
  },
  set(next: ThemeColorId) {
    themeColorStore.setState({ color: next });
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyToDom(next);
  },
};

function applyToDom(color: ThemeColorId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (color === "default") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", color);
  }
}
