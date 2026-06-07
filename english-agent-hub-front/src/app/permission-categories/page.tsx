"use client";

import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { PermissionCategoryTable } from "@/features/permission-management/PermissionCategoryTable";

export default function PermissionCategoriesPage() {
  return (
    <RequireAuth>
      <main className="w-full px-4 py-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">권한 카테고리 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            권한(Permission)을 분류하는 카테고리를 조회하고 등록·수정·삭제할 수 있습니다.
          </p>
        </header>
        <PermissionCategoryTable />
      </main>
    </RequireAuth>
  );
}
