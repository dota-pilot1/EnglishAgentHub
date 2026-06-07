import { api } from "@/shared/api/axios";
import type { Permission } from "../model/types";

export type CreatePermissionBody = {
  code: string;
  name: string;
  description?: string;
  categoryCode: string;
};

export type UpdatePermissionBody = {
  name: string;
  description?: string;
  categoryCode: string;
};

export const permissionApi = {
  list: (category?: string) =>
    api
      .get<Permission[]>("/api/permissions", { params: category ? { category } : undefined })
      .then((r) => r.data),

  get: (id: number) =>
    api.get<Permission>(`/api/permissions/${id}`).then((r) => r.data),

  create: (body: CreatePermissionBody) =>
    api.post<Permission>("/api/permissions", body).then((r) => r.data),

  update: (id: number, body: UpdatePermissionBody) =>
    api.patch<Permission>(`/api/permissions/${id}`, body).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/permissions/${id}`).then((r) => r.data),
};
