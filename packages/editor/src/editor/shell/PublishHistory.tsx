/**
 * PublishHistory (P1) — the published-version list + rollback (contract §5).
 *
 * Rollback is a NEW publish of a stored version, never a mutation of history.
 * The latest COMPLETED is the live version (no rollback to self). Older versions
 * roll back if their payload is still retained (the 20-most-recent keep it);
 * pruned ones are shown disabled with the reason.
 *
 * Load honours DF5: a failed load shows "couldn't load · Retry", never the empty
 * "no versions" state (fetchPublishHistory throws).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ConfirmDialog, EmptyState, Modal, Progress, Spinner, Button, VersionRow } from "@/editor/chrome-ui";
import { useEditorRole } from "./hooks/useEditorRole";
import { formatRelativeTime } from "@/shared/utils/relativeTime";
import { domainOf } from "@/editor/sidebar/tabs/publish/usePublishSnapshot";
import { roleAtLeast } from "@/services/RoleService";
import {
  fetchPublishHistory,
  fetchSitePublishState,
  rollbackToVersion,
  type PublishHistoryRow,
} from "../../services/PublishService";

export interface PublishHistoryProps {
  siteId: string;
  /** Called after a rollback starts, so the shell can poll the new publish job. */
  onRollbackStarted?: () => void;  /**
   * The shell's publish job, as far as this panel needs it. Three boards run
   * off one state: 184:37 "Rolling back…" (a bar while it publishes), 184:45
   * "Rolled back" (the green confirmation naming the new live version), and
   * 453:4064 "Rollback failed". The job lives in usePublishJob; this panel
   * knows which version was asked for and pairs the two. Omitted = no feed,
   * and the panel keeps its notice line only.
   */
  rollbackJob?: { state: "publishing" | "published" | "failed"; progress: number } | null;

}

type LoadState = "loading" | "ready" | "error";

/* Board 949:4474 runs "2h ago · 2d ago · 1w ago · 2w ago". This was a local
   day-granularity function that collapsed everything under 24h to "today" —
   so a publish two hours old and one twenty-three hours old read the same,
   in the one list whose whole job is telling versions apart in time. It was
   also a fourth inline copy of a helper whose own docstring says it replaced
   the other three. */
function relTime(iso: string | Date | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  return formatRelativeTime(then, { fallback: "weeks", justNowLabel: "just now" });
}

/* The version line is chrome-ui's VersionRow — Figma 240:6, whose own header
   names "Publish history" as a surface it was drawn for. */
const WRAP = "tw:flex tw:flex-col tw:gap-2 tw:p-3 tw:min-w-80";
/* Board 949:4474's live banner — green tint block above the list. */
const LIVE_BANNER =
  "tw:rounded-md tw:bg-[var(--bk-success-tint)] tw:px-3 tw:py-2.5 tw:flex tw:flex-col tw:gap-1";
const LIVE_TITLE =
  "tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:font-semibold tw:text-[var(--bk-success-text)]";
const LIVE_DOT = "tw:size-2 tw:rounded-full tw:bg-[var(--bk-success)]";
const LIVE_META = "tw:text-xs tw:text-[var(--bk-ink-soft)]";
/* Board 949:4474 closes the list with the rule that makes rollback safe to
   try. It sits under the rows, not in a tooltip on each one. */
const FOOTER_NOTE = "tw:mt-2 tw:text-xs tw:text-[var(--bk-ink-muted)]";
const NOTICE = "tw:text-xs tw:text-gray-500";


