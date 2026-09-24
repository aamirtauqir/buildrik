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
import { CheckCircle2 } from "lucide-react";
import { PanelHeader, Button, EmptyState, Progress, Row } from "@/editor/chrome-ui";
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
  /** Jump to what the issue points at — the element it names, or the first
   *  element using its token (SH-63, board 4418:147641's row → element). */
  onSelectElement?: (issue: Issue) => void;
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

/* Board 4418:147641: an 8px dot per row, and a severity pill under Fix ›. */
const DOT: Record<Issue["type"], string> = {
  error: "tw:bg-[var(--bk-error)]",
  warning: "tw:bg-[var(--bk-yellow-400)]",
  info: "tw:bg-[var(--bk-gray-400)]",
};
const SEVERITY: Record<Issue["type"], { label: string; className: string } | null> = {
  error: { label: "Error", className: "tw:bg-[rgba(155,28,28,0.12)] tw:text-[var(--bk-red-800)]" },
  warning: { label: "Warning · should fix", className: "tw:bg-[rgba(114,59,19,0.12)] tw:text-[var(--bk-yellow-800)]" },
  info: null,
};
const PILL = "tw:inline-flex tw:h-[22px] tw:items-center tw:rounded-full tw:px-2 tw:text-[11px] tw:leading-4 tw:font-medium tw:whitespace-nowrap";
/* The scope segmented control: 24 high, 2px inset, selected on bg-subtle. */
const SEG_WRAP = "tw:flex tw:h-6 tw:items-center tw:gap-0.5 tw:rounded-md tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:p-0.5";
const segClass = (on: boolean) =>
  "tw:h-5 tw:min-h-0 tw:rounded tw:border-0 tw:px-2 tw:py-0 tw:text-[11px] tw:leading-4 tw:font-medium tw:focus:ring-0 " +
  (on ? "tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink)]" : "tw:bg-transparent tw:text-[var(--bk-ink-muted)] tw:hover:bg-[var(--bk-bg-subtle)]");

const BODY = "tw:flex tw:flex-col tw:h-full tw:min-h-0";
/* ONE line, and one colour. Boards 164:2 / 164:22 head the list with a single
   string — "All · 3", "Errors only · 1" — 12/18 accent, inset 16, in a 36-tall
   row. `tw:flex` is load-bearing: the label is a flowbite Button (block-level)
   and the count a sibling span, so without it they stacked — measured live,
   "All" at y50 and "· 2" at y82, the count orphaned where it reads as stray
   punctuation. The rest is 164:22's own row: it shipped 12px on the font's
   own line box, in a shorter row, with the count in ink-muted. */
const SUMMARY =
  "tw:flex tw:h-8 tw:items-center tw:px-4 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink)]";
/* flowbite's Button is 40 tall and pads itself; only same-property utilities
   beat that through twMerge (CLAUDE.md §Chrome), and left alone it pushed the
   36 row to 40. */
const FILTER_BTN =
  "tw:h-4 tw:min-h-0 tw:p-0 tw:text-[11px] tw:leading-4 tw:font-normal " +
  "tw:text-[var(--bk-accent-text)] tw:no-underline";
/* Board 164:32 draws Fix as accent text on the row, not a bordered control. */
const FIX_BTN =
  "tw:h-[18px] tw:min-h-0 tw:border-transparent tw:bg-transparent tw:p-0 " +
  "tw:text-[12px] tw:leading-[18px] tw:font-medium tw:text-[var(--bk-accent-text)]";
/* Board 164:33/164:34 — the filter's own consequence, a 36-tall 11/16 line. */
const FILTER_NOTE =
  "tw:m-0 tw:flex tw:h-9 tw:flex-none tw:items-center tw:px-4 tw:text-[11px] tw:leading-4 " +
  "tw:text-[var(--bk-ink-muted)]";
const SCROLL = "tw:flex-1 tw:min-h-0 tw:overflow-y-auto";
/** The fixing / fix-failed bands differ only by tint. */
const BAND = "tw:px-3 tw:py-2.5 tw:border-b tw:border-[var(--bk-gray-200)]";
/** The quiet button look, previously copy-pasted onto six separate Buttons. */
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";

