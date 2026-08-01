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
 * The issue line is chrome-ui's Row, not a hand-built role="button" div: Row
 * already owns that exact contract (role, tabIndex, Enter/Space, disabled).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { PanelHeader, Button, EmptyState, Progress, Row, Toolbar } from "@/editor/chrome-ui";
import { issueAppliesToPage, type Issue } from "./hooks/useStudioState";

export interface IssuesPanelProps {
  issues: Issue[];
  onClose: () => void;
  /**
   * The page the user is looking at (topbar plan T10). Enables the
   * "This page / All pages" scope filter — which only renders when at least
   * one issue actually carries a pageId, so the control never shows two
   * identical views (today's DS-lint issues are all site-wide).
   */
  activePageId?: string | null;
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

const TONE: Record<Issue["type"], { icon: React.ReactNode; className: string }> = {
  error: { icon: <AlertCircle size={14} aria-hidden="true" />, className: "tw:text-[var(--bk-error)]" },
  warning: { icon: <AlertCircle size={14} aria-hidden="true" />, className: "tw:text-[var(--bk-warning-text)]" },
  info: { icon: <Info size={14} aria-hidden="true" />, className: "tw:text-gray-500" },
};

const BODY = "tw:flex tw:flex-col tw:h-full tw:min-h-0";
const SUMMARY = "tw:text-xs tw:text-gray-500 tw:px-3 tw:py-1.5";
const SCROLL = "tw:flex-1 tw:min-h-0 tw:overflow-y-auto tw:pt-1 tw:px-3 tw:pb-3";
/** The fixing / fix-failed bands differ only by tint. */
const BAND = "tw:px-3 tw:py-2.5 tw:border-b tw:border-gray-200";
/** The quiet button look, previously copy-pasted onto six separate Buttons. */
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "error", label: "Errors" },
  { key: "warning", label: "Warnings" },
];

export const IssuesPanel: React.FC<IssuesPanelProps> = ({
  issues,
  onClose,
  activePageId = null,
  onSelectElement,
  onFix,
  onOpenBrand,
  onIgnore,
}) => {
  const [filter, setFilter] = React.useState<Filter>("all");
  // T10 page scope. Defaults to "page" — "what's wrong with what I'm looking
  // at" is the question the panel opens to answer. Site-wide issues pass the
  // page scope too (they apply everywhere), so nothing publish-blocking hides.
  const [scope, setScope] = React.useState<"page" | "site">("page");
  const [fixing, setFixing] = React.useState<Issue | null>(null);
  const [failed, setFailed] = React.useState<Issue | null>(null);
  const anyPageBound = issues.some((i) => i.pageId != null);
  const scoped =
    anyPageBound && scope === "page" ? issues.filter((i) => issueAppliesToPage(i, activePageId)) : issues;

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
  const errorCount = scoped.filter((i) => i.type === "error").length;
  const warnCount = scoped.filter((i) => i.type === "warning").length;
  const visible = filter === "all" ? scoped : scoped.filter((i) => i.type === filter);

  /** Selected reads as the primary action, unselected as a quiet one. */
  const segment = (selected: boolean) => ({
    color: selected ? undefined : ("light" as const),
    className: selected ? undefined : GHOST,
  });

  return (
    <div className={BODY}>
      <PanelHeader title="Issues" onClose={onClose} />

      {issues.length === 0 ? (
        <EmptyState
          className="tw:flex-1"
          icon={<CheckCircle2 size={24} aria-hidden="true" />}
          title="No issues"
          body="Your site is clean — nothing to fix."
        />
      ) : (
        <>
          {anyPageBound && (
            <Toolbar role="group" aria-label="Issue scope">
              <Button size="xs" onClick={() => setScope("page")} {...segment(scope === "page")}>
                This page
              </Button>
              <Button size="xs" onClick={() => setScope("site")} {...segment(scope === "site")}>
                All pages
              </Button>
            </Toolbar>
          )}
          <Toolbar>
            {FILTERS.map((f) => (
              <Button key={f.key} size="xs" onClick={() => setFilter(f.key)} {...segment(filter === f.key)}>
                {f.label}
              </Button>
            ))}
          </Toolbar>
          <div className={SUMMARY}>
            {errorCount} error{errorCount === 1 ? "" : "s"} · {warnCount} warning{warnCount === 1 ? "" : "s"}
          </div>

          {fixing && (
            <div className={`${BAND} tw:bg-[var(--bk-accent-tint)]`} role="status" aria-live="polite">
              <div className="tw:text-xs tw:text-[var(--bk-accent-text)]">
                Fixing {fixing.message.toLowerCase()}…
              </div>
              {/* The engine reports no percentage, so this bar has always been a
                  fixed activity indicator rather than real progress. It is
                  flowbite's Progress now instead of a hand-built track+fill. */}
              <div className="tw:my-2">
                <Progress progress={60} size="sm" aria-label="Applying the fix" />
              </div>
              <div className="tw:text-[11px] tw:font-medium tw:text-gray-500">
                Auto-fix lands as ONE undo step.
              </div>
            </div>
          )}

          {failed && (
            <div className={`${BAND} tw:bg-[var(--bk-warning-tint)]`} role="alert">
              <div className="tw:text-xs tw:text-[var(--bk-error-text)]">Couldn&apos;t fix this automatically.</div>
              <div className="tw:text-[11px] tw:font-medium tw:text-gray-500 tw:leading-[1.45] tw:mt-1.5">
                {failed.location ?? "This value"} comes from your brand tokens, so changing it here
                would change every site using them.
              </div>
              <div className="tw:flex tw:gap-2 tw:mt-2">
                <Button color="light" size="xs" className={GHOST} onClick={() => { setFailed(null); onOpenBrand?.(); }}>
                  Open Brand
                </Button>
                <Button
                  color="light"
                  size="xs"
                  className={GHOST}
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
          <div className={SCROLL}>
            {visible.length === 0 ? (
              <EmptyState
                className="tw:flex-1"
                icon={<CheckCircle2 size={24} aria-hidden="true" />}
                title={`No ${filter === "error" ? "errors" : "warnings"}`}
              />
            ) : (
              visible.map((i) => (
                // Fix sits BESIDE the navigate target, never inside it — a
                // button nested in a role="button" is invalid, and it also
                // swallows the outer element's accessible name.
                <div key={i.id} className="tw:flex tw:items-start tw:gap-1.5 tw:mb-1.5">
                  <Row
                    size="comment"
                    interactive
                    className="tw:flex-1 tw:min-w-0"
                    onClick={() => onSelectElement?.(i.id)}
                  >
                    <span className={`tw:flex-none tw:mt-px ${TONE[i.type].className}`}>{TONE[i.type].icon}</span>
                    <span className="tw:flex tw:flex-col tw:flex-1 tw:min-w-0">
                      <span>{i.message}</span>
                      {i.location && (
                        <span className="tw:text-[11px] tw:font-medium tw:text-gray-500 tw:mt-0.5">{i.location}</span>
                      )}
                    </span>
                  </Row>
                  {isFixable(i) && onFix && (
                    <Button
                      color="light"
                      size="xs"
                      className={GHOST}
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
