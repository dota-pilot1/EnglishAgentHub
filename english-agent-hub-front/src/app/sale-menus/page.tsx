"use client";

import { ShoppingBag } from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminPlaceholderPage } from "@/shared/ui/AdminPlaceholderPage";

export default function SaleMenusPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
      <AdminPlaceholderPage
        title="판매 메뉴 관리"
        description="판매 메뉴명, 가격, 설명, 이미지를 관리합니다."
        icon={ShoppingBag}
        tasks={["메뉴 등록/수정", "가격 관리", "대표 이미지 연결", "노출 설정"]}
      />
    </RequireRole>
  );
}
