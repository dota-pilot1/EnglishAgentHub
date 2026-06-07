"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionCategoryApi } from "@/entities/permission-category/api/permissionCategoryApi";
import { toast, toastError } from "@/shared/lib/toast";
import type { PermissionCategory } from "@/entities/permission-category/model/types";

const createSchema = z.object({
  code: z.string().min(1, "코드를 입력해주세요.").regex(/^[A-Z][A-Z0-9_]*$/, "대문자/숫자/언더스코어 형식이어야 합니다."),
  name: z.string().min(1, "이름을 입력해주세요.").max(80),
  description: z.string().max(255).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요.").max(80),
  description: z.string().max(255).optional(),
});

type Props = {
  open: boolean;
  category?: PermissionCategory | null;
  onClose: () => void;
};

export function PermissionCategoryFormDialog({ open, category, onClose }: Props) {
  const isEdit = !!category;
  const qc = useQueryClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema),
  });

  useEffect(() => {
    if (open) {
      reset(isEdit
        ? { name: category.name, description: category.description ?? "" }
        : { code: "", name: "", description: "" }
      );
    }
  }, [open, category, isEdit, reset]);

  const mutation = useMutation({
    mutationFn: (values: Record<string, string>) =>
      isEdit
        ? permissionCategoryApi.update(category!.id, { name: values.name, description: values.description })
        : permissionCategoryApi.create({ code: values.code, name: values.name, description: values.description }),
    onSuccess: () => {
      toast.success(isEdit ? "카테고리가 수정되었습니다." : "카테고리가 등록되었습니다.");
      qc.invalidateQueries({ queryKey: ["permission-categories"] });
      onClose();
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-4">{isEdit ? "카테고리 수정" : "카테고리 등록"}</h2>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v as Record<string, string>))} className="space-y-4">
          {!isEdit ? (
            <Field label="코드" error={errors.code?.message as string}>
              <input {...register("code")} placeholder="USER" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-ring" />
            </Field>
          ) : (
            <div>
              <span className="text-xs text-muted-foreground">코드</span>
              <p className="mt-0.5 font-mono text-sm">{category!.code}</p>
            </div>
          )}
          <Field label="이름" error={errors.name?.message as string}>
            <input {...register("name")} placeholder="사용자" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="설명 (선택)" error={errors.description?.message as string}>
            <input {...register("description")} placeholder="간단한 설명" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent">취소</button>
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-60">
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
