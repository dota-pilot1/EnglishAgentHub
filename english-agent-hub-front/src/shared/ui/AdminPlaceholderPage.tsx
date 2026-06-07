"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, LayoutDashboard } from "lucide-react";

type AdminPlaceholderPageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  tasks: string[];
};

export function AdminPlaceholderPage({
  title,
  description,
  icon: Icon,
  tasks,
}: AdminPlaceholderPageProps) {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-5">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition-colors hover:bg-accent"
          >
            <LayoutDashboard className="h-4 w-4" />
            대시보드
          </Link>
        </section>

        <section className="rounded-lg border border-border bg-background">
          <div className="border-b border-border bg-muted/35 px-4 py-3">
            <h2 className="text-sm font-bold">구현 예정 범위</h2>
          </div>
          <div className="grid gap-2 p-4">
            {tasks.map((task) => (
              <div
                key={task}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <span className="text-sm font-medium">{task}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
