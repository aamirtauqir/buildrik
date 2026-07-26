/**
 * IssuesPanel (P3) — one place to review every issue the editor knows about
 * (DS-lint today; broken links and missing alt text as those producers land).
 * Filter by severity, jump to the offending element, and auto-fix what can be
 * fixed mechanically.
 *
 * Auto-fix (Figma `Issues · fixing` / `Issues · fix-failed`, nodes 164:42 and
 * 164:57) rides the engine's existing `designSystem.applyAutoFix`, which wraps
 * the token rewrite in one transaction — that is why the fixing band can
 * promise "Auto-fix lands as ONE undo step" without the panel doing anything
 * to earn it. `applyAutoFix` returns the new value, or null when it cannot
 * safely rewrite the token; null is the fix-failed branch.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Icon } from "@/editor/shared/vibcoder";
import { PanelHeader } from "@/shared/extensions/PanelHeader";
import type { Issue } from "./hooks/useStudioState";

export interface IssuesPanelProps {
  issues: Issue[];
  onClose: () => void;
  /** Jump to the element/target an issue points at (its id). */
  onSelectElement?: (id: string) => void;
  /**
   * Attempt the mechanical repair. Resolves to the new value, or null when the
   * engine declined — the panel renders that null as fix-failed rather than
   * pretending the issue is gone.
   */
  onFix?: (issue: Issue) => Promise<string | null>;
  /** Route to the Brand panel, where the offending token actually lives. */
  onOpenBrand?: () => void;
  /** Suppress this token's issues for the session. */
  onIgnore?: (tokenId: string) => void;
}

type Filter = "all" | "error" | "warning";

/** Only token-backed issues carrying a hint can be repaired mechanically. */
function isFixable(i: Issue): boolean {
  return Boolean(i.tokenId && i.autoFixHint);
}

const TONE: Record<Issue["type"], { icon: "alert-circle" | "info"; color: string }> = {
  error: { icon: "alert-circle", color: "var(--bk-error)" },
  warning: { icon: "alert-circle", color: "var(--bk-warning-text)" },
  info: { icon: "info", color: "var(--bk-ink-muted)" },
};

const S: Record<string, React.CSSProperties> = {
  body: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 },
  toolbar: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: "1px solid var(--bk-border)" },
  summary: { fontSize: 12, color: "var(--bk-ink-muted)", padding: "6px 12px" },
  scroll: { flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 12px 12px" },
  rowShell: { display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 },
  row: { display: "flex", gap: 8, padding: "8px 10px", border: "1px solid var(--bk-border)", borderRadius: "var(--bk-radius-lg)", cursor: "pointer", alignItems: "flex-start", flex: 1, minWidth: 0, textAlign: "left", background: "transparent" },
  msg: { fontSize: 13, color: "var(--bk-ink)", lineHeight: 1.4 },
  loc: { fontSize: 11, fontWeight: 500, color: "var(--bk-ink-muted)", marginTop: 2 },
  rowMain: { display: "flex", flexDirection: "column", minWidth: 0, flex: 1 },
  // fixing — accent-tint band (Figma 164:48)
  fixing: { background: "var(--bk-accent-tint)", padding: "10px 12px", borderBottom: "1px solid var(--bk-border)" },
  fixingLabel: { fontSize: 12, color: "var(--bk-accent-text)" },
  track: { height: 6, background: "var(--bk-bg-card)", borderRadius: "var(--bk-radius-sm)", overflow: "hidden", margin: "8px 0 6px" },
  fill: { height: 6, background: "var(--bk-accent)", borderRadius: "var(--bk-radius-sm)", width: "60%" },
  undoNote: { fontSize: 11, fontWeight: 500, color: "var(--bk-ink-muted)" },
  // fix-failed — warning-tint band (Figma 164:63)
  failed: { background: "var(--bk-warning-tint)", padding: "10px 12px", borderBottom: "1px solid var(--bk-border)" },
  failedTitle: { fontSize: 12, color: "var(--bk-error-text)" },
  failedWhy: { fontSize: 11, fontWeight: 500, color: "var(--bk-ink-muted)", lineHeight: 1.45, marginTop: 6 },
  failedActions: { display: "flex", gap: 8, marginTop: 8 },
  center: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 28, textAlign: "center", color: "var(--bk-ink-muted)" },
  centerTitle: { fontSize: 14, fontWeight: 600, color: "var(--bk-ink)" },
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "error", label: "Errors" },
  { key: "warning", label: "Warnings" },
];

