"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/primitives";
import { findSettingsSection } from "@/components/dashboard/shell/settings-sections";

/** Settings chrome. The index is the design's directory of section cards; a
 *  sub-page drills in from it, so it gets a back link to the directory and is
 *  titled with the section you actually opened — not a generic "Settings" plus a
 *  tab rail repeating the directory that is one click away. */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const section = findSettingsSection(pathname);

  if (!section) {
    return (
      <div>
        {/* The index is the directory, so it is titled for the directory. It
            used to carry "General settings" and the Workspace & branding
            blurb — the name and description of one of the cards listed on this
            very page, which read as if the user had already drilled in. */}
        <PageHeader title="Settings" description="Manage your workspace, plan, sites and account." />
        <div className="min-w-0">{children}</div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/settings"
        className="mb-3 inline-flex items-center gap-1 text-body-sm font-semibold transition-colors hover:text-[var(--color-text-primary)]"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <ChevronLeft className="h-4 w-4" />
        Settings
      </Link>
      <PageHeader title={section.label} description={section.description} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
