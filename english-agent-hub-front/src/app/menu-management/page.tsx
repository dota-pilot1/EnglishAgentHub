"use client";

import { RequireRole } from "@/widgets/guards/RequireRole";
import { MenuTreeTab } from "@/features/menu-management/MenuTreeTab";

export default function MenuManagementPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <main className="w-full px-4 py-4">
        <header className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">헤더 메뉴 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            헤더 메뉴를 추가·수정·삭제하고 드래그로 순서를 변경합니다. 변경 사항은 즉시 헤더에 반영됩니다.
          </p>
        </header>

        <MenuTreeTab />
      </main>
    </RequireRole>
  );
}