export const PublishHistory: React.FC<PublishHistoryProps> = ({ siteId, onRollbackStarted, rollbackJob = null }) => {
  // P6 permissions boards: rollback is admin-scoped — non-admins see the
  // button disabled with "Ask an admin to roll back", never hidden.
  const canRollback = roleAtLeast(useEditorRole(), "ADMIN") !== false;
  const [state, setState] = React.useState<LoadState>("loading");
  const [rows, setRows] = React.useState<PublishHistoryRow[]>([]);
  const [confirm, setConfirm] = React.useState<PublishHistoryRow | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  /* Board 453:4064 answers a failed rollback with a MODAL, not a line of grey
     text under the header — and its copy carries the one fact the user needs
     first: the live site did not change. `failed` holds the version that was
     attempted plus the live version, because the board names both ("v5 could
     not be re-published. Your live site is unchanged — still v6."). */
  const [failed, setFailed] = React.useState<{ target: number; live?: number; reason: string } | null>(null);
  /** The versions a rollback is re-publishing, for boards 184:37 / 184:45. */
  const [rollingBack, setRollingBack] = React.useState<{ target: number; live?: number } | null>(null);
  /** Board 184:45 — set when the shell reports the rollback job finished. */
  const [rolledBack, setRolledBack] = React.useState<{ target: number; newLive: number; previous?: number } | null>(null);

  /* Board 949:4474's banner names the live DOMAIN, which the history rows do
     not carry. Best-effort and separate from `state`: a domain we cannot read
     costs the banner one clause, and must not turn the whole list into the
     load-error board. */
  const [liveDomain, setLiveDomain] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setState("loading");
    try {
      setRows(await fetchPublishHistory(siteId));
      setState("ready");
    } catch {
      setState("error");
    }
    try {
      setLiveDomain(domainOf((await fetchSitePublishState(siteId)).publishedUrl));
    } catch {
      setLiveDomain(null);
    }
  }, [siteId]);

  React.useEffect(() => { void load(); }, [load]);

  /* The rollback is not done when rollbackToVersion resolves — that only
     STARTS the job. The drawn end states (184:45 rolled back, 453:4064
     failed) belong to the job finishing, which the shell polls. */
  React.useEffect(() => {
    if (!rollingBack || !rollbackJob) return;
    if (rollbackJob.state === "published") {
      setRolledBack({
        target: rollingBack.target,
        newLive: (rollingBack.live ?? rollingBack.target) + 1,
        previous: rollingBack.live,
      });
      setRollingBack(null);
      setNotice(null);
      void load();
    } else if (rollbackJob.state === "failed") {
      setFailed({
        target: rollingBack.target,
        live: rollingBack.live,
        reason: "The re-publish did not finish. Nothing was overwritten — retry, or pick a different version.",
      });
      setRollingBack(null);
      setNotice(null);
    }
  }, [rollbackJob, rollingBack, load]);

  const doRollback = async () => {
    const target = confirm;
    setConfirm(null);
    if (!target) return;
    try {
      setRollingBack({ target: target.version, live: rows[0]?.version });
      await rollbackToVersion(siteId, target.id);
      setNotice(`Rolling back to version ${target.version} — publishing a new version…`);
      onRollbackStarted?.();
      await load();
      /* rollbackToVersion resolving means the job STARTED, not finished.
         Clearing the in-flight marker here made the progress modal
         unreachable, and clearing it "only when no feed exists" was wrong
         too: onRollbackStarted is what makes the shell begin polling, so the
         feed legitimately arrives a tick AFTER this line. The marker is
         consumed by the effect above, on the job's first terminal state. */
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      /* The three outcomes the service can actually produce (publish.service:
         NOT_ROLLBACKABLE, an in-progress CONFLICT, anything else). The board
         draws one modal; the reason line is what differs. */
      setRollingBack(null);
      setFailed({
        target: target.version,
        live: rows[0]?.version,
        reason: /PRECONDITION|rolled back to/i.test(msg)
          ? "That version's snapshot is no longer stored, so it cannot be re-published."
          : /CONFLICT|in progress/i.test(msg)
            ? "A publish is already running. Wait for it to finish, then try again."
            : "Nothing was overwritten. Retry the rollback, or pick a different version.",
      });
    }
  };

  if (state === "loading") {
    return <EmptyState icon={<Spinner size="lg" />} body="Loading versions…" />;
  }
  if (state === "error") {
    return (
      <EmptyState
        icon={<AlertCircle size={24} aria-hidden="true" />}
        title="Couldn't load publish history"
        action={<Button color="light" size="xs" onClick={() => void load()}>Retry</Button>}
      />
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 size={24} aria-hidden="true" />}
        title="No published versions yet"
        body="Publish this site and each version shows up here — you can roll back to any of the last 20."
      />
    );
  }

  return (
    <div className={WRAP}>
      {/* Board 949:4474 opens on WHAT IS LIVE, not on a list header. The
          board's banner also names the publisher ("by Ali"); no column on
          publish_build_jobs carries one, so that clause is absent rather than
          invented — the SHAPE is the contract, the sample is not.

          The "Published versions" header this replaced was a third label for
          a destination the tab strip and the sub-tab already name. */}
      {rows[0] && (
        <div className={LIVE_BANNER}>
          <div className={LIVE_TITLE}>
            <span className={LIVE_DOT} aria-hidden="true" />
            LIVE · v{rows[0].version}
          </div>
          <div className={LIVE_META}>
            {liveDomain ? `${liveDomain} · ` : ""}
            published {relTime(rows[0].completedAt)}
          </div>
        </div>
      )}
      {notice && <div className={NOTICE}>{notice}</div>}
      {rows.map((r, i) => {
        const isLive = i === 0;
        // rolledBackFrom is a job id — map it to that version's number for the label.
        const fromVersion = r.rolledBackFrom
          ? rows.find((x) => x.id === r.rolledBackFrom)?.version
          : undefined;
        return (
          <VersionRow
            key={r.id}
            data-version-row
            data-version={r.version}
            /* No row-level click target here — the only action is the button
               inside it, and a focusable role=button that does nothing is a
               keyboard trap with no payoff. */
            interactive={false}
            title={`Version ${r.version}`}
            current={isLive}
            currentLabel="Live"
            meta={fromVersion !== undefined ? `↩ from v${fromVersion} · ${relTime(r.completedAt)}` : relTime(r.completedAt)}
            actions={
              !isLive ? (
                <Button
                  color="light"
                  size="xs"
                  disabled={!r.rollbackable || !canRollback}
                  title={
                    !canRollback
                      ? "Ask an admin to roll back"
                      : r.rollbackable
                        ? undefined
                        : "This version's snapshot is no longer stored"
                  }
                  onClick={() => setConfirm(r)}
                >
                  Roll back
                </Button>
              ) : undefined
            }
          />
        );
      })}

      {/* Board 949:4474 states the rule that makes rollback safe to try, once,
          under the list — rather than leaving the user to infer it from a
          button labelled "Roll back". Both halves matter: nothing is lost,
          AND rolling back is itself a deploy. */}
      <p className={FOOTER_NOTE}>
        Every publish is restorable. Rolling back redeploys that version.
      </p>

      {/* Board 184:37 — "Rolling back…", a determinate bar, and the caption
          naming both versions. Rendered only while the shell reports a job in
          flight; without a progress feed the panel keeps its notice line. */}
      <Modal
        open={rollingBack !== null && rollbackJob?.state === "publishing"}
        onClose={() => setRollingBack(null)}
        kind="form"
        title="Rolling back…"
      >
        <Progress progress={rollbackJob?.progress ?? 0} size="sm" />
        <p className="tw:mt-2 tw:text-[11px] tw:text-[var(--bk-ink-muted)]">
          Publishing v{rollingBack?.target} as v
          {rollingBack?.live !== undefined ? rollingBack.live + 1 : "…"}
        </p>
      </Modal>

      {/* Board 184:45 — the green confirmation. It names what is live now AND
          that the version it replaced is still rollable, which is the whole
          reassurance: a rollback here never destroys anything. */}
      <Modal
        open={rolledBack !== null}
        onClose={() => setRolledBack(null)}
        kind="form"
        title="Rolled back"
        footer={
          <div className="tw:flex tw:justify-end">
            <Button onClick={() => setRolledBack(null)}>Close</Button>
          </div>
        }
      >
        <p className="tw:text-center">
          v{rolledBack?.newLive} is live — a re-publish of v{rolledBack?.target}.
        </p>
        {rolledBack?.previous !== undefined && (
          <p className="tw:mt-1 tw:text-center tw:text-[11px] tw:text-[var(--bk-ink-muted)]">
            v{rolledBack.previous} is still in your history and can be rolled forward the same way.
          </p>
        )}
      </Modal>

      {/* Board 453:4064 — the failure modal. "Try again" reopens the confirm
          for the same version rather than firing a second rollback straight
          from an error dialog: after a failure the user should see what they
          are re-attempting. */}
      <ConfirmDialog
        open={failed !== null}
        onClose={() => setFailed(null)}
        onConfirm={() => {
          const again = rows.find((r) => r.version === failed?.target) ?? null;
          setFailed(null);
          setConfirm(again);
        }}
        title="Rollback failed"
        message={
          <>
            <p className="tw:font-medium tw:text-[var(--bk-error-text)]">
              v{failed?.target} could not be re-published. Your live site is unchanged
              {failed?.live !== undefined ? ` — still v${failed.live}` : ""}.
            </p>
            <p className="tw:mt-2">{failed?.reason}</p>
          </>
        }
        confirmLabel="Try again"
        cancelLabel="Close"
      />

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => void doRollback()}
        title={confirm ? `Roll back to version ${confirm.version}?` : "Roll back?"}
        message="This re-publishes that version as a new one — it doesn't delete anything and your current draft is untouched. The live site changes to the older version."
        confirmLabel="Roll back now"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default PublishHistory;
