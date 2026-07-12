"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutGrid, Search } from "lucide-react";
import { cn } from "@lib/utils";
import { AvatarDropdown } from "@/components/dashboard/avatar-dropdown";
import { ContextualHelp } from "@/components/help/contextual-help";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { CommandPalette } from "@/components/search/command-palette";
import { WorkspaceSwitcher } from "./workspace-switcher";

// Top-level product areas — the dc design's global top bar. These live ONLY here,
// not in the sidebar.
const TOP_NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Marketplace", href: "/dashboard/marketplace" },
  { label: "Learn", href: "/dashboard/learn" },
  { label: "Resources", href: "/dashboard/resources" },
] as const;

const NON_DASHBOARD = ["/dashboard/marketplace", "/dashboard/learn", "/dashboard/resources"];

function isTopActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return !NON_DASHBOARD.some((p) => pathname.startsWith(p));
  return pathname.startsWith(href);
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name[0].toUpperCase();
}

export function TopNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setPaletteOpen((o) => !o); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";
  const initials = getInitials(session?.user?.name);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-40 flex items-center gap-4 border-b bg-white px-4"
        style={{ height: "var(--topnav-h)", borderColor: "var(--color-border-default)" }}
      >
        {/* Brand + top-level tabs */}
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 pr-2">
          <LayoutGrid className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
          <span className="text-base font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Buildrick</span>
        </Link>
        <nav className="flex items-center gap-1">
          {TOP_NAV.map((item) => {
            const active = isTopActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("relative rounded-lg px-3 py-1.5 text-body font-medium transition-colors", active ? "" : "hover:bg-[var(--color-bg-subtle)]")}
                style={{ color: active ? "var(--color-primary)" : "var(--color-text-secondary)" }}
              >
                {item.label}
                {active && <span className="absolute inset-x-3 -bottom-[calc((var(--topnav-h)-100%)/2)] h-0.5 rounded-pill" style={{ backgroundColor: "var(--color-primary)" }} />}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Right cluster */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-body transition-colors hover:bg-[var(--color-bg-subtle)] md:flex"
          style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border-default)" }}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="ml-6 rounded border px-1.5 text-eyebrow" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-muted)" }}>⌘K</kbd>
        </button>
        <div className="flex items-center gap-1">
          <NotificationDropdown />
          <ContextualHelp />
        </div>
        <WorkspaceSwitcher />
        <AvatarDropdown initials={initials} name={userName} email={userEmail} loading={status === "loading"} />
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
