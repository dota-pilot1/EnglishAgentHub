"use client";

import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { UserTableWithGuard } from "@/features/user-management/UserTable";

export default function UsersPage() {
  return (
    <RequireAuth>
      <main className="w-full px-4 py-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">유저 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            전체 유저 목록을 조회하고 역할 및 활성 상태를 변경할 수 있습니다.
          </p>
        </header>
        <UserTableWithGuard />
      </main>
    </RequireAuth>
  );
}
