"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authActions, useAuth } from "@/entities/user/model/authStore";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const normalizedPathname =
    pathname && pathname !== "/" ? pathname.replace(/\/+$/, "") || "/" : pathname;

  useEffect(() => {
    authActions.restore();
  }, []);

  useEffect(() => {
    const onLogout = () => {
      authActions.forceAnonymous();
      if (normalizedPathname !== "/login") {
        router.replace("/login");
      }
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [normalizedPathname, router]);

  return <>{children}</>;
}
