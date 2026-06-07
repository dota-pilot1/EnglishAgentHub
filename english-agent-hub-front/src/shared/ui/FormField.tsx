"use client";

import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  const { t } = useTranslation("form");
  // error may be an i18n key from our zod schemas, or a server-provided
  // plain message. i18next returns the key itself when missing, so this
  // gracefully falls back.
  const message = error ? t(error, { defaultValue: error }) : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {message ? (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-xs text-destructive"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-[1px]" />
          <span>{message}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
