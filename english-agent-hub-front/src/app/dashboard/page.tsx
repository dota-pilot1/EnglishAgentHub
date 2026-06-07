"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpenText, Bot, Drama, Newspaper, Sparkles } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { agentChatApi } from "@/entities/agent/api/agentChatApi";
import type { LearningAgent } from "@/entities/agent/model/learningAgents";
import { toastError } from "@/shared/lib/toast";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}

function DashboardInner() {
  const [agents, setAgents] = useState<LearningAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const iconMap = {
    debate: Newspaper,
    roleplay: Drama,
    quiz: BookOpenText,
  } as const;

  useEffect(() => {
    let mounted = true;

    agentChatApi
      .getAgents()
      .then((data) => {
        if (mounted) setAgents(data);
      })
      .catch((error) => {
        toastError(error, "에이전트 목록을 가져오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const getAgentAccentClass = (agentId: string) => {
    const accentMap: Record<string, string> = {
      debate: "border-sky-200 bg-sky-50 text-sky-700",
      roleplay: "border-emerald-200 bg-emerald-50 text-emerald-700",
      quiz: "border-amber-200 bg-amber-50 text-amber-700",
    };

    return accentMap[agentId] ?? "border-border bg-muted text-muted-foreground";
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
              기사 토론, 상황극, 퀴즈 세 가지 흐름으로 시작하고 나중에 Spring AI와 GPT Realtime API 세션을 연결하면 됩니다.
            </p>
          </div>
          <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            MVP 구성: 카드 선택 → 채팅 → 피드백
          </div>
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
              const Icon = iconMap[agent.id as keyof typeof iconMap] ?? Bot;
              const accentClass = getAgentAccentClass(agent.id);

              return (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="group flex min-h-[300px] flex-col rounded-lg border border-border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-md border ${accentClass}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {agent.level}
                    </span>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-primary">{agent.subtitle}</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">{agent.title}</h2>
                    <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
                      {agent.description}
                    </p>
                  </div>

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

                  <div className="mt-auto pt-6">
                    <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-semibold">
                      <span>{agent.sessionGoal}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </section>
    </main>
  );
}
