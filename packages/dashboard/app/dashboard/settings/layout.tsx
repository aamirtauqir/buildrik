"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@lib/utils";

const SETTINGS_TABS = [
  { label: "Profile", href: "/dashboard/settings" },
  { label: "Account", href: "/dashboard/settings/account" },
  { label: "Security", href: "/dashboard/settings/security" },
  { label: "Notifications", href: "/dashboard/settings/notifications" },
  { label: "Workspace", href: "/dashboard/settings/workspace" },
  { label: "Integrations", href: "/dashboard/settings/integrations" },
  { label: "AI & Credits", href: "/dashboard/settings/ai" },
  { label: "Danger Zone", href: "/dashboard/settings/danger" },
] as const;

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div>
      <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Settings</h1>
      <nav className="mt-4 border-b" style={{ borderColor: "#E8E8E8" }}>
        <ul className="flex gap-0">
          {SETTINGS_TABS.map((tab) => {
            const isActive = tab.href === "/dashboard/settings"
              ? pathname === "/dashboard/settings"
              : pathname.startsWith(tab.href);
            return (
              <li key={tab.href}>
                <Link href={tab.href} className={cn(
                  "inline-block px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "border-b-2 border-[#E42313] text-[#E42313]" : "text-[#7A7A7A] hover:text-[#0D0D0D]"
                )}>{tab.label}</Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
