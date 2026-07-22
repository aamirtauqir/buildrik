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
import { Button, Icon, Badge, Spinner } from "@/editor/shared/vibcoder";
import { ConfirmDialog } from "@/shared/extensions/ConfirmDialog";
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

const S: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", gap: 8, padding: 12, minWidth: 320 },
  head: { fontSize: 13, fontWeight: 600, color: "var(--bd-text)" },
  row: { display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", padding: "8px 10px", border: "1px solid var(--bd-border)", borderRadius: 8 },
  left: { display: "flex", flexDirection: "column", gap: 2 },
  ver: { fontSize: 13, fontWeight: 600, color: "var(--bd-text)", display: "flex", alignItems: "center", gap: 6 },
  meta: { fontSize: 11, color: "var(--bd-text-muted)" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, textAlign: "center", color: "var(--bd-text-muted)" },
  centerTitle: { fontSize: 14, fontWeight: 600, color: "var(--bd-text)" },
  centerHint: { fontSize: 12, color: "var(--bd-text-muted)", maxWidth: 260 },
  notice: { fontSize: 12, color: "var(--bd-text-muted)" },
};

export const PublishHistory: React.FC<PublishHistoryProps> = ({ siteId, onRollbackStarted }) => {
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
    return <div style={S.center}><Spinner size="lg" /><span>Loading versions…</span></div>;
  }
  if (state === "error") {
    return (
      <div style={S.center}>
        <Icon name="alert-circle" size="lg" />
        <div style={S.centerTitle}>Couldn't load publish history</div>
        <Button variant="secondary" size="sm" onClick={() => void load()}>Retry</Button>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div style={S.center}>
        <Icon name="check-circle" size="lg" />
        <div style={S.centerTitle}>No published versions yet</div>
        <div style={S.centerHint}>Publish this site and each version shows up here — you can roll back to any of the last 20.</div>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <div style={S.head}>Published versions</div>
      {notice && <div style={S.notice}>{notice}</div>}
      {rows.map((r, i) => {
        const isLive = i === 0;
        // rolledBackFrom is a job id — map it to that version's number for the label.
        const fromVersion = r.rolledBackFrom
          ? rows.find((x) => x.id === r.rolledBackFrom)?.version
          : undefined;
        return (
          <div style={S.row} key={r.id} data-version-row data-version={r.version}>
            <div style={S.left}>
              <span style={S.ver}>
                Version {r.version}
                {isLive && <Badge variant="published">Live</Badge>}
                {fromVersion !== undefined && <span style={S.meta}>↩ from v{fromVersion}</span>}
              </span>
              <span style={S.meta}>{relTime(r.completedAt)}</span>
            </div>
            {!isLive && (
              <Button
                variant="secondary"
                size="sm"
                disabled={!r.rollbackable}
                title={r.rollbackable ? undefined : "This version's snapshot is no longer stored"}
                onClick={() => setConfirm(r)}
              >
                Roll back
              </Button>
            )}
          </div>
        );
      })}

      <ConfirmDialog
        isOpen={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => void doRollback()}
        title={confirm ? `Roll back to version ${confirm.version}?` : "Roll back?"}
        message="This re-publishes that version as a new one — it doesn't delete anything and your current draft is untouched. The live site changes to the older version."
        confirmText="Roll back now"
        cancelText="Cancel"
      />
    </div>
  );
};

export default PublishHistory;
