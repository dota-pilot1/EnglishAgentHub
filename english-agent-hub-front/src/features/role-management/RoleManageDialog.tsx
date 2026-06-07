"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { roleApi } from "@/entities/user/api/roleApi";
import { toast, toastError } from "@/shared/lib/toast";
import { RoleFormDialog } from "./RoleFormDialog";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import type { Role } from "@/entities/user/model/types";

type Props = {
  open: boolean;
  roles: Role[];
  onClose: () => void;
};

export function RoleManageDialog({ open, roles, onClose }: Props) {
  const qc = useQueryClient();
  const [roleForm, setRoleForm] = useState<Role | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roleApi.delete(id),
    onSuccess: () => {
      toast.success("역할이 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["roles"] });
      setDeleteTarget(null);
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg rounded-lg border border-border bg-background shadow-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold">역할 관리</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Role list */}
          <div className="divide-y divide-border">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{role.name}</span>
                      {role.systemRole && (
                        <span className="text-[9px] font-bold px-1 py-px rounded bg-muted-foreground/20 text-muted-foreground">
                          S
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{role.code}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setRoleForm(role)}
                    title="수정"
                    className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => !role.systemRole && setDeleteTarget(role)}
                    title={role.systemRole ? "시스템 역할은 삭제할 수 없습니다" : "삭제"}
                    disabled={role.systemRole}
                    className="rounded p-1.5 transition-colors disabled:opacity-25 disabled:cursor-not-allowed text-destructive/60 hover:text-destructive hover:bg-destructive/10 disabled:hover:bg-transparent disabled:hover:text-destructive/60"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 011-1h4a1 1 0 011 1m-7 0H5m14 0h-2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border">
            <button
              onClick={() => setRoleForm("new")}
              className="w-full rounded-md border border-dashed border-border py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              + 역할 추가
            </button>
          </div>
        </div>
      </div>

      <RoleFormDialog
        open={roleForm !== null}
        role={roleForm === "new" ? null : roleForm}
        onClose={() => setRoleForm(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 역할을 삭제하시겠습니까?`}
        description="해당 역할을 가진 유저의 역할도 초기화될 수 있습니다."
        variant="destructive"
        confirmText="삭제"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
