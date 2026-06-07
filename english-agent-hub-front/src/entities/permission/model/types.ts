import type { PermissionCategorySummary } from "@/entities/permission-category/model/types";

export type PermissionSummary = {
  id: number;
  code: string;
  name: string;
  category: PermissionCategorySummary | null;
};

export type Permission = PermissionSummary & {
  description?: string | null;
  createdAt: string;
};
