"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings, CreditCard, HelpCircle, LogOut, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const AVATAR_MENU_ITEMS: MenuItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Help", href: "/dashboard/help", icon: HelpCircle },
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
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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
        className={loading
          ? "h-9 w-9 animate-pulse rounded-full bg-[#F4F4F4]"
          : "flex h-9 w-9 items-center justify-center rounded-full bg-[#E42313] text-sm font-bold text-white"
        }
      >
        {!loading && initials}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-[#E8E8E8] bg-white shadow-lg">
          <div className="border-b border-[#E8E8E8] px-4 py-3">
            <p className="text-sm font-medium text-[#0D0D0D]">{name}</p>
            <p className="text-xs text-[#B0B0B0]">{email}</p>
          </div>
          <ul className="py-1">
            {AVATAR_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              if (item.label === "Logout") {
                return (
                  <li key={item.label}>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[#0D0D0D] hover:bg-[#F4F4F4]"
                    >
                      <Icon className="h-4 w-4 text-[#7A7A7A]" />
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
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[#0D0D0D] hover:bg-[#F4F4F4]"
                  >
                    <Icon className="h-4 w-4 text-[#7A7A7A]" />
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
