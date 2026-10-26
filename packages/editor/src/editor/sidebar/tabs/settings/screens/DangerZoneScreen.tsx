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
 * Every action applies at once (`immediate`). Below OWNER (`readOnly`) the
 * screen draws its own read-only notice and disables Archive and Delete
 * (PD-3); Transfer stays enabled for an ADMIN who may transfer — the site's
 * creator (`sites.myRole` → `canTransfer`, `transferSite`'s rule). The shell
 * does not wrap this screen in its disabled fieldset, so one button can stay
 * on. Field anchors: `danger-archive`, `danger-transfer`, `danger-delete`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, useToast } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { deleteSite } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { DeleteSiteModal } from "@/editor/shell/modals/DeleteSiteModal";
import { roleAtLeast } from "@/services/RoleService";
import { LoadCard, ReadOnlyBanner, SET_BTN, SET_CARD, SaveErrorBanner, Screen } from "../shared";
import { useServerLoad } from "../hooks/useServerLoad";
import type { ScreenProps } from "../types";
import { ArchiveSiteDialog } from "../components/ArchiveSiteDialog";
import { TransferSiteDialog, type TransferMember } from "../components/TransferSiteDialog";

interface SiteLifecycle {
  archived: boolean;
  /** The address a delete takes offline, or null when nothing is live. */
  liveAddress: string | null;
  /** Who owns the site now (`Site.createdBy`) — never a transfer target. */
  createdBy: string | null;
  /** `transferSite` would allow the viewer (the site's creator, or the OWNER). */
  canTransfer: boolean;
  /** The viewer may transfer from here: `transferSite` allows them and they can list the members (ADMIN+). */
  transferAllowed: boolean;
}

/* 8137:216834: the read-only notice, true for the viewer it is shown to. */
export const DANGER_READ_ONLY_NOTICE = {
  /** Transfer is off too. */
  all: "Only the workspace owner can archive or delete this site. Only the workspace owner or site creator can transfer it.",
  /** A creator below ADMIN: the server would allow it, but this screen cannot list the members (`team.list` is ADMIN). */
  creatorBelowAdmin:
    "Only the workspace owner can archive or delete this site. Only the workspace owner or an admin who created it can transfer it.",
  /** An ADMIN who created the site keeps Transfer. */
  transferOnly: "Only the workspace owner can archive or delete this site. You created it, so you can transfer it.",
} as const;

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

/* 2L9 B8-S16 238:14472: one "Danger zone" card, a ruled row per action —
   the action's name (240), what it does (284, muted), and a text link at the
   right (accent; Delete in error ink). */
const CARD = `${SET_CARD} tw:flex tw:w-full tw:max-w-180 tw:flex-col tw:gap-2.5 tw:p-4`;
const TITLE = "tw:m-0 tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
const ROW = "tw:flex tw:min-h-12 tw:items-center tw:gap-3 tw:border-b tw:border-[var(--bk-border)] tw:py-2";
const LABEL = "tw:w-60 tw:shrink-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const LINE = "tw:m-0 tw:min-w-0 tw:flex-1 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const ACTION =
  "tw:h-8 tw:w-35 tw:shrink-0 tw:justify-start tw:px-0 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:no-underline tw:hover:underline " +
  "tw:disabled:text-[var(--bk-gray-400)]";
const ACTION_DANGER = `${ACTION} tw:text-[var(--bk-error-text)]`;

const ActionRow: React.FC<{
  title: string;
  line: string;
  testId: string;
  children: React.ReactNode;
}> = ({ title, line, testId, children }) => (
  <div className={ROW} data-testid={testId}>
    <span className={LABEL}>{title}</span>
    <p className={LINE}>{line}</p>
    {children}
  </div>
);

