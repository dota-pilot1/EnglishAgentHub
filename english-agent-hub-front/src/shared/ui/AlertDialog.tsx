"use client";

import { useEffect, useRef } from "react";

type Variant = "warning" | "error" | "info";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  variant?: Variant;
  onConfirm: () => void;
};

const variantStyles: Record<Variant, { icon: string; iconClass: string; btnClass: string }> = {
  warning: {
    icon: "⚠️",
    iconClass: "text-yellow-500",
    btnClass: "bg-yellow-500 text-white hover:opacity-90",
  },
  error: {
    icon: "🚫",
    iconClass: "text-destructive",
    btnClass: "bg-destructive text-white hover:opacity-90",
  },
  info: {
    icon: "ℹ️",
    iconClass: "text-blue-500",
    btnClass: "bg-primary text-primary-foreground hover:opacity-90",
  },
};

export function AlertDialog({
  open,
  title,
  description,
  confirmText = "확인",
  variant = "warning",
  onConfirm,
}: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => btnRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onConfirm]);

  if (!open) return null;

  const styles = variantStyles[variant];

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-lg">
        <div className="flex items-start gap-3">
          <span className={`text-2xl leading-none mt-0.5 ${styles.iconClass}`}>{styles.icon}</span>
          <div className="flex-1">
            <h2 id="alert-dialog-title" className="text-base font-semibold">
              {title}
            </h2>
            {description && (
              <p className="mt-1.5 text-sm text-muted-foreground whitespace-pre-line">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            ref={btnRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-opacity ${styles.btnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
