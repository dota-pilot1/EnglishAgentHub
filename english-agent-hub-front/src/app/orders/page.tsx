"use client";

import { ClipboardList } from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminPlaceholderPage } from "@/shared/ui/AdminPlaceholderPage";

export default function OrdersPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_USER"]}>
      <AdminPlaceholderPage
        title="주문 관리"
        description="접수된 주문과 결제 상태, 주문 취소 흐름을 관리합니다."
        icon={ClipboardList}
        tasks={["주문 목록 조회", "결제 상태 확인", "주문 취소 처리", "주문 상세 화면"]}
      />
    </RequireRole>
  );
}
