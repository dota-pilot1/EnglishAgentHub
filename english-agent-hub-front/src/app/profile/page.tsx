"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { useAuth } from "@/entities/user/model/authStore";
import { userApiKeyApi } from "@/entities/user/api/userApiKeyApi";
import type { OpenAiApiKeyResponse, OpenAiApiKeyValidationResponse } from "@/entities/user/api/userApiKeyApi";
import { toast, toastError } from "@/shared/lib/toast";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

type Tab = "info" | "api";

function ProfileContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("info");

  if (!user) return null;

  const initials = (user.username ?? "?").slice(0, 2).toUpperCase();

  return (
    <main className="w-full px-4 py-6">
      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex border-b border-border">
            {(["info", "api"] as Tab[]).map((t) => {
              const label = { info: "기본 정보", api: "API 키" }[t];
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
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

          {tab === "api" && <ApiKeyTab />}
        </div>

        <aside className="w-56 shrink-0">
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex flex-col items-center gap-2 border-b border-border bg-muted/50 px-4 py-6">
              <div className="flex h-16 w-16 select-none items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {initials}
              </div>
              <span className="text-sm font-semibold">{user.username}</span>
              <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium">
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

function ApiKeyTab() {
  const [status, setStatus] = useState<OpenAiApiKeyResponse | null>(null);
  const [draft, setDraft] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<OpenAiApiKeyValidationResponse | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await userApiKeyApi.getOpenAi();
        setStatus(data);
      } catch (error) {
        toastError(error, "API 키 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    const key = draft.trim();
    if (!key) {
      toast.error("API 키를 입력해주세요.");
      return;
    }
    setSaving(true);
    setValidation(null);
    try {
      const data = await userApiKeyApi.saveOpenAi(key);
      setStatus(data);
      setDraft("");
      setShow(false);
      toast.success("API 키를 저장했습니다.");
    } catch (error) {
      toastError(error, "API 키 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("저장된 OpenAI API 키를 삭제할까요?\n이후 AI 기능은 시스템 기본 키로 동작합니다.")) return;
    setDeleting(true);
    setValidation(null);
    try {
      await userApiKeyApi.deleteOpenAi();
      setStatus({ configured: false, maskedKey: "" });
      toast.success("API 키를 삭제했습니다.");
    } catch (error) {
      toastError(error, "API 키 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const data = await userApiKeyApi.validateOpenAi();
      setValidation(data);
    } catch (error) {
      toastError(error, "키 유효성 확인에 실패했습니다.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Section title="OpenAI API 키">
        <div className="space-y-4 px-4 py-4">
          <p className="text-sm text-muted-foreground">
            개인 OpenAI API 키를 저장하면 채팅·번역·실시간 대화 모두 본인 키로 호출되어 비용이 본인 계정으로 청구됩니다.
            비우면 시스템 기본 키로 동작합니다.
          </p>

          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
            {loading ? (
              <span className="text-muted-foreground">상태 확인 중...</span>
            ) : status?.configured ? (
              <span>
                <span className="font-semibold text-foreground">저장됨</span>
                <span className="ml-2 font-mono text-muted-foreground">{status.maskedKey || "********"}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">저장된 키가 없습니다.</span>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">새 API 키</label>
            <div className="flex gap-2">
              <input
                type={show ? "text" : "password"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
                spellCheck={false}
                className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-sm outline-none transition-colors focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="h-9 shrink-0 rounded-md border border-input bg-background px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {show ? "숨기기" : "보기"}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              저장 시 서버에서 AES 암호화되어 보관되며, 원문은 다시 화면에 노출되지 않습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !draft.trim()}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || !status?.configured}
              className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-60"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </button>
            <button
              type="button"
              onClick={handleValidate}
              disabled={validating || !status?.configured}
              className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-60"
            >
              {validating ? "확인 중..." : "유효성 확인"}
            </button>
          </div>

          {validation && (
            <div
              className={`rounded-md border px-3 py-2 text-xs ${
                validation.valid
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-destructive/40 bg-destructive/5 text-destructive"
              }`}
            >
              {validation.message}
            </div>
          )}

          <div className="rounded-md border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
            💡 키 발급:{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary underline-offset-2 hover:underline"
            >
              platform.openai.com/api-keys
            </a>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center border-b border-border px-4 py-2.5 last:border-0">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm">{value}</p>
    </div>
  );
}
