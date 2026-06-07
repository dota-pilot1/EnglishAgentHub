"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/entities/user/api/userApi";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { toast, toastError } from "@/shared/lib/toast";

type Props = {
  userId: number;
  active: boolean;
};

export function ActiveToggle({ userId, active }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => userApi.toggleActive(userId),
    onSuccess: (updated) => {
      toast.success(updated.active ? "활성화되었습니다." : "비활성화되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
    },
    onError: (e) => toastError(e, "상태 변경에 실패했습니다."),
  });

  return (
    <>
      <button
        type="button"
        disabled={mutation.isPending}
        onClick={() => setOpen(true)}
        className={`rounded-md border px-2.5 py-1 text-xs font-medium disabled:opacity-60 transition-colors ${
          active
            ? "border-input hover:bg-accent"
            : "border-destructive/50 text-destructive hover:bg-destructive/10"
        }`}
      >
        {active ? "비활성화" : "활성화"}
      </button>
      <ConfirmDialog
        open={open}
        title={active ? "비활성화하시겠습니까?" : "활성화하시겠습니까?"}
        description={
          active
            ? "비활성화된 유저는 로그인할 수 없습니다."
            : "활성화 시 해당 유저가 다시 로그인할 수 있습니다."
        }
        variant={active ? "destructive" : "default"}
        confirmText={active ? "비활성화" : "활성화"}
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate()}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
