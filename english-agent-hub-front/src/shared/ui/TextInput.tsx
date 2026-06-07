"use client";

import { forwardRef } from "react";

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ invalid, className = "", ...rest }, ref) {
    const base =
      "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:ring-2";
    const state = invalid
      ? "border-destructive/60 focus:ring-destructive/40"
      : "border-input focus:ring-ring";
    return <input ref={ref} className={`${base} ${state} ${className}`} {...rest} />;
  },
);
