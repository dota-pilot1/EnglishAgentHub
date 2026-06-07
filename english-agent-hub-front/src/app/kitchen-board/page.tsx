"use client";

import { Utensils } from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminPlaceholderPage } from "@/shared/ui/AdminPlaceholderPage";

export default function KitchenBoardPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_USER"]}>
      <AdminPlaceholderPage
        title="주방 현황"
        description="접수된 주문과 조리 진행 상태를 주방 기준으로 확인합니다."
        icon={Utensils}
        tasks={["접수 주문 보기", "조리 시작", "조리 완료", "완료 주문 알림"]}
      />
    </RequireRole>
  );
}
