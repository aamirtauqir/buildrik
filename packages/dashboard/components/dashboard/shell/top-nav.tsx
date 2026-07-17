"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import { cn } from "@lib/utils";
import { AvatarDropdown } from "@/components/dashboard/avatar-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

// The top bar carries the brand, an EXPLORE cluster of ecosystem areas, the ⌘K
// search box, notifications and the account pill (per the IA-fixed design). The
// workspace's own destinations (Home, Projects, …) live in the sidebar.
const TOP_NAV = [
  { label: "Marketplace", href: "/dashboard/marketplace" },
  { label: "Learn", href: "/dashboard/learn" },
  { label: "Resources", href: "/dashboard/resources" },
] as const;

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
        <span className="text-[17px] font-extrabold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Buildrick</span>
      </Link>
      <nav className="flex items-center gap-1">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-muted)" }}>Explore</span>
        {TOP_NAV.map((item) => {
          const active = isTopActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("relative rounded-lg px-3 py-1.5 text-body font-medium transition-colors", active ? "" : "hover:bg-[var(--color-bg-subtle)]")}
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
