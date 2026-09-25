"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@lib/utils";
import { TopNav } from "./top-nav";
import { Sidebar } from "./sidebar";
import { isFullWidthRoute } from "./nav";
import { CommandPalette } from "@/components/search/command-palette";

/** The dashboard app shell: a full-width top nav above a fixed var(--sidebar-w)
 *  (293px) sidebar, with the content region offset by both. Content column is
 *  the dc mockup's 1120px max-width with 32/40/60 padding and tabular figures.
 *  The ⌘K command palette lives here so its trigger can sit in the top bar
 *  (per the design). */
export function DashboardShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = usePathname();
  // Ecosystem areas (Marketplace/Learn/Resources) are not workspace destinations,
  // so they drop the workspace sidebar and go full-width. Every other route keeps
  // it. isFullWidthRoute is the SSOT shared with the topbar's Dashboard link.
  const showSidebar = !isFullWidthRoute(pathname);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setPaletteOpen((o) => !o); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className="min-h-screen [font-variant-numeric:tabular-nums]"
      style={{ backgroundColor: "var(--color-bg-surface)", fontFamily: "'Inter', 'Inter Tight', sans-serif" }}
    >
      {/* Visually hidden until focused — a keyboard user landing on the page
          otherwise has to tab through the full top nav + sidebar before
          reaching the content on every single page. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[10000] focus:rounded-md focus:px-3 focus:py-2 focus:text-body-sm focus:font-medium focus:text-white"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Skip to content
      </a>
      <TopNav onSearch={() => setPaletteOpen(true)} />
      {showSidebar && <Sidebar />}
      <main id="main-content" className={cn("pt-[var(--topnav-h)]", showSidebar && "lg:ml-[var(--sidebar-w)]")}>
        <div className="px-10 pb-[60px] pt-8">{children}</div>
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
