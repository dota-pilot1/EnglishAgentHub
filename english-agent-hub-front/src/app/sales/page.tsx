"use client";

import { BarChart3 } from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminPlaceholderPage } from "@/shared/ui/AdminPlaceholderPage";

export default function SalesPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
      <AdminPlaceholderPage
        title="매출 관리"
        description="일별 매출, 결제 수단, 취소 금액을 확인합니다."
        icon={BarChart3}
        tasks={["일별 매출 조회", "결제 수단별 집계", "취소/환불 집계", "CSV 내보내기"]}
      />
    </RequireRole>
  );
}
