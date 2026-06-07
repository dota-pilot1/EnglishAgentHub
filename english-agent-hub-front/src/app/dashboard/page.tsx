"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpenText, Bot, Drama, MoreVertical, Newspaper, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { agentChatApi } from "@/entities/agent/api/agentChatApi";
import type { LearningAgent } from "@/entities/agent/model/learningAgents";
import { characterApi, type CharacterResponse } from "@/entities/character/api/characterApi";
import { CharacterFormDialog } from "@/widgets/characters/CharacterFormDialog";
import { useAuth } from "@/entities/user/model/authStore";
import { toast, toastError } from "@/shared/lib/toast";

const ADMIN_ROLE = "ROLE_ADMIN";
const BUILTIN_IDS = new Set(["debate", "roleplay", "quiz"]);

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  const isAdmin = user?.role.code === ADMIN_ROLE;

  const [agents, setAgents] = useState<LearningAgent[]>([]);
  const [characters, setCharacters] = useState<CharacterResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CharacterResponse | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([agentChatApi.getAgents(), characterApi.list()])
      .then(([agentList, charList]) => {
        if (!mounted) return;
        // /api/agents가 enum+DB 통합 응답이므로 카드용은 그걸 그대로 쓰고,
        // 편집/삭제 메타가 필요한 커스텀 카드만 characters에서 매칭한다.
        setAgents(agentList);
        setCharacters(charList);
      })
      .catch((error) => toastError(error, "에이전트 목록을 가져오지 못했습니다."))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const characterMap = new Map(characters.map((c) => [c.id, c]));

  const handleDelete = async (target: CharacterResponse) => {
    if (!confirm(`'${target.title}' 캐릭터를 삭제할까요?`)) return;
    try {
      await characterApi.delete(target.id);
      setCharacters((cur) => cur.filter((c) => c.id !== target.id));
      setAgents((cur) => cur.filter((a) => a.id !== target.id));
      toast.success("삭제했습니다.");
    } catch (error) {
      toastError(error, "삭제에 실패했습니다.");
    } finally {
      setMenuOpenId(null);
    }
  };

  const handleSaved = (saved: CharacterResponse) => {
    setCharacters((cur) => {
      const idx = cur.findIndex((c) => c.id === saved.id);
      if (idx < 0) return [...cur, saved];
      const next = cur.slice();
      next[idx] = saved;
      return next;
    });
    setAgents((cur) => {
      const card: LearningAgent = {
        id: saved.id,
        title: saved.title,
        subtitle: saved.subtitle,
        description: saved.description,
        level: saved.level,
        sessionGoal: saved.sessionGoal,
        skills: saved.skills,
        starterPrompts: saved.starterPrompts,
        systemPrompt: saved.systemPrompt,
      };
      const idx = cur.findIndex((a) => a.id === saved.id);
      if (idx < 0) return [...cur, card];
      const next = cur.slice();
      next[idx] = card;
      return next;
    });
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/25">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 sm:px-8 lg:py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Realtime English Practice
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              오늘 연습할 영어 대화 모드를 선택하세요
            </h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              기본 모드 + 다른 사람들이 만든 공유 캐릭터 중에서 골라 시작하거나, 직접 캐릭터를 추가해보세요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            캐릭터 추가
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="min-h-[300px] rounded-lg border border-border bg-background p-5 shadow-sm"
              >
                <div className="h-12 w-12 rounded-md bg-muted" />
                <div className="mt-6 h-4 w-28 rounded bg-muted" />
                <div className="mt-3 h-8 w-36 rounded bg-muted" />
                <div className="mt-5 space-y-2">
                  <div className="h-4 rounded bg-muted" />
                  <div className="h-4 w-4/5 rounded bg-muted" />
                </div>
              </div>
            ))}

          {!loading &&
            agents.map((agent) => {
              const isBuiltin = BUILTIN_IDS.has(agent.id);
              const character = characterMap.get(agent.id);
              const canEdit =
                !isBuiltin && (isAdmin || (character?.createdById != null && character.createdById === user?.id));

              return (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isBuiltin={isBuiltin}
                  character={character}
                  canEdit={!!canEdit}
                  menuOpen={menuOpenId === agent.id}
                  onMenuToggle={() => setMenuOpenId((cur) => (cur === agent.id ? null : agent.id))}
                  onEdit={() => {
                    if (!character) return;
                    setEditTarget(character);
                    setFormOpen(true);
                    setMenuOpenId(null);
                  }}
                  onDelete={() => character && handleDelete(character)}
                />
              );
            })}

          {!loading && (
            <button
              type="button"
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
              className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-background/50 p-5 text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-background">
                <Plus className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold">새 캐릭터 만들기</span>
              <span className="px-6 text-center text-xs">
                이름과 성격, 5가지 항목으로 나만의 영어 챗봇을 정의하세요.
              </span>
            </button>
          )}
        </div>
      </section>

      <CharacterFormDialog
        open={formOpen}
        target={editTarget}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
    </main>
  );
}

type CardProps = {
  agent: LearningAgent;
  isBuiltin: boolean;
  character?: CharacterResponse;
  canEdit: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function AgentCard({ agent, isBuiltin, character, canEdit, menuOpen, onMenuToggle, onEdit, onDelete }: CardProps) {
  const iconMap = { debate: Newspaper, roleplay: Drama, quiz: BookOpenText } as const;
  const Icon = iconMap[agent.id as keyof typeof iconMap] ?? Bot;

  const accentMap: Record<string, string> = {
    debate: "border-sky-200 bg-sky-50 text-sky-700",
    roleplay: "border-emerald-200 bg-emerald-50 text-emerald-700",
    quiz: "border-amber-200 bg-amber-50 text-amber-700",
  };
  const accent = accentMap[agent.id] ?? "border-border bg-muted text-muted-foreground";

  return (
    <div className="group relative flex min-h-[300px] flex-col rounded-lg border border-border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
      {canEdit && (
        <div className="absolute right-3 top-3 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMenuToggle();
            }}
            aria-label="더보기"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-32 overflow-hidden rounded-md border border-border bg-background shadow-md">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent"
              >
                <Pencil className="h-3.5 w-3.5" />
                수정
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                삭제
              </button>
            </div>
          )}
        </div>
      )}

      <Link href={`/agents/${agent.id}`} className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <span className={`flex h-12 w-12 items-center justify-center rounded-md border ${accent}`}>
            <Icon className="h-6 w-6" />
          </span>
          <div className="flex items-center gap-2">
            {!isBuiltin && (
              <span className="rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
                CUSTOM
              </span>
            )}
            {agent.level && (
              <span className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {agent.level}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5">
          {agent.subtitle && <p className="text-sm font-semibold text-primary">{agent.subtitle}</p>}
          <h2 className="mt-1 text-2xl font-bold tracking-tight">{agent.title}</h2>
          {agent.description && (
            <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{agent.description}</p>
          )}
        </div>

        {agent.skills?.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {agent.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-6">
          <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-semibold">
            <span className="truncate">
              {agent.sessionGoal || (character?.createdByName ? `by ${character.createdByName}` : "")}
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </div>
  );
}