/* Board 164:2 / 164:22 head the list with ONE line — "All · 3", "Errors only
   · 1" — where the label names what you are looking at and the number counts
   it. The three-button segmented row this replaces spent a whole row saying
   what the one line says, and still needed a second line under it to repeat
   the counts. Clicking cycles; the title says where it goes next. */
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "error", label: "Errors only" },
  { key: "warning", label: "Warnings only" },
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
  const scoped = scope === "page" ? issues.filter((i) => issueAppliesToPage(i, activePageId)) : issues;

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
  const visible = filter === "all" ? scoped : scoped.filter((i) => i.type === filter);
  const filterIndex = FILTERS.findIndex((f) => f.key === filter);
  const currentFilter = FILTERS[filterIndex];
  const nextFilter = FILTERS[(filterIndex + 1) % FILTERS.length];

  return (
    <div className={BODY}>
      <PanelHeader title="Issues" onClose={onClose} size="panel" />

      {issues.length === 0 ? (
        /* Board 164:35: two lines under the header — the verdict in green, and
           what it means for publishing under it. No icon, and not floating in
           the middle of an 844px panel, where the panel read as empty rather
           than as clean. The board puts the first line 40 pixels below the 48-pixel
           header and insets both to the panel's 24px gutter; the pair sat one
           spacing step high and one step narrow until 2026-09-01. */
        <div className="tw:px-6 tw:pt-10 tw:text-center" role="status">
          <p className="tw:m-0 tw:text-[13px] tw:text-[var(--bk-success-text)]">No issues.</p>
          <p className="tw:m-0 tw:mt-1 tw:text-xs tw:text-[var(--bk-ink-muted)]">
            This page is ready to publish.
          </p>
        </div>
      ) : (
        <>
          {/* Board 4418:147641: This page / Whole site, always drawn. Site-wide
              issues pass the page scope too, so both can list the same rows. */}
          <div className="tw:flex tw:px-4 tw:py-2">
            <div className={SEG_WRAP} role="group" aria-label="Issue scope">
              <Button color="alternative" aria-pressed={scope === "page"} className={segClass(scope === "page")} onClick={() => setScope("page")}>
                This page
              </Button>
              <Button color="alternative" aria-pressed={scope === "site"} className={segClass(scope === "site")} onClick={() => setScope("site")}>
                Whole site
              </Button>
            </div>
          </div>
          <div className={SUMMARY} data-testid="issues-filter-row">
            <span className="tw:flex-1">Open issues: {visible.length}</span>
            {/* The severity filter — no board draws it; kept as a quiet
                trailing control (designer-notes.md). Clicking cycles. */}
            <Button
              color="light"
              size="xs"
              variant="link"
              className={FILTER_BTN}
              data-testid="issues-filter"
              title={`Showing ${currentFilter.label.toLowerCase()} — click for ${nextFilter.label.toLowerCase()}`}
              onClick={() => setFilter(nextFilter.key)}
            >
              {currentFilter.label}
            </Button>
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
                {/* flowbite fills Progress with `bg-primary-600` = `var(--bk-blue-600)` (blue-600), one
                step off the single accent `var(--bk-blue-700)`. DESIGN.md allows ONE blue, so
                this override is a project rule rather than a board reading — no
                board is being conformed to here. `theme.color` and not
                `theme.bar`, because the colour class is twMerged AFTER bar and
                would win. A themed wrapper would be the SSOT fix, but the closed
                wrapper set is [TextInput, Select] and `gate:chrome-ui-surface`
                requires every flowbite export in the barrel to stay a pure
                re-export — so the override belongs at the call site. */}
                <Progress progress={60} size="sm" aria-label="Applying the fix" theme={{ color: { default: "tw:bg-[var(--bk-accent)]" } }} />
              </div>
              <div className="tw:text-[11px] tw:font-medium tw:text-[var(--bk-ink-muted)]">
                Auto-fix lands as ONE undo step.
              </div>
            </div>
          )}

          {failed && (
            <div className={`${BAND} tw:bg-[var(--bk-warning-tint)]`} role="alert">
              <div className="tw:text-xs tw:text-[var(--bk-error-text)]">Couldn&apos;t fix this automatically.</div>
              <div className="tw:text-[11px] tw:font-medium tw:text-[var(--bk-ink-muted)] tw:leading-[1.45] tw:mt-1.5">
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
              visible.map((i, idx) => (
                // Fix sits BESIDE the navigate target, never inside it — a
                // button nested in a role="button" is invalid.
                <div key={i.id} className="tw:relative tw:h-14" data-testid={`issue-row-${idx}`}>
                  <Row
                    size="tall"
                    interactive
                    className="tw:h-14 tw:w-full tw:items-start tw:pl-4 tw:pr-4 tw:pt-2"
                    onClick={() => onSelectElement?.(i)}
                  >
                    <span aria-hidden="true" data-testid={`issue-dot-${idx}`} className={`tw:mt-1.5 tw:size-2 tw:flex-none tw:rounded-full ${DOT[i.type]}`} />
                    <span className="tw:flex tw:flex-col tw:flex-1 tw:min-w-0">
                      {/* One line each: the row is a fixed 56. Full text: title + DOM.
                          The first line leaves room for Fix ›, the second for the pill. */}
                      <span
                        className={`tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)] tw:truncate ${isFixable(i) && onFix ? "tw:pr-10" : ""}`}
                        title={i.message}
                        data-testid={`issue-message-${idx}`}
                      >
                        {i.message}
                      </span>
                      <span className="tw:mt-0.5 tw:flex tw:items-center tw:gap-2 tw:min-w-0">
                        <span
                          className="tw:flex-1 tw:min-w-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)] tw:truncate"
                          data-testid={`issue-location-${idx}`}
                        >
                          {i.location}
                        </span>
                        {SEVERITY[i.type] && (
                          <span className={`${PILL} tw:flex-none ${SEVERITY[i.type]!.className}`} data-testid={`issue-severity-${idx}`}>
                            {SEVERITY[i.type]!.label}
                          </span>
                        )}
                      </span>
                    </span>
                  </Row>
                  {isFixable(i) && onFix && (
                    <Button
                      color="light"
                      size="xs"
                      className={`tw:absolute tw:right-4 tw:top-2 ${FIX_BTN}`}
                      data-testid={`issue-fix-${idx}`}
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
          {/* Board 164:22 orders this LAST — under the rows, not over them. It
              shipped above the first issue, which is where the board's own
              annotation put it in words but not in layout; the frame draws
              Header · Filter row · Issue · note. Outside the scroller rather
              than inside it, the same call SavesChrome made for the retention
              rule: a sentence explaining why the list is short is useless at
              the far end of a scroll. */}
          {filter !== "all" && scoped.length > visible.length && (
            <p className={FILTER_NOTE} data-testid="issues-filter-note">
              Filtered to one severity. {scoped.length - visible.length}{" "}
              {scoped.length - visible.length === 1 ? "issue is" : "issues are"} hidden.
            </p>
          )}
          <p className="tw:m-0 tw:flex-none tw:px-4 tw:py-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-gray-500)]">
            ● red = error · ● amber = warning
          </p>
        </>
      )}
    </div>
  );
};

export default IssuesPanel;
