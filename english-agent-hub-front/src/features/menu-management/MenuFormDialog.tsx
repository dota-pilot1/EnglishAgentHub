"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { menuApi } from "@/entities/menu/api/menuApi";
import type { MenuRecord } from "@/entities/menu/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { Switch } from "@/shared/ui/Switch";

type FormValues = {
  code: string;
  parentId: string;
  label: string;
  labelKey: string;
  path: string;
  icon: string;
  isExternal: boolean;
  requiredRole: string;
  visible: boolean;
  displayOrder: number;
};

type Props = {
  target: MenuRecord | "new" | null;
  menus: MenuRecord[];
  onClose: () => void;
};

function flattenMenusForSelect(
  menus: MenuRecord[],
  parentId: number | null = null,
  depth = 0
): Array<{ menu: MenuRecord; depth: number }> {
  return menus
    .filter((m) => m.parentId === parentId)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .flatMap((menu) => [
      { menu, depth },
      ...flattenMenusForSelect(menus, menu.id, depth + 1),
    ]);
}

export function MenuFormDialog({ target, menus, onClose }: Props) {
  const qc = useQueryClient();
  const isNew = target === "new";
  const existing = isNew ? null : (target as MenuRecord);

  const { register, handleSubmit, reset, setValue, control } = useForm<FormValues>({
    defaultValues: {
      code: "",
      parentId: "",
      label: "",
      labelKey: "",
      path: "",
      icon: "",
      isExternal: false,
      requiredRole: "",
      visible: true,
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        code: existing.code,
        parentId: existing.parentId?.toString() ?? "",
        label: existing.label,
        labelKey: existing.labelKey ?? "",
        path: existing.path ?? "",
        icon: existing.icon ?? "",
        isExternal: existing.isExternal,
        requiredRole: existing.requiredRole ?? "",
        visible: existing.visible,
        displayOrder: existing.displayOrder,
      });
    } else {
      reset({
        code: "", parentId: "", label: "", labelKey: "",
        path: "", icon: "", isExternal: false,
        requiredRole: "", visible: true, displayOrder: 0,
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const body = {
        parentId: v.parentId ? Number(v.parentId) : null,
        label: v.label,
        labelKey: v.labelKey || null,
        path: v.path || null,
        icon: v.icon || null,
        isExternal: v.isExternal,
        requiredRole: v.requiredRole || null,
        requiredPermission: null,
        visible: v.visible,
        displayOrder: Number(v.displayOrder),
      };
      return isNew
        ? menuApi.create({ code: v.code, ...body })
        : menuApi.update(existing!.id, body);
    },
    onSuccess: () => {
      toast.success(isNew ? "메뉴가 생성되었습니다." : "메뉴가 수정되었습니다.");
      qc.invalidateQueries({ queryKey: ["menus"] });
      onClose();
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  const visible = useWatch({ control, name: "visible" });
  const isExternal = useWatch({ control, name: "isExternal" });

  if (!target) return null;

  const parentOptions = flattenMenusForSelect(
    menus.filter((m) => !existing || m.id !== existing.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-background shadow-xl">
        <div className="border-b border-border bg-muted/35 px-5 py-4">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Menu</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">
            {isNew ? "메뉴 생성" : "메뉴 수정"}
          </h2>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid gap-3 px-5 py-5">
          {isNew && (
            <Field label="코드 *">
              <input {...register("code")} required placeholder="DASHBOARD" className={inputCls} />
            </Field>
          )}

          <Field label="부모 메뉴">
            <select {...register("parentId")} className={inputCls}>
              <option value="">없음 (루트)</option>
              {parentOptions.map(({ menu, depth }) => (
                <option key={menu.id} value={menu.id}>
                  {"　".repeat(depth)}
                  {depth > 0 ? "└ " : ""}
                  {menu.label} ({menu.code})
                </option>
              ))}
            </select>
          </Field>

          <Field label="레이블 *">
            <input {...register("label")} required placeholder="대시보드" className={inputCls} />
          </Field>

          <Field label="i18n 키">
            <input {...register("labelKey")} placeholder="nav.dashboard" className={inputCls} />
          </Field>

          <Field label="경로 (URL)">
            <input {...register("path")} placeholder="/dashboard" className={inputCls} />
          </Field>

          <Field label="아이콘">
            <input {...register("icon")} placeholder="LayoutDashboard" className={inputCls} />
          </Field>

          <Field label="필요 역할">
            <input {...register("requiredRole")} placeholder="ROLE_ADMIN" className={inputCls} />
          </Field>

          <Field label="표시 순서">
            <input type="number" {...register("displayOrder")} className={inputCls} />
          </Field>

          <ToggleField
            label="표시"
            description="꺼두면 헤더 메뉴에서 숨겨집니다."
            checked={visible}
            onCheckedChange={(checked) => setValue("visible", checked, { shouldDirty: true })}
          />
          <ToggleField
            label="외부 링크"
            description="새 탭 링크로 열어야 하는 외부 URL일 때 사용합니다."
            checked={isExternal}
            onCheckedChange={(checked) => setValue("isExternal", checked, { shouldDirty: true })}
          />

          <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className={cancelCls}>
              취소
            </button>
            <button type="submit" disabled={mutation.isPending} className={submitCls}>
              {mutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-4">
      <label className="text-right text-xs font-semibold text-muted-foreground">{label}</label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-4">
      <span className="text-right text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2.5">
        <div>
          <p className="text-sm font-semibold text-foreground">{checked ? "켜짐" : "꺼짐"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-label={label}
        />
      </div>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30";
const cancelCls =
  "h-9 rounded-md border border-border px-3 text-sm font-semibold transition-colors hover:bg-accent";
const submitCls =
  "h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60";
