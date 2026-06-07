"use client";

import { useTranslation } from "react-i18next";
import type { RoleSummary } from "@/entities/user/model/types";

const ROLE_STYLES: Record<string, string> = {
  ROLE_ADMIN: "bg-red-500/10 text-red-600",
  ROLE_MANAGER: "bg-amber-500/10 text-amber-600",
  ROLE_STYLIST: "bg-blue-500/10 text-blue-600",
  ROLE_CUSTOMER: "bg-slate-500/10 text-slate-500",
};

const DEFAULT_STYLE = "bg-muted text-muted-foreground";

export function RoleBadge({ role }: { role: RoleSummary }) {
  const { t } = useTranslation("nav");
  const style = ROLE_STYLES[role.code] ?? DEFAULT_STYLE;
  const label = t(`roles.${role.code}`, { defaultValue: role.name });
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium leading-none ${style}`}
      title={role.code}
    >
      {label}
    </span>
  );
}
