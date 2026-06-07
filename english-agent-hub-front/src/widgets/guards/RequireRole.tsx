"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/entities/user/model/authStore";

type Props = {
  roles: string[];
  children: React.ReactNode;
};

export function RequireRole({ roles, children }: Props) {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && user && !roles.includes(user.role.code)) {
      router.replace("/unauthorized");
    }
  }, [status, user, roles, router]);

  if (status === "idle" || status === "loading") return null;
  if (status === "anonymous") return null;
  if (user && roles.includes(user.role.code)) return <>{children}</>;
  return null;
}
