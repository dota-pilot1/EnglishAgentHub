import { api } from "@/shared/api/axios";
import type { PermissionSummary, Role } from "../model/types";

export type CreateRoleBody = { code: string; name: string; description?: string };
export type UpdateRoleBody = { name: string; description?: string };

export const roleApi = {
  list: () => api.get<Role[]>("/api/roles").then((r) => r.data),
  get: (id: number) => api.get<Role>(`/api/roles/${id}`).then((r) => r.data),
  create: (body: CreateRoleBody) => api.post<Role>("/api/roles", body).then((r) => r.data),
  update: (id: number, body: UpdateRoleBody) =>
    api.patch<Role>(`/api/roles/${id}`, body).then((r) => r.data),
  delete: (id: number) => api.delete(`/api/roles/${id}`),
  getPermissions: (id: number) =>
    api.get<PermissionSummary[]>(`/api/roles/${id}/permissions`).then((r) => r.data),
  setPermissions: (id: number, permissionIds: number[]) =>
    api.put<Role>(`/api/roles/${id}/permissions`, permissionIds).then((r) => r.data),
};