export const IssuesPanel: React.FC<IssuesPanelProps> = ({
  issues,
  onClose,
  onSelectElement,
  onFix,
  onOpenBrand,
  onIgnore,
}) => {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [fixing, setFixing] = React.useState<Issue | null>(null);
  const [failed, setFailed] = React.useState<Issue | null>(null);

  const runFix = async (issue: Issue) => {
    if (!onFix) return;
    setFailed(null);
    setFixing(issue);
    try {
      const result = await onFix(issue);
      // null means the engine declined the rewrite. Saying nothing here would
      // leave the issue on screen with no explanation for why Fix did nothing.
      if (result === null) setFailed(issue);
    } catch {
      setFailed(issue);
    } finally {
      setFixing(null);
    }
  };
  const errorCount = issues.filter((i) => i.type === "error").length;
  const warnCount = issues.filter((i) => i.type === "warning").length;
  const visible = filter === "all" ? issues : issues.filter((i) => i.type === filter);

  return (
    <div style={S.body}>
      <PanelHeader title="Issues" onClose={onClose} />

      {issues.length === 0 ? (
        <div style={S.center}>
          <Icon name="check-circle" size="lg" />
          <div style={S.centerTitle}>No issues</div>
          <div style={S.summary}>Your site is clean — nothing to fix.</div>
        </div>
      ) : (
        <>
          <div style={S.toolbar}>
            {FILTERS.map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "primary" : "ghost"}
                size="sm"
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div style={S.summary}>
            {errorCount} error{errorCount === 1 ? "" : "s"} · {warnCount} warning{warnCount === 1 ? "" : "s"}
          </div>

          {fixing && (
            <div style={S.fixing} role="status" aria-live="polite">
              <div style={S.fixingLabel}>Fixing {fixing.message.toLowerCase()}…</div>
              <div style={S.track}>
                <div style={S.fill} />
              </div>
              <div style={S.undoNote}>Auto-fix lands as ONE undo step.</div>
            </div>
          )}

          {failed && (
            <div style={S.failed} role="alert">
              <div style={S.failedTitle}>Couldn&apos;t fix this automatically.</div>
              <div style={S.failedWhy}>
                {failed.location ?? "This value"} comes from your brand tokens, so changing it here
                would change every site using them.
              </div>
              <div style={S.failedActions}>
                <Button variant="ghost" size="sm" onClick={() => { setFailed(null); onOpenBrand?.(); }}>
                  Open Brand
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (failed.tokenId) onIgnore?.(failed.tokenId);
                    setFailed(null);
                  }}
                >
                  Ignore once
                </Button>
              </div>
            </div>
          )}
          <div style={S.scroll}>
            {visible.length === 0 ? (
              <div style={S.center}>
                <Icon name="check-circle" size="lg" />
                <div style={S.centerTitle}>No {filter === "error" ? "errors" : "warnings"}</div>
              </div>
            ) : (
              visible.map((i) => (
                // Fix sits BESIDE the navigate target, never inside it — a
                // button nested in a role="button" is invalid, and it also
                // swallows the outer element's accessible name.
                <div key={i.id} style={S.rowShell}>
                  <div
                    role="button"
                    tabIndex={0}
                    style={S.row}
                    onClick={() => onSelectElement?.(i.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectElement?.(i.id); } }}
                  >
                    <span style={{ color: TONE[i.type].color, marginTop: 1, flexShrink: 0 }}>
                      <Icon name={TONE[i.type].icon} size="sm" />
                    </span>
                    <span style={S.rowMain}>
                      <span style={S.msg}>{i.message}</span>
                      {i.location && <span style={S.loc}>{i.location}</span>}
                    </span>
                  </div>
                  {isFixable(i) && onFix && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={fixing !== null}
                      onClick={() => void runFix(i)}
                    >
                      Fix ›
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default IssuesPanel;
