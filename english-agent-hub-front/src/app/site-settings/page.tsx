"use client";

import { RequireRole } from "@/widgets/guards/RequireRole";
import { SiteSettingsForm } from "@/features/site-settings/SiteSettingsForm";

export default function SiteSettingsPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <main className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center px-4 py-10 sm:py-14 bg-gradient-to-br from-muted/40 via-background to-accent/10">
        <div className="relative w-full max-w-5xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-2 rounded-[1.75rem] bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-xl"
          />
          <div className="relative flex flex-col rounded-2xl border-2 border-border bg-background shadow-[0_24px_70px_-18px_rgba(0,0,0,0.25)] ring-1 ring-black/5 overflow-hidden lg:min-h-[720px]">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary/70 via-primary to-primary/70"
            />
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-accent/60 via-accent to-accent/60"
            />
            <div className="flex flex-1 flex-col p-6 sm:p-8">
              <SiteSettingsForm />
            </div>
          </div>
        </div>
      </main>
    </RequireRole>
  );
}
