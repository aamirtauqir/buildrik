import type { ReactNode } from "react";
import { TopNav } from "./top-nav";
import { Sidebar } from "./sidebar";

/** The dashboard app shell: a full-width top nav above a fixed 262px sidebar,
 *  with the content region offset by both. Replaces the old loose
 *  Sidebar + Topbar siblings. */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-page)" }}>
      <TopNav />
      <Sidebar />
      <main className="pt-[var(--topnav-h)] lg:ml-[var(--sidebar-w)]">
        <div className="mx-auto max-w-[1220px] p-8">{children}</div>
      </main>
    </div>
  );
}
