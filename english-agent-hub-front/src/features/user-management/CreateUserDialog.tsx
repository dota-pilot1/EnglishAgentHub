"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/entities/user/api/userApi";
import { roleApi } from "@/entities/user/api/roleApi";
import { toast, toastError } from "@/shared/lib/toast";

const schema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
  username: z.string().min(1, "이름을 입력해주세요.").max(50),
  roleId: z.string().transform(Number).pipe(z.number().min(1, "역할을 선택해주세요.")),
});

type FormValues = {
  email: string;
  password: string;
  username: string;
  roleId: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CreateUserDialog({ open, onClose }: Props) {
  const qc = useQueryClient();

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: roleApi.list,
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<any>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) reset({ email: "", password: "", username: "", roleId: "0" });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      userApi.create({
        email: values.email,
        password: values.password,
        username: values.username,
        roleId: Number(values.roleId),
      }),
    onSuccess: () => {
      toast.success("유저가 등록되었습니다.");
      qc.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (e) => toastError(e, "등록에 실패했습니다."),
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
        <h2 className="text-base font-semibold mb-4">유저 등록</h2>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <Field label="이메일" error={errors.email?.message as string}>
            <input
              {...register("email")}
              type="email"
              placeholder="user@example.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>

          <Field label="비밀번호" error={errors.password?.message as string}>
            <input
              {...register("password")}
              type="password"
              placeholder="6자 이상"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>

          <Field label="이름" error={errors.username?.message as string}>
            <input
              {...register("username")}
              placeholder="홍길동"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>

          <Field label="역할" error={errors.roleId?.message as string}>
            <select
              {...register("roleId")}
              disabled={rolesLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            >
              <option value={0}>역할 선택</option>
              {roles?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
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
              {mutation.isPending ? "등록 중..." : "등록"}
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
