"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/entities/user/api/userApi";
import { roleApi } from "@/entities/user/api/roleApi";
import { toast, toastError } from "@/shared/lib/toast";
import type { UserListItem } from "@/entities/user/model/types";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function UserRoleDialog({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [pendingRoles, setPendingRoles] = useState<Record<number, number>>({});

  const { data: userPage, isLoading: usersLoading } = useQuery({
    queryKey: ["users", page, 20],
    queryFn: () => userApi.list(page, 20),
    enabled: open,
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: roleApi.list,
    enabled: open,
  });

  const changeMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      userApi.changeRole(userId, roleId),
    onSuccess: (_, { userId }) => {
      toast.success("역할이 변경되었습니다.");
      qc.invalidateQueries({ queryKey: ["users"] });
      setPendingRoles((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    },
    onError: (e) => toastError(e, "역할 변경에 실패했습니다."),
  });

  const handleRoleChange = (user: UserListItem, roleId: number) => {
    if (roleId === user.role.id) {
      setPendingRoles((prev) => { const next = { ...prev }; delete next[user.id]; return next; });
    } else {
      setPendingRoles((prev) => ({ ...prev, [user.id]: roleId }));
    }
  };

  const handleSave = (user: UserListItem) => {
    const roleId = pendingRoles[user.id];
    if (roleId) changeMutation.mutate({ userId: user.id, roleId });
  };

  if (!open) return null;

  const users = userPage?.content ?? [];
  const totalPages = userPage?.totalPages ?? 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-lg border border-border bg-background shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">유저 롤 설정</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User list */}
        <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
          {usersLoading || rolesLoading ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">로딩 중...</p>
          ) : users.map((user) => {
            const pending = pendingRoles[user.id];
            const isDirty = pending !== undefined;
            return (
              <div key={user.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={pending ?? user.role.id}
                    onChange={(e) => handleRoleChange(user, Number(e.target.value))}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleSave(user)}
                    disabled={!isDirty || changeMutation.isPending}
                    className="rounded-md bg-primary text-primary-foreground px-3 py-1 text-xs font-medium hover:opacity-90 disabled:opacity-30 transition-opacity"
                  >
                    저장
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-border">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded px-2 py-1 text-xs border border-input hover:bg-accent disabled:opacity-30"
            >
              이전
            </button>
            <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded px-2 py-1 text-xs border border-input hover:bg-accent disabled:opacity-30"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
