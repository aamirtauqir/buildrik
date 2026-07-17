import { PageHeader } from "@/components/dashboard/primitives";
import { SettingsRail } from "@/components/dashboard/shell/settings-rail";

/** Settings section chrome (IA v2, D6): the layout owns the PageHeader
 *  (D10.4 — sub-route pages provide content only) and the section tabs.
 *  Tabs sit in a horizontal bar under the header; content runs full-width
 *  below — no second left rail competing with the app sidebar. */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader title="Settings" description="Workspace, platform, billing, and personal preferences." />
      <div className="mb-6 mt-1">
        <SettingsRail />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
