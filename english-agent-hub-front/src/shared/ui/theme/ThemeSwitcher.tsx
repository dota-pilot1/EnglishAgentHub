"use client";

import { useEffect, useRef, useState } from "react";
import { Palette, Check } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import { THEME_COLORS, themeColorStore, themeColorActions } from "./themeStore";

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = useStore(themeColorStore, (s) => s.color);
  const active = THEME_COLORS.find((t) => t.id === current) ?? THEME_COLORS[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="테마 색상 변경"
        className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1.5 text-foreground hover:bg-muted transition-colors"
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ring-background shadow-sm"
          style={{ backgroundColor: active.color }}
        >
          <Palette className="h-3 w-3 text-white/90" />
        </span>
        <span className="hidden sm:inline text-sm font-medium leading-none">
          {active.label}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-border bg-background shadow-lg z-50 py-1 overflow-hidden">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            테마 색상
          </p>
          {THEME_COLORS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                themeColorActions.set(t.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <span
                  className="h-3.5 w-3.5 rounded-full ring-1 ring-border"
                  style={{ backgroundColor: t.color }}
                />
                <span>{t.label}</span>
              </span>
              {current === t.id && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
