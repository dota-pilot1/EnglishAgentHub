"use client";

import { MonitorCog } from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminPlaceholderPage } from "@/shared/ui/AdminPlaceholderPage";

export default function ScreenSettingsPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <AdminPlaceholderPage
        title="화면 설정"
        description="첫 화면 문구, 결제 안내, 매장 안내 문구를 관리합니다."
        icon={MonitorCog}
        tasks={["첫 화면 문구", "결제 안내", "직원 호출 문구", "언어별 표시 설정"]}
      />
    </RequireRole>
  );
}
