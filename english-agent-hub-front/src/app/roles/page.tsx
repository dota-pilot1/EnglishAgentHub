"use client";

import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { RoleTable } from "@/features/role-management/RoleTable";

export default function RolesPage() {
  return (
    <RequireAuth>
      <main className="w-full px-4 py-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">롤 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            시스템 롤을 조회하고 커스텀 롤을 등록·수정·삭제할 수 있습니다.
          </p>
        </header>
        <RoleTable />
      </main>
    </RequireAuth>
  );
}
