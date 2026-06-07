"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  characterApi,
  type CharacterResponse,
  type CharacterUpsertRequest,
} from "@/entities/character/api/characterApi";
import { toast, toastError } from "@/shared/lib/toast";

type Tab = "meta" | "style" | "scenario" | "character" | "knowledge" | "news" | "schedule";

const SCENARIO_PLACEHOLDER = `예 (카페 응대 시나리오):
1) 인사하고 무엇을 주문하실지 묻기
2) 사이즈(Tall/Grande/Venti) 묻기
3) 핫/아이스, 시럽, 휘핑 같은 옵션 묻기
4) 추가 메뉴 있는지 묻기
5) 매장/포장 여부 묻기
6) 결제 방식 묻고 영수증/포인트 마무리

이 절차를 한 번에 한 단계씩 진행하고, 학습자가 답하기 전엔 다음 단계로 넘어가지 마.`;

const TABS: { key: Tab; label: string; placeholder: string }[] = [
  { key: "meta", label: "기본 정보", placeholder: "" },
  { key: "style", label: "대화 스타일", placeholder: "예: 친구처럼 캐주얼하게, 짧게 1~3문장으로 답하기" },
  { key: "scenario", label: "참고 시나리오", placeholder: SCENARIO_PLACEHOLDER },
  { key: "character", label: "캐릭터 정보", placeholder: "예: 이름, 성격, 직업, 사는 곳, 말투 등" },
  { key: "knowledge", label: "알고 있는 지식", placeholder: "예: 캐릭터가 잘 아는 주제, 관심사" },
  { key: "news", label: "오늘의 뉴스", placeholder: "예: 대화 중 자연스럽게 꺼낼 최근 화제" },
  { key: "schedule", label: "캐릭터 근황", placeholder: "예: 최근 한 일, 요즘 빠진 것" },
];

type Props = {
  open: boolean;
  // null이면 새 캐릭터 생성, 객체면 그 캐릭터 편집
  target: CharacterResponse | null;
  onClose: () => void;
  onSaved: (saved: CharacterResponse) => void;
};

export function CharacterFormDialog({ open, target, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>("meta");
  const [form, setForm] = useState<CharacterUpsertRequest>({ title: "" });
  const [skillsInput, setSkillsInput] = useState("");
  const [startersInput, setStartersInput] = useState("");
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!open) {
      initialized.current = false;
      return;
    }
    if (initialized.current) return;
    initialized.current = true;

    if (target) {
      setForm({
        title: target.title ?? "",
        subtitle: target.subtitle ?? "",
        description: target.description ?? "",
        level: target.level ?? "",
        sessionGoal: target.sessionGoal ?? "",
        skills: target.skills ?? [],
        starterPrompts: target.starterPrompts ?? [],
        style: target.style ?? "",
        scenario: target.scenario ?? "",
        character: target.character ?? "",
        knowledge: target.knowledge ?? "",
        news: target.news ?? "",
        schedule: target.schedule ?? "",
      });
      setSkillsInput((target.skills ?? []).join(", "));
      setStartersInput((target.starterPrompts ?? []).join("\n"));
    } else {
      setForm({ title: "" });
      setSkillsInput("");
      setStartersInput("");
    }
    setTab("meta");
  }, [open, target]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.title?.trim()) {
      toast.error("이름은 필수입니다.");
      setTab("meta");
      return;
    }

    const body: CharacterUpsertRequest = {
      ...form,
      title: form.title.trim(),
      skills: skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      starterPrompts: startersInput
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    setSaving(true);
    try {
      const saved = target
        ? await characterApi.update(target.id, body)
        : await characterApi.create(body);
      onSaved(saved);
      toast.success(target ? "캐릭터를 수정했습니다." : "캐릭터를 만들었습니다.");
      onClose();
    } catch (error) {
      toastError(error, target ? "수정에 실패했습니다." : "생성에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const fieldKey: Record<Exclude<Tab, "meta">, keyof CharacterUpsertRequest> = {
    style: "style",
    scenario: "scenario",
    character: "character",
    knowledge: "knowledge",
    news: "news",
    schedule: "schedule",
  };

  const currentValue = tab === "meta" ? "" : ((form[fieldKey[tab]] as string) ?? "");
  const currentPlaceholder = TABS.find((t) => t.key === tab)?.placeholder ?? "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3">
          <div>
            <h2 id="character-form-title" className="text-sm font-semibold">
              {target ? "캐릭터 수정" : "캐릭터 추가"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              기본 정보 + 5가지 항목으로 챗봇을 정의합니다. 모두 비워두면 기본 안내 프롬프트가 사용됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="닫기"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-border px-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {tab === "meta" ? (
            <div className="space-y-3 text-sm">
              <Field label="이름 *" required>
                <input
                  value={form.title ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="예: 미국 친구 마이크"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 outline-none focus:border-primary"
                />
              </Field>
              <Field label="영문 부제">
                <input
                  value={form.subtitle ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  placeholder="예: American Friend"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 outline-none focus:border-primary"
                />
              </Field>
              <Field label="한 줄 설명">
                <input
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="카드에 표시될 설명"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 outline-none focus:border-primary"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="레벨">
                  <input
                    value={form.level ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                    placeholder="예: B1-B2"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 outline-none focus:border-primary"
                  />
                </Field>
                <Field label="세션 목표">
                  <input
                    value={form.sessionGoal ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, sessionGoal: e.target.value }))}
                    placeholder="예: 오늘 있었던 일 말하기"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 outline-none focus:border-primary"
                  />
                </Field>
              </div>
              <Field label="스킬 (쉼표 구분)">
                <input
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="예: Small Talk, Daily Life"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 outline-none focus:border-primary"
                />
              </Field>
              <Field label="스타터 프롬프트 (한 줄에 하나)">
                <textarea
                  value={startersInput}
                  onChange={(e) => setStartersInput(e.target.value)}
                  rows={3}
                  placeholder={"예:\nHow was your day?\nWhat do you do on weekends?"}
                  className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary"
                />
              </Field>
            </div>
          ) : (
            <textarea
              value={currentValue}
              onChange={(e) =>
                setForm((f) => ({ ...f, [fieldKey[tab as Exclude<Tab, "meta">]]: e.target.value }))
              }
              rows={14}
              placeholder={currentPlaceholder}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus:border-primary"
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "저장 중..." : target ? "저장" : "추가"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
