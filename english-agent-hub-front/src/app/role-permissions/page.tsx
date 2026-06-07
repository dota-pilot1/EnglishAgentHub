"use client";

import Link from "next/link";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { RolePermissionManager } from "@/features/role-management/RolePermissionManager";

export default function RolePermissionsPage() {
  return (
    <RequireAuth>
      <main className="w-full px-4 py-4">
        <header className="mb-3 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">역할-권한 매핑</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              역할별 권한을 설정하고, 유저 롤을 한 화면에서 관리하세요.
            </p>
          </div>
          <Link
            href="/permissions"
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            권한 관리
          </Link>
        </header>
        <RolePermissionManager />
      </main>
    </RequireAuth>
  );
}
