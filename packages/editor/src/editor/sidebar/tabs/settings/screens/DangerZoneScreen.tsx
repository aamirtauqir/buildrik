/**
 * DangerZoneScreen — DANGER ZONE (plan rows #41–44; boards 8137:216600
 * owner, 8137:216834 non-owner read-only, 8137:217085 archive-confirm,
 * 8137:217348 transfer-dialog, 8137:217625 transfer-success, 8137:217905 /
 * 8137:218168 delete; PD-3, the OWNER's).
 *
 * Three cards, each a line and its action:
 *  - **Archive site** — hides the site from the Sites list, the live site
 *    stays up (Q-B4): ArchiveSiteDialog → `sites.archive`. Once archived the
 *    card offers `Unarchive site` (`sites.unarchive`, at once).
 *  - **Transfer site** — TransferSiteDialog → `sites.transfer` (the creator
 *    or the workspace OWNER, Q-B5); the toast says who owns it now.
 *  - **Delete site** — DeleteSiteModal (M17) → `sites.delete`; the line names
 *    the live address it unpublishes. The editor then leaves for the
 *    dashboard's Recently deleted, where the site can be restored for 30 days.
 *
 * Every action applies at once (`immediate`). Below OWNER the shell shows the
 * read-only notice and disables the buttons. Field anchors: `danger-archive`,
 * `danger-transfer`, `danger-delete`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, useToast } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { deleteSite } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { DeleteSiteModal } from "@/editor/shell/modals/DeleteSiteModal";
import { LoadCard, SET_BTN, SET_CARD, SaveErrorBanner, Screen } from "../shared";
import { useServerLoad } from "../hooks/useServerLoad";
import type { ScreenProps } from "../types";
import { ArchiveSiteDialog } from "../components/ArchiveSiteDialog";
import { TransferSiteDialog, type TransferMember } from "../components/TransferSiteDialog";

interface SiteLifecycle {
  archived: boolean;
  /** The address a delete takes offline, or null when nothing is live. */
  liveAddress: string | null;
}

const hostOf = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
};

