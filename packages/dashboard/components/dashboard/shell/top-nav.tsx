"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import { cn } from "@lib/utils";
import { AvatarDropdown } from "@/components/dashboard/avatar-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { ECOSYSTEM_NAV, isFullWidthRoute } from "./nav";

// The top bar carries the brand, a "Dashboard" link back to the workspace, an
// EXPLORE cluster of ecosystem areas, the ⌘K search box, notifications and the
// account pill. The workspace's own destinations (Home, Projects, …) live in the
// sidebar; "Dashboard" here is the way back to that workspace from an ecosystem
// page, which otherwise renders full-width with no sidebar.

function isTopActive(pathname: string, href: string): boolean {
  return pathname.startsWith(href);
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name[0].toUpperCase();
}

export function TopNav({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";
  const initials = getInitials(session?.user?.name);

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 flex items-center gap-4 border-b bg-white px-6"
      style={{ height: "var(--topnav-h)", borderColor: "var(--color-border-default)" }}
    >
      {/* Brand: ink tile + wordmark */}
      <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5 pr-2">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-md text-[15px] font-extrabold leading-none text-white" style={{ backgroundColor: "var(--color-ink)" }}>
          B
        </span>
        <span className="text-[15.5px] font-[680] tracking-tight" style={{ color: "var(--color-text-primary)" }}>Buildrick</span>
      </Link>
      <nav className="flex items-center gap-1">
        {/* Dashboard is the main working mode, not something you "explore" — so it
            sits OUTSIDE the Explore cluster as the workspace anchor, before the
            label, with a rule separating it from the ecosystem tabs. Active on any
            workspace page (wherever the sidebar is showing). */}
        <Link
          href="/dashboard"
          className={cn("relative rounded-lg px-3 py-1.5 text-[13.5px] font-[530] transition-colors", isFullWidthRoute(pathname) ? "hover:bg-[var(--color-bg-subtle)]" : "")}
          style={{ color: isFullWidthRoute(pathname) ? "var(--color-text-secondary)" : "var(--color-text-primary)" }}
        >
          Dashboard
          {!isFullWidthRoute(pathname) && <span className="absolute inset-x-3 -bottom-[calc((var(--topnav-h)-100%)/2)] h-0.5 rounded-pill" style={{ backgroundColor: "var(--color-text-primary)" }} />}
        </Link>
        {/* A vertical rule (not a text label) separates the workspace anchor from
            the ecosystem tabs. The former "Explore" caption sat at the nav's own
            rhythm and read as a disabled tab (audit G5); the divider carries the
            grouping the way Linear/Vercel do, with nothing clickable-looking. */}
        <span className="mx-2 h-4 w-px" style={{ backgroundColor: "var(--color-border-default)" }} />
        {ECOSYSTEM_NAV.map((item) => {
          const active = isTopActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("relative rounded-lg px-3 py-1.5 text-[13.5px] font-[530] transition-colors", active ? "" : "hover:bg-[var(--color-bg-subtle)]")}
              style={{ color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
            >
              {item.label}
              {active && <span className="absolute inset-x-3 -bottom-[calc((var(--topnav-h)-100%)/2)] h-0.5 rounded-pill" style={{ backgroundColor: "var(--color-text-primary)" }} />}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Right cluster: search box + notifications + account pill */}
      <button
        onClick={onSearch}
        className="flex h-9 w-[230px] items-center gap-2 rounded-lg border px-3 text-body transition-colors hover:border-[var(--color-text-muted)]"
        style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-placeholder)", backgroundColor: "var(--color-bg-subtle)" }}
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded border bg-white px-1.5 text-eyebrow" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-muted)" }}>⌘K</kbd>
      </button>
      <NotificationDropdown />
      <AvatarDropdown initials={initials} name={userName} email={userEmail} loading={status === "loading"} />
    </header>
  );
}
