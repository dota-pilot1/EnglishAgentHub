"use client";

import { useState } from "react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { useAuth } from "@/entities/user/model/authStore";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

type Tab = "info" | "memo" | "bookmarks";

function ProfileContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("info");

  if (!user) return null;

  const initials = (user.username ?? "?").slice(0, 2).toUpperCase();

  return (
    <main className="w-full px-4 py-6">
      <div className="flex gap-6 items-start">

        {/* 왼쪽: 탭 본문 */}
        <div className="flex-1 min-w-0">
          <div className="flex border-b border-border mb-4">
            {(["info", "memo", "bookmarks"] as Tab[]).map((t) => {
              const label = { info: "기본 정보", memo: "메모장", bookmarks: "즐겨찾기" }[t];
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    tab === t
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {tab === "info" && (
            <div className="space-y-4">
              <Section title="계정 정보">
                <Row label="이름" value={user.username} />
                <Row label="이메일" value={user.email} />
                <Row label="역할" value={user.role.name} />
              </Section>
              <Section title="보유 권한">
                {user.permissions.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">권한이 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 px-4 py-3">
                    {user.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          )}

          {tab === "memo" && (
            <div className="rounded-lg border border-border">
              <div className="px-4 py-3 border-b border-border bg-muted/50">
                <h2 className="text-sm font-semibold">메모장</h2>
              </div>
              <div className="p-4">
                <textarea
                  className="w-full h-64 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="메모를 입력하세요..."
                />
              </div>
            </div>
          )}

          {tab === "bookmarks" && (
            <div className="rounded-lg border border-border">
              <div className="px-4 py-3 border-b border-border bg-muted/50">
                <h2 className="text-sm font-semibold">즐겨찾기</h2>
              </div>
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                즐겨찾기가 없습니다.
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 사이드바 */}
        <aside className="w-56 shrink-0">
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="flex flex-col items-center gap-2 bg-muted/50 px-4 py-6 border-b border-border">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold select-none">
                {initials}
              </div>
              <span className="text-sm font-semibold">{user.username}</span>
              <span className="inline-flex items-center rounded-full bg-background border border-border px-2.5 py-0.5 text-xs font-medium">
                {user.role.name}
              </span>
            </div>
            <div className="divide-y divide-border">
              <MetaRow label="이메일" value={user.email} />
              <MetaRow label="권한 수" value={`${user.permissions.length}개`} />
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="px-4 py-3 border-b border-border bg-muted/50">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center px-4 py-2.5 border-b border-border last:border-0">
      <span className="w-20 text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5 truncate">{value}</p>
    </div>
  );
}
