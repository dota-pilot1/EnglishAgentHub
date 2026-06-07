import { api } from "@/shared/api/axios";
import type { PermissionCategory } from "../model/types";

export type CreatePermissionCategoryBody = {
  code: string;
  name: string;
  description?: string;
};

export type UpdatePermissionCategoryBody = {
  name: string;
  description?: string;
};

export const permissionCategoryApi = {
  list: () =>
    api.get<PermissionCategory[]>("/api/permission-categories").then((r) => r.data),

  get: (id: number) =>
    api.get<PermissionCategory>(`/api/permission-categories/${id}`).then((r) => r.data),

  create: (body: CreatePermissionCategoryBody) =>
    api.post<PermissionCategory>("/api/permission-categories", body).then((r) => r.data),

  update: (id: number, body: UpdatePermissionCategoryBody) =>
    api.patch<PermissionCategory>(`/api/permission-categories/${id}`, body).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/permission-categories/${id}`).then((r) => r.data),
};
