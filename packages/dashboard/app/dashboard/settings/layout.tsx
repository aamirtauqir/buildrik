"use client";

import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/dashboard/primitives";
import { SettingsRail } from "@/components/dashboard/shell/settings-rail";

/** Settings section chrome (IA v2, D6): the layout owns the PageHeader
 *  (D10.4 — sub-route pages provide content only) and the section tabs.
 *
 *  The index is the design's directory of section cards, where the cards are the
 *  navigation — so the rail is suppressed there and shown on every sub-route,
 *  which still needs a way back and across. */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isIndex = pathname === "/dashboard/settings";

  return (
    <div>
      <PageHeader
        title={isIndex ? "General settings" : "Settings"}
        description={
          isIndex
            ? "Workspace name, branding, and defaults."
            : "Workspace, platform, billing, and personal preferences."
        }
      />
      {!isIndex && (
        <div className="mb-6 mt-1">
          <SettingsRail />
        </div>
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
