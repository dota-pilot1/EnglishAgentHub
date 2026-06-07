"use client";

import { Package } from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminPlaceholderPage } from "@/shared/ui/AdminPlaceholderPage";

export default function SaleMenuCategoriesPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
      <AdminPlaceholderPage
        title="카테고리 관리"
        description="판매 메뉴 카테고리와 노출 순서를 관리합니다."
        icon={Package}
        tasks={["카테고리 등록", "카테고리 순서 변경", "카테고리 숨김", "메뉴 연결"]}
      />
    </RequireRole>
  );
}
