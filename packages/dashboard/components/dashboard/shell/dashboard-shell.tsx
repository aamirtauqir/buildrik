import type { ReactNode } from "react";
import { TopNav } from "./top-nav";
import { Sidebar } from "./sidebar";

/** The dashboard app shell: a full-width top nav above a fixed 272px sidebar,
 *  with the content region offset by both. Content column is the dc mockup's
 *  1120px max-width with 32/40/60 padding and tabular figures. */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen [font-variant-numeric:tabular-nums]" style={{ backgroundColor: "var(--color-bg-page)" }}>
      <TopNav />
      <Sidebar />
      <main className="pt-[var(--topnav-h)] lg:ml-[var(--sidebar-w)]">
        <div className="mx-auto max-w-[1120px] px-10 pb-[60px] pt-8">{children}</div>
      </main>
    </div>
  );
}
