"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@lib/utils";
import { PageHeader } from "@/components/dashboard/primitives";

const SETTINGS_TABS = [
  { label: "Profile", href: "/dashboard/settings" },
  { label: "Account", href: "/dashboard/settings/account" },
  { label: "Security", href: "/dashboard/settings/security" },
  { label: "Notifications", href: "/dashboard/settings/notifications" },
  { label: "Workspace", href: "/dashboard/settings/workspace" },
  { label: "Integrations", href: "/dashboard/settings/integrations" },
  { label: "API Tokens", href: "/dashboard/settings/api-tokens" },
  { label: "AI & Credits", href: "/dashboard/settings/ai" },
  { label: "Danger Zone", href: "/dashboard/settings/danger" },
] as const;

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, security, workspace, and integrations." />
      <nav className="border-b" style={{ borderColor: "var(--color-border-default)" }}>
        <ul className="flex gap-0">
          {SETTINGS_TABS.map((tab) => {
            const isActive = tab.href === "/dashboard/settings"
              ? pathname === "/dashboard/settings"
              : pathname.startsWith(tab.href);
            return (
              <li key={tab.href}>
                <Link href={tab.href} className={cn(
                  "inline-block px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
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
