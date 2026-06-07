"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { signupSchema, type SignupFormValues } from "@/shared/lib/validation/auth.schema";
import { authApi } from "@/entities/user/api/authApi";
import { getApiError, getFieldErrors } from "@/shared/api/errors";
import { FormField } from "@/shared/ui/FormField";
import { TextInput } from "@/shared/ui/TextInput";
import { PasswordInput } from "@/shared/ui/PasswordInput";

export function SignupForm() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const payload = {
        email: values.email,
        username: values.username,
        password: values.password,
      };
      await authApi.signup(payload);
      toast.success(t("signupSuccess"));
      router.push("/login");
    } catch (e) {
      const apiError = getApiError(e);
      const fields = getFieldErrors(e);

      (Object.keys(fields) as Array<keyof SignupFormValues>).forEach((k) => {
        setError(k, { type: "server", message: fields[k as string] });
      });

      if (apiError && Object.keys(fields).length === 0) {
        if (apiError.code === "AUTH_001") {
          setError("email", { type: "server", message: apiError.message });
        } else {
          setFormError(apiError.message);
        }
      } else if (!apiError) {
        setFormError(t("signupFailed"));
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      <FormField label={t("email")} htmlFor="signup-email" error={errors.email?.message}>
        <TextInput
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          invalid={!!errors.email}
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      <FormField label={t("username")} htmlFor="signup-username" error={errors.username?.message}>
        <TextInput
          id="signup-username"
          type="text"
          autoComplete="name"
          placeholder={t("usernamePlaceholder")}
          invalid={!!errors.username}
          aria-invalid={!!errors.username}
          {...register("username")}
        />
      </FormField>

      <FormField
        label={t("password")}
        htmlFor="signup-password"
        error={errors.password?.message}
        hint={errors.password ? undefined : t("passwordPlaceholder")}
      >
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          placeholder="••••••••"
          invalid={!!errors.password}
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <FormField
        label={t("passwordConfirm")}
        htmlFor="signup-password-confirm"
        error={errors.passwordConfirm?.message}
      >
        <PasswordInput
          id="signup-password-confirm"
          autoComplete="new-password"
          placeholder={t("passwordConfirmPlaceholder")}
          invalid={!!errors.passwordConfirm}
          aria-invalid={!!errors.passwordConfirm}
          {...register("passwordConfirm")}
        />
      </FormField>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
      >
        <UserPlus className="h-4 w-4" />
        {isSubmitting ? t("signingUp") : t("signUpButton")}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/login" className="underline hover:text-foreground">
          {t("signInLink")}
        </Link>
      </p>
    </form>
  );
}
