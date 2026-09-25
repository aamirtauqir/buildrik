/**
 * PermissionsHost — the ⌘K "Permissions" door for every role that is not a
 * viewer (a viewer has its own, on the inspector notice), plus the owner's
 * delete-site flow that starts from it:
 *   Permissions (5905:44701) → Delete this site (5890:44728 / 5891:44701)
 *   → the editor closes on "<site> deleted" (6881:86093).
 *
 * The deleted screen replaces the whole editor: the site is gone, so nothing
 * behind it can be saved to. Its one way out is the dashboard.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Trash2 } from "lucide-react";
import type { Composer } from "@/engine";
import { Portal } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { deleteSite } from "@/services/BuildrikSyncProvider";
import { useEditorRole } from "./hooks/useEditorRole";
import { PermissionsModal } from "./modals/PermissionsModal";
import { DeleteSiteModal } from "./modals/DeleteSiteModal";

export const PermissionsHost: React.FC<{
  composer: Composer | null;
  siteId: string | null;
  siteName: string;
}> = ({ composer, siteId, siteName }) => {
  const role = useEditorRole();
  const [open, setOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);

  React.useEffect(() => {
    if (!composer) return;
    const onOpen = () => setOpen(true);
    composer.on(EVENTS.UI_OPEN_PERMISSIONS, onOpen);
    return () => {
      composer.off(EVENTS.UI_OPEN_PERMISSIONS, onOpen);
    };
  }, [composer]);

  if (deleted) return <SiteDeletedScreen siteName={siteName} />;
  if (!role) return null;

  return (
    <>
      <PermissionsModal
        open={open}
        role={role}
        onClose={() => setOpen(false)}
        onDeleteSite={
          role === "OWNER" && siteId
            ? () => {
                setOpen(false);
                setConfirming(true);
              }
            : undefined
        }
      />
      {siteId ? (
        <DeleteSiteModal
          open={confirming}
          siteName={siteName}
          onClose={() => setConfirming(false)}
          onDelete={async () => {
            await deleteSite(siteId, siteName);
            setConfirming(false);
            setDeleted(true);
          }}
        />
      ) : null}
    </>
  );
};

/* Board 6881:86093. The copy says only what `deleteSite` does — the site is
   removed from the workspace and its share links and forms stop — not the
   board's "members are notified… the published site is offline… domains are
   released", none of which the delete performs. */
const SiteDeletedScreen: React.FC<{ siteName: string }> = ({ siteName }) => (
  <Portal>
    <div
      className="tw:fixed tw:inset-0 tw:z-[90] tw:flex tw:flex-col tw:bg-[var(--bk-bg-subtle)] tw:[font-family:var(--bk-font-ui)]"
      role="alertdialog"
      aria-labelledby="site-deleted-title"
      data-testid="site-deleted"
    >
      <header className="tw:flex tw:h-14 tw:flex-none tw:items-center tw:gap-2 tw:border-b tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:px-6 tw:text-[13px]">
        <span className="tw:font-semibold tw:text-[var(--bk-ink)]">Buildrick</span>
        <span className="tw:text-[var(--bk-ink-muted)]">›</span>
        <span className="tw:text-[var(--bk-ink-soft)]">Sites</span>
      </header>
      <div className="tw:flex tw:flex-1 tw:items-start tw:justify-center tw:px-4 tw:pt-[286px]">
        <div className="tw:w-[560px] tw:max-w-full tw:overflow-hidden tw:rounded-lg tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:[box-shadow:var(--bk-shadow-overlay)]">
          <div className="tw:flex tw:h-14 tw:items-center tw:gap-2 tw:border-b tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-subtle)] tw:px-6">
            <Trash2 size={16} aria-hidden="true" className="tw:text-[var(--bk-ink-muted)]" />
            <h2 id="site-deleted-title" className="tw:m-0 tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">
              {siteName} deleted
            </h2>
          </div>
          <div className="tw:flex tw:flex-col tw:gap-1 tw:border-b tw:border-[var(--bk-border)] tw:px-6 tw:py-4">
            <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
              This site has been deleted from your workspace.
            </p>
            <p className="tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
              The editor is closed for this site. Its share links and forms no longer work.
            </p>
          </div>
          <div className="tw:flex tw:h-14 tw:items-center tw:px-6">
            <a
              href={`${DASHBOARD_URL}/dashboard`}
              className="tw:text-[13px] tw:text-[var(--bk-accent)] tw:no-underline tw:hover:underline"
              data-testid="site-deleted-back"
            >
              ← Back to your sites
            </a>
          </div>
        </div>
      </div>
    </div>
  </Portal>
);
