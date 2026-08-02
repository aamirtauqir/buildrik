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
import { ConfirmDialog, EmptyState, Spinner, Button, VersionRow } from "@/editor/chrome-ui";
import { useEditorRole } from "./hooks/useEditorRole";
import { roleAtLeast } from "@/services/RoleService";
import {
  fetchPublishHistory,
  rollbackToVersion,
  type PublishHistoryRow,
} from "../../services/PublishService";

export interface PublishHistoryProps {
  siteId: string;
  /** Called after a rollback starts, so the shell can poll the new publish job. */
  onRollbackStarted?: () => void;
}

type LoadState = "loading" | "ready" | "error";

function relTime(iso: string | Date | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const d = Math.max(0, Math.round((Date.now() - then) / 86400000));
  if (d === 0) return "today";
  return `${d}d ago`;
}

/* The version line is chrome-ui's VersionRow — Figma 240:6, whose own header
   names "Publish history" as a surface it was drawn for. */
const WRAP = "tw:flex tw:flex-col tw:gap-2 tw:p-3 tw:min-w-80";
const HEAD = "tw:text-[13px] tw:font-semibold tw:text-gray-900";
const NOTICE = "tw:text-xs tw:text-gray-500";


export const PublishHistory: React.FC<PublishHistoryProps> = ({ siteId, onRollbackStarted }) => {
  // P6 permissions boards: rollback is admin-scoped — non-admins see the
  // button disabled with "Ask an admin to roll back", never hidden.
  const canRollback = roleAtLeast(useEditorRole(), "ADMIN") !== false;
  const [state, setState] = React.useState<LoadState>("loading");
  const [rows, setRows] = React.useState<PublishHistoryRow[]>([]);
  const [confirm, setConfirm] = React.useState<PublishHistoryRow | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setState("loading");
    try {
      setRows(await fetchPublishHistory(siteId));
      setState("ready");
    } catch {
      setState("error");
    }
  }, [siteId]);

  React.useEffect(() => { void load(); }, [load]);

  const doRollback = async () => {
    const target = confirm;
    setConfirm(null);
    if (!target) return;
    try {
      await rollbackToVersion(siteId, target.id);
      setNotice(`Rolling back to version ${target.version} — publishing a new version…`);
      onRollbackStarted?.();
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setNotice(
        /PRECONDITION|rolled back to/i.test(msg)
          ? "That version can no longer be rolled back to."
          : /CONFLICT|in progress/i.test(msg)
            ? "A publish is already in progress — try again in a moment."
            : "Couldn't roll back. Try again.",
      );
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
      <div className={HEAD}>Published versions</div>
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
