"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleApi } from "@/entities/user/api/roleApi";
import { toast, toastError } from "@/shared/lib/toast";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { RoleFormDialog } from "./RoleFormDialog";
import { RolePermissionDialog } from "./RolePermissionDialog";
import type { Role } from "@/entities/user/model/types";

export function RoleTable() {
  const qc = useQueryClient();
  const [formTarget, setFormTarget] = useState<Role | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [permTarget, setPermTarget] = useState<Role | null>(null);

  const { data: roles, isLoading, isError } = useQuery({
    queryKey: ["roles"],
    queryFn: roleApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roleApi.delete(id),
    onSuccess: () => {
      toast.success("롤이 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["roles"] });
      setDeleteTarget(null);
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">로딩 중...</p>;
  if (isError) return <p className="text-sm text-destructive">데이터를 불러오지 못했습니다.</p>;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setFormTarget("new")}
          className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + 롤 등록
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <Th>ID</Th>
              <Th>코드</Th>
              <Th>이름</Th>
              <Th>설명</Th>
              <Th>시스템</Th>
              <Th className="text-right">액션</Th>
            </tr>
          </thead>
          <tbody>
            {roles?.map((role) => (
              <tr key={role.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <Td className="text-muted-foreground">{role.id}</Td>
                <Td>
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                    {role.code}
                  </span>
                </Td>
                <Td className="font-medium">{role.name}</Td>
                <Td className="text-muted-foreground">{role.description ?? "-"}</Td>
                <Td>
                  {role.systemRole ? (
                    <span className="text-xs text-amber-600 font-medium">시스템</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setPermTarget(role)}
                      className="rounded border border-input px-2 py-0.5 text-xs hover:bg-accent"
                    >
                      권한 설정
                    </button>
                    <button
                      onClick={() => setFormTarget(role)}
                      className="rounded border border-input px-2 py-0.5 text-xs hover:bg-accent"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => setDeleteTarget(role)}
                      className="rounded border border-destructive/50 px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10"
                    >
                      삭제
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RoleFormDialog
        open={formTarget !== null}
        role={formTarget === "new" ? null : formTarget}
        onClose={() => setFormTarget(null)}
      />

      <RolePermissionDialog
        role={permTarget}
        onClose={() => setPermTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 롤을 삭제하시겠습니까?`}
        description="이 롤을 사용 중인 유저가 있으면 삭제할 수 없습니다."
        variant="destructive"
        confirmText="삭제"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-xs font-medium text-muted-foreground text-left ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 ${className}`}>{children}</td>;
}
