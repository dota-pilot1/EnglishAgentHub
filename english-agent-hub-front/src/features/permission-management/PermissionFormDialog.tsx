"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { permissionApi } from "@/entities/permission/api/permissionApi";
import { permissionCategoryApi } from "@/entities/permission-category/api/permissionCategoryApi";
import { toast, toastError } from "@/shared/lib/toast";
import type { Permission } from "@/entities/permission/model/types";

const createSchema = z.object({
  code: z
    .string()
    .min(1, "코드를 입력해주세요.")
    .regex(/^[A-Z][A-Z0-9_]*$/, "대문자/숫자/언더스코어 형식이어야 합니다."),
  name: z.string().min(1, "이름을 입력해주세요.").max(80),
  description: z.string().max(255).optional(),
  categoryCode: z.string().min(1, "카테고리를 선택해주세요."),
});

const updateSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요.").max(80),
  description: z.string().max(255).optional(),
  categoryCode: z.string().min(1, "카테고리를 선택해주세요."),
});

type Props = {
  open: boolean;
  permission?: Permission | null;
  defaultCategoryCode?: string | null;
  onClose: () => void;
};

type PermissionFormValues = {
  code?: string;
  name: string;
  description?: string;
  categoryCode: string;
};

export function PermissionFormDialog({ open, permission, defaultCategoryCode, onClose }: Props) {
  const isEdit = !!permission;
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["permission-categories"],
    queryFn: () => permissionCategoryApi.list(),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PermissionFormValues>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema),
  });

  useEffect(() => {
    if (open) {
      reset(
        isEdit
          ? {
              name: permission.name,
              description: permission.description ?? "",
              categoryCode: permission.category?.code ?? "",
            }
          : { code: "", name: "", description: "", categoryCode: defaultCategoryCode ?? "" }
      );
    }
  }, [open, permission, isEdit, reset, defaultCategoryCode]);

  const mutation = useMutation({
    mutationFn: (values: Record<string, string>) =>
      isEdit
        ? permissionApi.update(permission!.id, {
            name: values.name,
            description: values.description,
            categoryCode: values.categoryCode,
          })
        : permissionApi.create({
            code: values.code,
            name: values.name,
            description: values.description,
            categoryCode: values.categoryCode,
          }),
    onSuccess: () => {
      toast.success(isEdit ? "권한이 수정되었습니다." : "권한이 등록되었습니다.");
      qc.invalidateQueries({ queryKey: ["permissions"] });
      onClose();
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-4">{isEdit ? "권한 수정" : "권한 등록"}</h2>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          {!isEdit ? (
            <Field label="코드" error={errors.code?.message as string}>
              <input
                {...register("code")}
                placeholder="USER_VIEW"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
          ) : (
            <div>
              <span className="text-xs text-muted-foreground">코드</span>
              <p className="mt-0.5 font-mono text-sm">{permission!.code}</p>
            </div>
          )}

          <Field label="이름" error={errors.name?.message as string}>
            <input
              {...register("name")}
              placeholder="사용자 조회"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>

          <Field label="설명 (선택)" error={errors.description?.message as string}>
            <input
              {...register("description")}
              placeholder="간단한 설명"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>

          <Field label="카테고리" error={errors.categoryCode?.message as string}>
            <select
              {...register("categoryCode")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">카테고리 선택</option>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {mutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}
