"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionCategoryApi } from "@/entities/permission-category/api/permissionCategoryApi";
import { toast, toastError } from "@/shared/lib/toast";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { PermissionCategoryFormDialog } from "./PermissionCategoryFormDialog";
import type { PermissionCategory } from "@/entities/permission-category/model/types";

export function PermissionCategoryTable() {
  const qc = useQueryClient();
  const [formTarget, setFormTarget] = useState<PermissionCategory | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<PermissionCategory | null>(null);

  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ["permission-categories"],
    queryFn: () => permissionCategoryApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => permissionCategoryApi.delete(id),
    onSuccess: () => {
      toast.success("카테고리가 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["permission-categories"] });
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
          + 카테고리 등록
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <Th>순서</Th>
              <Th>코드</Th>
              <Th>이름</Th>
              <Th>설명</Th>
              <Th className="text-right">액션</Th>
            </tr>
          </thead>
          <tbody>
            {categories?.map((cat) => (
              <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <Td className="text-muted-foreground w-16">{cat.displayOrder}</Td>
                <Td>
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{cat.code}</span>
                </Td>
                <Td className="font-medium">{cat.name}</Td>
                <Td className="text-muted-foreground">{cat.description ?? "-"}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setFormTarget(cat)} className="rounded border border-input px-2 py-0.5 text-xs hover:bg-accent">수정</button>
                    <button onClick={() => setDeleteTarget(cat)} className="rounded border border-destructive/50 px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10">삭제</button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PermissionCategoryFormDialog
        open={formTarget !== null}
        category={formTarget === "new" ? null : formTarget}
        onClose={() => setFormTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 카테고리를 삭제하시겠습니까?`}
        description="해당 카테고리를 사용 중인 권한이 없어야 삭제할 수 있습니다."
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
