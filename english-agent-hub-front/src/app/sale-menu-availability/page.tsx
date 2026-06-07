"use client";

import { Eye } from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminPlaceholderPage } from "@/shared/ui/AdminPlaceholderPage";

export default function SaleMenuAvailabilityPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_USER"]}>
      <AdminPlaceholderPage
        title="품절/노출 관리"
        description="판매 메뉴의 품절, 숨김, 노출 여부를 빠르게 조정합니다."
        icon={Eye}
        tasks={["품절 처리", "판매 재개", "노출 ON/OFF", "임시 숨김"]}
      />
    </RequireRole>
  );
}
