"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LoginForm } from "@/features/auth/login/LoginForm";
import { AuthLayout } from "@/shared/ui/AuthLayout";

function LoginPageInner() {
  const { t } = useTranslation("auth");
  const params = useSearchParams();
  const nextParam = params.get("next");
  const nextPath = nextParam ?? undefined;

  return (
    <AuthLayout title={t("signInTitle")} subtitle={t("signInSubtitle")}>
      <LoginForm nextPath={nextPath} />
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
