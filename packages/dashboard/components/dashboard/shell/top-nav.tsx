"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutGrid } from "lucide-react";
import { cn } from "@lib/utils";
import { AvatarDropdown } from "@/components/dashboard/avatar-dropdown";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

// Top-level product areas — the dc mockup's global top bar. Search + workspace
// switcher live in the SIDEBAR (per the mockup), not here; the top bar carries
// only brand, the product tabs, notifications and the account pill.
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
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-md" style={{ backgroundColor: "var(--color-ink)" }}>
          <LayoutGrid className="h-4 w-4 text-white" />
        </span>
        <span className="text-[17px] font-extrabold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Buildrick</span>
      </Link>
      <nav className="flex items-center gap-1">
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

      {/* Right cluster: notifications + account pill */}
      <NotificationDropdown />
      <AvatarDropdown initials={initials} name={userName} email={userEmail} loading={status === "loading"} />
    </header>
  );
}
