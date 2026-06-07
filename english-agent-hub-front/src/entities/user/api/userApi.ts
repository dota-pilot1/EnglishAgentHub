import { api } from "@/shared/api/axios";
import type { UserListItem, UserPage } from "../model/types";

export type CreateUserBody = {
  email: string;
  password: string;
  username: string;
  roleId: number;
};

export const userApi = {
  list: (page: number, size: number) =>
    api
      .get<UserPage>("/api/users", { params: { page, size } })
      .then((r) => r.data),

  create: (body: CreateUserBody) =>
    api.post<UserListItem>("/api/users", body).then((r) => r.data),

  changeRole: (userId: number, roleId: number) =>
    api
      .patch<UserListItem>(`/api/users/${userId}/role`, { roleId })
      .then((r) => r.data),

  toggleActive: (userId: number) =>
    api.patch<UserListItem>(`/api/users/${userId}/active`).then((r) => r.data),

  delete: (userId: number) =>
    api.delete(`/api/users/${userId}`).then((r) => r.data),
};
