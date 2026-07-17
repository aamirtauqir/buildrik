import { PageHeader } from "@/components/dashboard/primitives";
import { SettingsRail } from "@/components/dashboard/shell/settings-rail";

/** Settings section chrome (IA v2, D6): the layout owns the PageHeader
 *  (D10.4 — sub-route pages provide content only) and the grouped rail.
 *  The rail collapses to a horizontal chip row below lg. */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader title="Settings" description="Workspace, platform, billing, and personal preferences." />
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <aside className="shrink-0 lg:w-52">
          <SettingsRail />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
