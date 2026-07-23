/**
 * IssuesPanel (P3) — one place to review every issue the editor knows about
 * (DS-lint, broken internal links, missing alt text — all already aggregated
 * into state.issues). Filter by severity, jump to the offending element.
 *
 * Auto-fix (the drawn fixing / fix-failed states) is deferred to Phase F.2 —
 * v1 surfaces + navigates, it doesn't mutate. Stated honestly rather than faked.
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
}

type Filter = "all" | "error" | "warning";

const TONE: Record<Issue["type"], { icon: "alert-circle" | "info"; color: string }> = {
  error: { icon: "alert-circle", color: "var(--bd-danger)" },
  warning: { icon: "alert-circle", color: "var(--bd-warning-strong)" },
  info: { icon: "info", color: "var(--bd-text-muted)" },
};

const S: Record<string, React.CSSProperties> = {
  body: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 },
  toolbar: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: "1px solid var(--bd-border)" },
  summary: { fontSize: 12, color: "var(--bd-text-muted)", padding: "6px 12px" },
  scroll: { flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 12px 12px" },
  row: { display: "flex", gap: 8, padding: "8px 10px", border: "1px solid var(--bd-border)", borderRadius: "var(--bd-radius-md)", marginBottom: 6, cursor: "pointer", alignItems: "flex-start", width: "100%", textAlign: "left", background: "transparent" },
  msg: { fontSize: 13, color: "var(--bd-text)", lineHeight: 1.4 },
  center: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 28, textAlign: "center", color: "var(--bd-text-muted)" },
  centerTitle: { fontSize: 14, fontWeight: 600, color: "var(--bd-text)" },
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "error", label: "Errors" },
  { key: "warning", label: "Warnings" },
];

export const IssuesPanel: React.FC<IssuesPanelProps> = ({ issues, onClose, onSelectElement }) => {
  const [filter, setFilter] = React.useState<Filter>("all");
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
          <div style={S.scroll}>
            {visible.length === 0 ? (
              <div style={S.center}>
                <Icon name="check-circle" size="lg" />
                <div style={S.centerTitle}>No {filter === "error" ? "errors" : "warnings"}</div>
              </div>
            ) : (
              visible.map((i) => (
                <div
                  role="button"
                  tabIndex={0}
                  key={i.id}
                  style={S.row}
                  onClick={() => onSelectElement?.(i.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectElement?.(i.id); } }}
                >
                  <span style={{ color: TONE[i.type].color, marginTop: 1, flexShrink: 0 }}>
                    <Icon name={TONE[i.type].icon} size="sm" />
                  </span>
                  <span style={S.msg}>{i.message}</span>
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
