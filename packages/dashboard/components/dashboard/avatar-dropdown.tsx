"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings, CreditCard, LogOut, ChevronDown, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const AVATAR_MENU_ITEMS: MenuItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
  // Help removed — it now lives in Resources, not in the account menu.
  { label: "Logout", href: "#", icon: LogOut },
];

type AvatarDropdownProps = {
  initials: string;
  name: string;
  email: string;
  loading?: boolean;
};

export function AvatarDropdown({ initials, name, email, loading = false }: AvatarDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // best-effort: redirect regardless
    }
    router.push("/auth");
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !loading && setOpen((prev) => !prev)}
        disabled={loading}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={loading
          ? "h-9 w-9 animate-pulse rounded-full bg-[var(--color-bg-subtle)]"
          : "flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-[var(--color-bg-subtle)]"
        }
      >
        {!loading && (
          <>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-body font-bold text-white">{initials}</span>
            <span className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>Account</span>
            <ChevronDown className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-lg border border-[var(--color-border-default)] bg-white shadow-lg">
          <div className="border-b border-[var(--color-border-default)] px-4 py-3">
            <p className="text-body font-medium text-[var(--color-text-primary)]">{name}</p>
            <p className="text-body-sm text-[var(--color-text-muted)]">{email}</p>
          </div>
          <ul className="py-1">
            {AVATAR_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              if (item.label === "Logout") {
                return (
                  <li key={item.label}>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2 text-body text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]"
                    >
                      <Icon className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      {item.label}
                    </button>
                  </li>
                );
              }
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-body text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]"
                  >
                    <Icon className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
