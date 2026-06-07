"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionApi } from "@/entities/permission/api/permissionApi";
import { toast, toastError } from "@/shared/lib/toast";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { PermissionFormDialog } from "./PermissionFormDialog";
import { PermissionCategoryFormDialog } from "./PermissionCategoryFormDialog";
import type { Permission } from "@/entities/permission/model/types";

const CATEGORY_COLORS: Record<string, string> = {
  USER: "text-blue-600 bg-blue-50",
  ROLE: "text-purple-600 bg-purple-50",
  PERMISSION: "text-amber-600 bg-amber-50",
  DASHBOARD: "text-green-600 bg-green-50",
  REPORT: "text-rose-600 bg-rose-50",
  SYSTEM: "text-gray-600 bg-gray-100",
};

export function PermissionTable() {
  const qc = useQueryClient();
  const [formTarget, setFormTarget] = useState<Permission | null | "new">(null);
  const [defaultCategoryCode, setDefaultCategoryCode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);

  const { data: permissions, isLoading, isError } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => permissionApi.delete(id),
    onSuccess: () => {
      toast.success("권한이 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["permissions"] });
      setDeleteTarget(null);
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">로딩 중...</p>;
  if (isError) return <p className="text-sm text-destructive">데이터를 불러오지 못했습니다.</p>;

  const grouped = permissions?.reduce<Record<string, Permission[]>>((acc, p) => {
    const key = p.category?.code ?? "기타";
    (acc[key] = acc[key] ?? []).push(p);
    return acc;
  }, {});

  return (
    <>
      <div className="mb-4 flex justify-end gap-2">
        <button
          onClick={() => setCategoryFormOpen(true)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
        >
          + 카테고리 등록
        </button>
        <button
          onClick={() => { setDefaultCategoryCode(null); setFormTarget("new"); }}
          className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + 권한 등록
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped ?? {}).map(([category, perms]) => (
          <div key={category}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h2>
              <button
                onClick={() => {
                  setDefaultCategoryCode(perms[0]?.category?.code ?? category);
                  setFormTarget("new");
                }}
                className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors"
              >
                + 권한 등록
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
                    <Th>카테고리</Th>
                    <Th className="text-right">액션</Th>
                  </tr>
                </thead>
                <tbody>
                  {perms.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <Td className="text-muted-foreground">{p.id}</Td>
                      <Td>
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                          {p.code}
                        </span>
                      </Td>
                      <Td className="font-medium">{p.name}</Td>
                      <Td className="text-muted-foreground">{p.description ?? "-"}</Td>
                      <Td>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${CATEGORY_COLORS[p.category?.code ?? ""] ?? "text-muted-foreground"}`}>
                          {p.category?.name ?? p.category?.code ?? "-"}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setDefaultCategoryCode(null);
                              setFormTarget(p);
                            }}
                            className="rounded border border-input px-2 py-0.5 text-xs hover:bg-accent"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
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
          </div>
        ))}
      </div>

      <PermissionFormDialog
        open={formTarget !== null}
        permission={formTarget === "new" ? null : formTarget}
        defaultCategoryCode={formTarget === "new" ? defaultCategoryCode : null}
        onClose={() => {
          setFormTarget(null);
          setDefaultCategoryCode(null);
        }}
      />

      <PermissionCategoryFormDialog
        open={categoryFormOpen}
        category={null}
        onClose={() => setCategoryFormOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 권한을 삭제하시겠습니까?`}
        description="롤에 할당된 권한도 함께 해제됩니다."
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
