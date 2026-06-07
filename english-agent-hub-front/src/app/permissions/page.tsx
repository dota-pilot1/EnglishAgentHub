"use client";

import Link from "next/link";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { PermissionTable } from "@/features/permission-management/PermissionTable";

export default function PermissionsPage() {
  return (
    <RequireAuth>
      <main className="w-full px-4 py-4">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">권한 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">
              시스템 권한(Permission)을 조회하고 등록·수정·삭제할 수 있습니다.
            </p>
          </div>
          <Link
            href="/role-permissions"
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            역할-권한 매핑
          </Link>
        </header>
        <PermissionTable />
      </main>
    </RequireAuth>
  );
}
