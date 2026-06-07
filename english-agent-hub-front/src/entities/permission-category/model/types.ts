export type PermissionCategorySummary = {
  id: number;
  code: string;
  name: string;
};

export type PermissionCategory = PermissionCategorySummary & {
  description?: string | null;
  displayOrder: number;
  createdAt: string;
};
