import { api } from "@/shared/api/axios";
import type { MenuRecord } from "../model/types";

export type CreateMenuBody = {
  code: string;
  parentId: number | null;
  label: string;
  labelKey: string | null;
  path: string | null;
  icon: string | null;
  isExternal: boolean;
  requiredRole: string | null;
  requiredPermission: string | null;
  visible: boolean;
  displayOrder: number;
};

export type UpdateMenuBody = Omit<CreateMenuBody, "code">;

export const menuApi = {
  getAll: () => api.get<MenuRecord[]>("/api/menus").then((r) => r.data),
  create: (body: CreateMenuBody) =>
    api.post<MenuRecord>("/api/menus", body).then((r) => r.data),
  update: (id: number, body: UpdateMenuBody) =>
    api.patch<MenuRecord>(`/api/menus/${id}`, body).then((r) => r.data),
  delete: (id: number) => api.delete(`/api/menus/${id}`),
};
