"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleApi } from "@/entities/user/api/roleApi";
import { permissionApi } from "@/entities/permission/api/permissionApi";
import { toast, toastError } from "@/shared/lib/toast";
import type { Role } from "@/entities/user/model/types";
import type { Permission } from "@/entities/permission/model/types";

type Props = {
  role: Role | null;
  onClose: () => void;
};

const CATEGORY_ORDER = ["USER", "ROLE", "PERMISSION", "DASHBOARD", "REPORT", "SYSTEM"];

export function RolePermissionDialog({ role, onClose }: Props) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data: allPermissions, isLoading: allLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionApi.list(),
    enabled: !!role,
  });

  const { data: rolePermissions, isLoading: roleLoading } = useQuery({
    queryKey: ["role-permissions", role?.id],
    queryFn: () => roleApi.getPermissions(role!.id),
    enabled: !!role,
  });

  useEffect(() => {
    if (rolePermissions) {
      setSelected(new Set(rolePermissions.map((p) => p.id)));
    }
  }, [rolePermissions]);

  const mutation = useMutation({
    mutationFn: (ids: number[]) => roleApi.setPermissions(role!.id, ids),
    onSuccess: () => {
      toast.success("권한이 저장되었습니다.");
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["role-permissions", role?.id] });
      onClose();
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!role) return null;

  const isLoading = allLoading || roleLoading;

  const grouped = allPermissions?.reduce<Record<string, Permission[]>>((acc, p) => {
    const categoryCode = p.category?.code ?? "UNCATEGORIZED";
    (acc[categoryCode] = acc[categoryCode] ?? []).push(p);
    return acc;
  }, {});

  const categoryLabels = allPermissions?.reduce<Record<string, string>>((acc, p) => {
    const categoryCode = p.category?.code ?? "UNCATEGORIZED";
    acc[categoryCode] = p.category?.name ?? "미분류";
    return acc;
  }, {});

  const orderedCategories = grouped
    ? [...CATEGORY_ORDER.filter((c) => grouped[c]), ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c))]
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold">권한 설정</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{role.code}</span>
            <span className="ml-2">{role.name}</span>
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">로딩 중...</p>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-4 pr-1">
            {orderedCategories.map((category) => (
              <div key={category}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {categoryLabels?.[category] ?? category}
                </p>
                <div className="space-y-1">
                  {grouped![category].map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggle(p.id)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">{p.code}</span>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {selected.size}개 선택됨
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
            >
              취소
            </button>
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate([...selected])}
              className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {mutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
