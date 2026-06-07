"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { userApi } from "@/entities/user/api/userApi";
import type { UserListItem } from "@/entities/user/model/types";
import { RoleBadge } from "./RoleBadge";
import { RoleChangeDialog } from "./RoleChangeDialog";
import { ActiveToggle } from "./ActiveToggle";
import { CreateUserDialog } from "./CreateUserDialog";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { AlertDialog } from "@/shared/ui/AlertDialog";
import { toast, toastError } from "@/shared/lib/toast";
import { isAxiosError } from "@/shared/api/axios";

const PAGE_SIZE = 10;

export function UserTableWithGuard() {
  return <UserTable />;
}

export function UserTable() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [dismissedForbidden, setDismissedForbidden] = useState(false);
  const qc = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    onSuccess: () => {
      toast.success("유저가 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["users"] });
      setDeleteTarget(null);
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", page, PAGE_SIZE],
    queryFn: () => userApi.list(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const isForbidden =
    isError && isAxiosError(error) && error.response?.status === 403;

  const handleForbiddenDismiss = () => {
    setDismissedForbidden(true);
    router.push("/");
  };

  if (isForbidden && !dismissedForbidden) {
    return (
      <AlertDialog
        open={true}
        variant="warning"
        title="접근 권한이 없습니다"
        description="이 페이지는 관리자 전용입니다. 홈 화면으로 이동합니다."
        confirmText="홈으로 이동"
        onConfirm={handleForbiddenDismiss}
      />
    );
  }

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">불러오는 중...</div>;
  }
  if (isError || !data) {
    return null;
  }

  const totalPages = Math.max(1, data.totalPages);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + 유저 등록
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <Th>ID</Th>
              <Th>이름</Th>
              <Th>이메일</Th>
              <Th>역할</Th>
              <Th>상태</Th>
              <Th>가입일</Th>
              <Th className="text-right">액션</Th>
            </tr>
          </thead>
          <tbody>
            {data.content.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  유저가 없습니다.
                </td>
              </tr>
            ) : (
              data.content.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                  <Td>{u.id}</Td>
                  <Td className="font-medium">{u.username}</Td>
                  <Td className="text-muted-foreground">{u.email}</Td>
                  <Td><RoleBadge role={u.role} /></Td>
                  <Td>
                    <span className={u.active ? "text-green-600" : "text-muted-foreground"}>
                      {u.active ? "활성" : "비활성"}
                    </span>
                  </Td>
                  <Td className="text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingUser(u)}
                        className="rounded-md border border-input px-2.5 py-1 text-xs hover:bg-accent"
                      >
                        롤 변경
                      </button>
                      <ActiveToggle userId={u.id} active={u.active} />
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(u)}
                        className="rounded-md border border-destructive/50 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                      >
                        삭제
                      </button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          총 {data.totalElements}명 · {page + 1} / {totalPages} 페이지
        </span>
        <div className="flex gap-1">
          <PageButton disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            이전
          </PageButton>
          <PageButton
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </PageButton>
        </div>
      </div>

      <RoleChangeDialog user={editingUser} onClose={() => setEditingUser(null)} />

      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.username}' 유저를 삭제하시겠습니까?`}
        description="삭제된 유저는 복구할 수 없습니다."
        variant="destructive"
        confirmText="삭제"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-xs font-medium text-muted-foreground ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 ${className}`}>{children}</td>;
}

function PageButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-input px-3 py-1 text-xs disabled:opacity-40 hover:bg-accent"
    >
      {children}
    </button>
  );
}