export const DangerZoneScreen: React.FC<ScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  onLoadStateChange,
  registerRetryLoad,
  saveError,
  readOnly,
}) => {
  const { addToast } = useToast();
  const siteName = composer?.getProjectMetadata?.()?.name ?? "";
  const [site, setSite] = React.useState<SiteLifecycle>({ archived: false, liveAddress: null, createdBy: null, canTransfer: false, transferAllowed: false });
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
      const [row, domains, mine] = await Promise.all([
        client.sites.get.query({ id: siteId }),
        client.siteDetail.domains.list.query({ siteId }).catch(() => []),
        client.sites.myRole.query({ siteId }).catch(() => null),
      ]);
      const live = row.status === "PUBLISHED" || row.publishedUrl != null;
      const primary = domains.find((d) => d.isPrimary && d.status === "VERIFIED")?.domain ?? null;
      return {
        archived: row.status === "ARCHIVED",
        liveAddress: live ? primary ?? hostOf(row.publishedUrl) : null,
        createdBy: row.createdBy ?? null,
        canTransfer: !!mine?.canTransfer,
        transferAllowed: !!mine?.canTransfer && roleAtLeast(mine.role, "ADMIN") === true,
      };
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
          /* Not the current owner: a creator ADMIN transferring would
             otherwise be offered themselves. */
          .filter((m) => (m.role === "ADMIN" || m.role === "EDITOR") && m.userId !== site.createdBy)
          .map((m) => ({ userId: m.userId, fullName: m.fullName ?? m.email ?? "Member", role: m.role })),
      );
    } catch {
      setMembers([]);
    }
  };

  const transfer = async (member: TransferMember) => {
    if (!projectId) return;
    await client().sites.transfer.mutate({ siteId: projectId, newOwnerId: member.userId });
    /* The viewer is no longer the creator: below OWNER that was their only
       right to transfer, so Transfer and the notice follow at once. */
    setSite((s) => ({
      ...s,
      createdBy: member.userId,
      canTransfer: readOnly ? false : s.canTransfer,
      transferAllowed: readOnly ? false : s.transferAllowed,
    }));
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
        <section className={CARD}>
          <h3 className={TITLE}>Danger zone</h3>
          <ActionRow title="Danger zone" line="Open a real site to archive, transfer or delete it." testId="set-danger-demo">
            {null}
          </ActionRow>
        </section>
      </Screen>
    );
  }

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Danger zone"
          state={load.state}
          errorLine="Couldn't load this site. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  const banner = saveError ?? actionFailed;
  /* PD-3: Archive and Delete are the OWNER's. Transfer follows Q-B5. */
  const ownerActionsOff = !!readOnly;
  const transferOff = !!readOnly && !site.transferAllowed;
  const notice = !readOnly
    ? null
    : site.transferAllowed
      ? DANGER_READ_ONLY_NOTICE.transferOnly
      : site.canTransfer
        ? DANGER_READ_ONLY_NOTICE.creatorBelowAdmin
        : DANGER_READ_ONLY_NOTICE.all;

  return (
    <Screen>
      {notice ? <ReadOnlyBanner message={notice} /> : null}
      {banner ? <SaveErrorBanner message={banner} /> : null}

      <section className={CARD} aria-label="Danger zone">
      <h3 className={TITLE}>Danger zone</h3>
      <ActionRow
        title="Archive site"
        line={
          site.archived
            ? "Archived — hidden from your dashboard. The live site stays up."
            : "Hides it from your dashboard. You can unarchive any time."
        }
        testId="set-danger-archive"
      >
        {site.archived ? (
          <Button
            type="button"
            size="xs"
            variant="link"
            className={ACTION}
            id="danger-archive"
            disabled={busy || ownerActionsOff}
            onClick={() => void unarchive()}
            data-testid="set-danger-unarchive-btn"
          >
            Unarchive
          </Button>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="link"
            className={ACTION}
            id="danger-archive"
            disabled={ownerActionsOff}
            onClick={() => {
              setArchiveError(null);
              setDialog("archive");
            }}
            data-testid="set-danger-archive-btn"
          >
            Archive
          </Button>
        )}
      </ActionRow>

      <ActionRow
        title="Transfer site"
        line="Move it to another member of this workspace."
        testId="set-danger-transfer"
      >
        <Button
          type="button"
          size="xs"
          variant="link"
          className={ACTION}
          id="danger-transfer"
          disabled={transferOff}
          onClick={() => void openTransfer()}
          data-testid="set-danger-transfer-btn"
        >
          Transfer…
        </Button>
      </ActionRow>

      <ActionRow
        title="Delete site"
        line={
          site.liveAddress
            ? `Unpublishes ${site.liveAddress}. You can restore it for 30 days from Recently deleted.`
            : "You can restore it for 30 days from Recently deleted."
        }
        testId="set-danger-delete"
      >
        <Button
          type="button"
          size="xs"
          variant="link"
          className={ACTION_DANGER}
          id="danger-delete"
          disabled={ownerActionsOff}
          onClick={() => setDialog("delete")}
          data-testid="set-danger-delete-btn"
        >
          Delete site…
        </Button>
      </ActionRow>
      </section>

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