/** The server's sentence, else ours. */
const refusal = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** Where a deleted site can be brought back from (the dashboard's Sites list). */
export const RECENTLY_DELETED_PATH = "/dashboard/projects?status=deleted";

/* 8137:216600: a card per action — 24 in, the title 16/600, then a row of the
   line (13 muted) and its text button, 24 apart. */
const CARD = `${SET_CARD} tw:flex tw:flex-col tw:gap-4 tw:p-6`;
const TITLE =
  "tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-6 tw:tracking-[-0.16px] tw:text-[var(--bk-ink)]";
const LINE = "tw:m-0 tw:min-w-0 tw:flex-1 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const ACTION =
  `${SET_BTN} tw:shrink-0 tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)] ` +
  "tw:disabled:bg-transparent tw:disabled:text-[var(--bk-gray-400)]";
const ACTION_DANGER = `${ACTION} tw:text-[var(--bk-error-text)]`;

const ActionCard: React.FC<{
  title: string;
  line: string;
  testId: string;
  children: React.ReactNode;
}> = ({ title, line, testId, children }) => (
  <section className={CARD} data-testid={testId}>
    <h3 className={TITLE}>{title}</h3>
    <div className="tw:flex tw:items-center tw:gap-6">
      <p className={LINE}>{line}</p>
      {children}
    </div>
  </section>
);

export const DangerZoneScreen: React.FC<ScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  onLoadStateChange,
  registerRetryLoad,
  saveError,
}) => {
  const { addToast } = useToast();
  const siteName = composer?.getProjectMetadata?.()?.name ?? "";
  const [site, setSite] = React.useState<SiteLifecycle>({ archived: false, liveAddress: null });
  const [dialog, setDialog] = React.useState<"archive" | "transfer" | "delete" | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [archiveError, setArchiveError] = React.useState<string | null>(null);
  const [actionFailed, setActionFailed] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<TransferMember[] | null>(null);

  React.useEffect(() => {
    onDirtyChange?.(false);
  }, [onDirtyChange]);

  const load = useServerLoad<SiteLifecycle>(
    projectId,
    async (client, siteId) => {
      const [row, domains] = await Promise.all([
        client.sites.get.query({ id: siteId }),
        client.siteDetail.domains.list.query({ siteId }).catch(() => []),
      ]);
      const live = row.status === "PUBLISHED" || row.publishedUrl != null;
      const primary = domains.find((d) => d.isPrimary && d.status === "VERIFIED")?.domain ?? null;
      return { archived: row.status === "ARCHIVED", liveAddress: live ? primary ?? hostOf(row.publishedUrl) : null };
    },
    setSite,
    { onLoadStateChange, registerRetryLoad },
  );

  const client = () => getBuildrikClient(DASHBOARD_URL);

  const archive = async () => {
    if (!projectId) return;
    setBusy(true);
    setArchiveError(null);
    try {
      await client().sites.archive.mutate({ id: projectId });
      setSite((s) => ({ ...s, archived: true }));
      setDialog(null);
      addToast({ title: "Site archived", description: `${siteName} is hidden from the Sites list. The live site stays up.` });
    } catch (e) {
      setArchiveError(refusal(e, "The site was not archived. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const unarchive = async () => {
    if (!projectId) return;
    setBusy(true);
    setActionFailed(null);
    try {
      await client().sites.unarchive.mutate({ id: projectId });
      setSite((s) => ({ ...s, archived: false }));
      addToast({ title: "Site unarchived", description: `${siteName} is back in the Sites list.` });
    } catch (e) {
      setActionFailed(refusal(e, "The site was not unarchived. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const openTransfer = async () => {
    setDialog("transfer");
    setMembers(null);
    try {
      const page = await client().team.list.query({ page: 1, perPage: 50 });
      setMembers(
        page.data
          .filter((m) => m.role === "ADMIN" || m.role === "EDITOR")
          .map((m) => ({ userId: m.userId, fullName: m.fullName ?? m.email ?? "Member", role: m.role })),
      );
    } catch {
      setMembers([]);
    }
  };

  const transfer = async (member: TransferMember) => {
    if (!projectId) return;
    await client().sites.transfer.mutate({ siteId: projectId, newOwnerId: member.userId });
    setDialog(null);
    addToast({ title: "Site transferred", description: `${siteName} now belongs to ${member.fullName}.` });
  };

  const remove = async () => {
    if (!projectId) return;
    await deleteSite(projectId, siteName);
    setDialog(null);
    window.location.assign(`${DASHBOARD_URL}${RECENTLY_DELETED_PATH}`);
  };

  if (!projectId) {
    return (
      <Screen>
        <ActionCard title="Danger zone" line="Open a real site to archive, transfer or delete it." testId="set-danger-demo">
          {null}
        </ActionCard>
      </Screen>
    );
  }

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Danger zone"
          line="Archive, transfer or delete this site."
          state={load.state}
          errorLine="Couldn't load this site. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  const banner = saveError ?? actionFailed;

  return (
    <Screen>
      {banner ? <SaveErrorBanner message={banner} /> : null}

      <ActionCard
        title="Archive site"
        line={
          site.archived
            ? "This site is archived: it is hidden from the Sites list. The live site stays up."
            : "Hide this site from the Sites list. The live site stays up."
        }
        testId="set-danger-archive"
      >
        {site.archived ? (
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className={ACTION}
            id="danger-archive"
            disabled={busy}
            onClick={() => void unarchive()}
            data-testid="set-danger-unarchive-btn"
          >
            Unarchive site
          </Button>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className={ACTION}
            id="danger-archive"
            onClick={() => {
              setArchiveError(null);
              setDialog("archive");
            }}
            data-testid="set-danger-archive-btn"
          >
            Archive site
          </Button>
        )}
      </ActionCard>

      <ActionCard
        title="Transfer site"
        line="Transfer this site to another workspace member. The workspace owner or site creator can do this."
        testId="set-danger-transfer"
      >
        <Button
          type="button"
          size="xs"
          variant="ghost"
          className={ACTION}
          id="danger-transfer"
          onClick={() => void openTransfer()}
          data-testid="set-danger-transfer-btn"
        >
          Transfer site
        </Button>
      </ActionCard>

      <ActionCard
        title="Delete site"
        line={
          site.liveAddress
            ? `Unpublish ${site.liveAddress} now. You can restore it from Recently deleted for 30 days.`
            : "Delete this site. You can restore it from Recently deleted for 30 days."
        }
        testId="set-danger-delete"
      >
        <Button
          type="button"
          size="xs"
          variant="ghost"
          className={ACTION_DANGER}
          id="danger-delete"
          onClick={() => setDialog("delete")}
          data-testid="set-danger-delete-btn"
        >
          Delete site
        </Button>
      </ActionCard>

      <ArchiveSiteDialog
        open={dialog === "archive"}
        siteName={siteName}
        busy={busy}
        error={archiveError}
        onCancel={() => setDialog(null)}
        onArchive={() => void archive()}
      />
      <TransferSiteDialog
        open={dialog === "transfer"}
        siteName={siteName}
        members={members}
        onTransfer={transfer}
        onCancel={() => setDialog(null)}
      />
      <DeleteSiteModal
        open={dialog === "delete"}
        siteName={siteName}
        liveAddress={site.liveAddress}
        onClose={() => setDialog(null)}
        onDelete={remove}
      />
    </Screen>
  );
};
