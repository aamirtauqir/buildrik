/**
 * ApprovedCompareView (review contract §3) — what changed since the client
 * approved. Left = the page frozen at approval (`ReviewRequest.snapshotPages`,
 * renders instantly). Right = the site as it is now (live export, may still be
 * rendering — the per-side loading asymmetry §3 calls for).
 *
 * Both sides render in a fully-sandboxed iframe (`sandbox=""`, no scripts, no
 * same-origin): the snapshot is arbitrary site HTML and must never execute in
 * the editor's origin — the same XSS discipline as the M2 review page.
 *
 * The change list uses `compareApprovedToCurrent`. Every kind carries an icon
 * AND a text label AND a plain-text detail — color is never the sole encoding
 * (design codex #6). A round with no stored snapshot shows an explicit state,
 * not an error.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  CheckCircle2,
  File,
  GripVertical,
  History,
  Minus,
  Palette,
  Plus,
  RefreshCw,
  X,
  type LucideIcon,
} from "lucide-react";
import { Slider, Button, EmptyState, Select, Toolbar, ToolbarSpacer } from "@/editor/chrome-ui";
import {
  compareApprovedToCurrent,
  type ComparePage,
  type CompareChange,
  type CompareChangeKind,
} from "@/shared/utils/html";

type Mode = "split" | "overlay" | "list";

export interface ApprovedCompareViewProps {
  /** Pages frozen at approval. `null` = this round has no stored snapshot. */
  approvedPages: ComparePage[] | null;
  /** Live-exported pages. `null` = still rendering (per-side loading asymmetry). */
  currentPages: ComparePage[] | null;
  onRefreshCurrent?: () => void;
  /** Leaves Compare. Boards 168:2/168:26/168:48 put the way back at the LEFT
   *  END OF THE COMPARE BAR (`hotspot/back · Review panel · open`), which is
   *  why the host no longer draws a strip of its own above this one — two
   *  stacked bars where every board draws one. */
  onBack?: () => void;
  /**
   * Optional CONTROLLED mode, so the host can decide where to render.
   *
   * Boards 168:2 / 168:26 / 168:48 draw Compare at 1080. Mounted in the 280
   * drawer each pane was ~140px, so "Side by side" was only ever side-by-side
   * on the board's own surface (BLOCKERS.md B1). The founder call (2026-09-08)
   * is that split and overlay open at 1080 through chrome-ui's `OverlayMount`
   * while LIST stays in the drawer, where a single column is genuinely fine.
   *
   * That decision needs the host to know the mode, so it becomes controllable.
   * Uncontrolled (both omitted) keeps the previous behaviour exactly, which is
   * what every existing test and the History surface rely on.
   */
  mode?: Mode;
  onModeChange?: (mode: Mode) => void;
}

const KIND: Record<CompareChangeKind, { icon: LucideIcon; className: string; label: string }> = {
  content: { icon: File, className: "tw:text-[var(--bk-accent-text)]", label: "Content" },
  style: { icon: Palette, className: "tw:text-[var(--bk-warning-text)]", label: "Style" },
  added: { icon: Plus, className: "tw:text-[var(--bk-success)]", label: "Added" },
  removed: { icon: Minus, className: "tw:text-[var(--bk-error)]", label: "Removed" },
  moved: { icon: GripVertical, className: "tw:text-[var(--bk-ink-muted)]", label: "Moved" },
};

const KIND_ORDER: CompareChangeKind[] = ["added", "removed", "moved", "content", "style"];

const BODY = "tw:flex tw:flex-col tw:h-full tw:min-h-0";
/* 16 inset and a 16 gutter, which is what boards 168:2 / 168:26 / 168:48 mean
   by a 516 pane: 1080 − 2×16 − 16 = 1032, halved. It shipped 8/8, so at 1080
   each pane came out 528 — the geometry only became measurable when B1 was
   resolved and Compare stopped being mounted in a 280 drawer. */
const STAGE = "tw:flex-1 tw:min-h-0 tw:flex tw:gap-4 tw:p-4 tw:overflow-hidden";
/* The pane ground is the board's `--color/bg-card`, not gray-50. Both panes are
   a white card on the surface's own tint; filling them gray made the FRAME
   inside (which is white) read as a second, lighter card floating on a first. */
const PANE =
  "tw:flex-1 tw:min-w-0 tw:flex tw:flex-col tw:border tw:border-[var(--bk-gray-200)] tw:rounded-lg " +
  "tw:overflow-hidden tw:bg-[var(--bk-bg-card)]";
/* Boards 168:16/168:17 and 169:42/169:43 draw the pane head the same way and
   they outvote the uppercase 11px caption that shipped: 12/18, Inter Regular,
   sentence case, and the two sides in DIFFERENT colours — the approved side in
   success-text because it is the signed-off state, the current side in ink.
   The board writes "v3 · approved"; `approvedPages` carries pages and no
   version number, so the clause is absent rather than invented. */
const PANE_HEAD =
  "tw:flex tw:flex-wrap tw:items-baseline tw:gap-x-2 tw:px-4 tw:pt-3 tw:pb-2.5 " +
  "tw:border-b tw:border-[var(--bk-gray-200)]";
const PANE_LABEL = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]";
const PANE_LABEL_APPROVED = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-success-text)]";
/* Board 169:28 is the whole point of this pair. Its own note says why: "The
   snapshot side is instant; the live side may spin. Saying which is which
   stops it reading as a hang." The asymmetry was implemented — the right pane
   held a placeholder — but nothing on the LEFT said it was already done, so a
   spinning right half read as a broken view rather than a slower one. The
   hints belong to the loading state and 168:2 draws neither, so they render
   only while the current side is still exporting. */
const PANE_HINT = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/** The sandboxed iframe fills its pane. White, because it is the customer's
 *  page — not a chrome surface that should follow a chrome background. */
const FRAME = "tw:flex-1 tw:min-h-0 tw:border-0 tw:w-full tw:bg-white";
const OVERLAY_FRAME = "tw:absolute tw:inset-0 tw:border-0 tw:w-full tw:h-full tw:bg-white";
const PLACEHOLDER =
  "tw:flex-1 tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:text-[var(--bk-ink-muted)] " +
  "tw:text-[13px] tw:text-center tw:p-6";
const LEGEND =
  "tw:flex tw:gap-3 tw:flex-wrap tw:px-3 tw:py-1.5 tw:border-t tw:border-[var(--bk-gray-200)] tw:text-[11px] tw:text-[var(--bk-ink-muted)]";
const LIST_SCROLL = "tw:flex-1 tw:min-h-0 tw:overflow-y-auto tw:pt-1 tw:px-3 tw:pb-3";
const LIST_ROW = "tw:flex tw:gap-2 tw:px-2.5 tw:py-2 tw:border tw:border-[var(--bk-gray-200)] tw:rounded-lg tw:mb-1.5 tw:items-start";
const LIST_DETAIL = "tw:text-xs tw:text-[var(--bk-ink-muted)]";
const SUMMARY = "tw:text-xs tw:text-[var(--bk-ink-muted)] tw:px-3 tw:py-1.5";
/* Board 168:13 / 168:37 / 168:59 — the count is Geist Mono 11/16 in ink-muted,
   and it already was. A first pass through this file re-typed it as 12/18 ink
   off node 168:12, which is the PAGE dropdown ("Home ▾"), not the count; the
   suite caught it. Node identity is read from the board's own text, never
   inferred from document order. */
const COUNT =
  "tw:font-mono tw:text-[11px] tw:font-medium tw:leading-4 tw:tabular-nums tw:text-[var(--bk-ink-muted)]";
/** Board 168:4 — the bar's own title. */
const BAR_TITLE = "tw:text-[14px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]";
/* Boards 168:5 / 168:29 / 168:51 — the mode picker is a segmented strip on a
   tinted ground, not three loose buttons: the container is the tint and the
   ACTIVE segment is the white card lifted out of it. */
const MODE_STRIP = "tw:flex tw:items-start tw:rounded-[6px] tw:bg-[var(--bk-bg-subtle)]";
const MODE_SEG =
  "tw:h-auto tw:px-[14px] tw:py-[5px] tw:rounded-[6px] tw:border-transparent tw:text-[12px] tw:leading-[18px] tw:font-normal";
/* The hover fills are not decoration. flowbite's `light` colour hovers to
   gray-100, which IS the strip's own fill: hovering the active segment repainted
   it the colour of the trough (measured — the conformance run caught it because
   the click that switches mode leaves the pointer on the button), and hovering
   an inactive one changed nothing at all. */
const MODE_SEG_ON = "tw:bg-[var(--bk-bg-card)] tw:hover:bg-[var(--bk-bg-card)] tw:text-[var(--bk-ink)]";
const MODE_SEG_OFF =
  "tw:bg-transparent tw:hover:bg-[var(--bk-gray-200)] tw:text-[var(--bk-ink-muted)]";
/* Boards 168:14 / 168:38 / 168:60 put the way OUT of Compare at the far right
   of the bar, 13/20 in ink-muted. It was a `‹ Back` chevron at the left — and
   in a second toolbar above this one. */
const CLOSE_BTN =
  "tw:border-transparent tw:bg-transparent tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
/** The quiet button look, previously copy-pasted onto four separate Buttons. */
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";
function findPage(pages: ComparePage[] | null, path: string): ComparePage | undefined {
  return pages?.find((p) => p.path === path);
}

function Frame({ page, className }: { page: ComparePage | undefined; className: string }) {
  if (!page) {
    return <div className={PLACEHOLDER}>Not present on this side</div>;
  }
  return <iframe title="compare" sandbox="" srcDoc={page.html} className={className} />;
}

export const ApprovedCompareView: React.FC<ApprovedCompareViewProps> = ({
  approvedPages,
  currentPages,
  onRefreshCurrent,
  onBack,
  mode: controlledMode,
  onModeChange,
}) => {
  /* Controlled when the host passes both; otherwise self-managed, unchanged. */
  const [uncontrolledMode, setUncontrolledMode] = React.useState<Mode>("split");
  const mode = controlledMode ?? uncontrolledMode;
  const setMode = React.useCallback(
    (m: Mode) => { onModeChange ? onModeChange(m) : setUncontrolledMode(m); },
    [onModeChange],
  );
  const [overlayOpacity, setOverlayOpacity] = React.useState(0.5);

  const paths = React.useMemo(() => {
    const set = new Set<string>();
    (approvedPages ?? []).forEach((p) => set.add(p.path));
    (currentPages ?? []).forEach((p) => set.add(p.path));
    return [...set];
  }, [approvedPages, currentPages]);

  const [activePath, setActivePath] = React.useState<string>("");
  const path = activePath && paths.includes(activePath) ? activePath : paths[0] ?? "";

  const result = React.useMemo(
    () => compareApprovedToCurrent(approvedPages, currentPages ?? []),
    [approvedPages, currentPages],
  );

  // No stored snapshot — an explicit state, not an error (§3).
  if (approvedPages == null) {
    return (
      <div className={BODY}>
        <EmptyState
          className="tw:flex-1"
          icon={<History size={24} aria-hidden="true" />}
          title="No approved snapshot for this round"
          body="This review was sent before snapshots were captured, so there's nothing to compare against. The next round you send will support Compare."
        />
      </div>
    );
  }

  const currentReady = currentPages != null;
  const approvedPage = findPage(approvedPages, path);
  const currentPage = findPage(currentPages, path);

  /* Board 168:82 — zero changes replaces the whole body, in every mode, and
     the board says why: an empty diff view reads as broken. Read only once
     the current side has arrived; before that, zero changes means nothing has
     been compared yet, not that nothing changed. */
  const nothingChanged = currentReady && result.changes.length === 0;

  const changesForPage = result.changes
    .filter((c) => c.page === path)
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));

  return (
    <div className={BODY}>
      {/* min-h, not h: the boards draw this bar 48 tall on a 1080 surface, and
          at the 280 the review drawer actually gives it, the strip wraps to
          three rows. Clamping it to 48 made those rows overlap the diff
          underneath — the same 1080-vs-280 placement question BLOCKERS B1 holds
          for the founder, showing up as a layout bug. */}
      <Toolbar className="tw:min-h-12 tw:bg-[var(--bk-bg-card)] tw:border-[var(--bk-gray-100)] tw:px-4" data-testid="compare-bar">
        <span className={BAR_TITLE} data-testid="compare-title">Compare</span>
        <div className={MODE_STRIP} role="group" aria-label="Compare mode" data-testid="compare-mode-strip">
          {(["split", "overlay", "list"] as Mode[]).map((m) => (
            <Button
              key={m}
              color="light"
              size="xs"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              data-testid={`compare-mode-${m}`}
              className={`${MODE_SEG} ${mode === m ? MODE_SEG_ON : MODE_SEG_OFF}`}
            >
              {m === "split" ? "Side by side" : m === "overlay" ? "Overlay" : "List"}
            </Button>
          ))}
        </div>
        {/* Board order: title · mode strip · page · count · … · close. The
            count is in the header in EVERY mode — the change total and how many
            of them are on the page you are looking at. Live printed it only in
            List, so Side-by-side and Overlay left you comparing without knowing
            how much there was to find. */}
        {paths.length > 1 && (
          <Select
            value={path}
            onChange={(e) => setActivePath(e.target.value)}
            aria-label="Page to compare"
          >
            {paths.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        )}
        <span className={COUNT} data-compare-count data-testid="compare-count">
          {result.changes.length} change{result.changes.length === 1 ? "" : "s"}
          {result.changes.length > 0 ? ` · ${changesForPage.length} of ${result.changes.length}` : ""}
        </span>
        <ToolbarSpacer />
        {onRefreshCurrent && (
          <Button color="light" size="xs" onClick={onRefreshCurrent} title="Re-render the current site" aria-label="Re-render the current site" className={GHOST}>
            <RefreshCw size={14} aria-hidden="true" />
          </Button>
        )}
        {onBack && (
          <Button
            color="light"
            size="xs"
            onClick={onBack}
            className={CLOSE_BTN}
            data-testid="compare-close"
            title="Close compare"
            aria-label="Close compare"
          >
            <X size={14} aria-hidden="true" />
          </Button>
        )}
      </Toolbar>

      {nothingChanged ? (
        <EmptyState
          className="tw:flex-1"
          data-testid="compare-no-changes"
          icon={<CheckCircle2 size={24} aria-hidden="true" />}
          title="Nothing changed since the approved version."
          body="Every page matches what the client approved."
        />
      ) : mode === "list" ? (
        <>
          {/* Zero total changes never reaches List now — 168:82 takes the
              whole body — so the summary only ever has counts to print. */}
          <div className={SUMMARY}>
            {KIND_ORDER.filter((k) => result.counts[k] > 0)
              .map((k) => `${result.counts[k]} ${KIND[k].label.toLowerCase()}`)
              .join(" · ")}
          </div>
          <div className={LIST_SCROLL} data-testid="compare-list">
            {changesForPage.length === 0 ? (
              <EmptyState
                className="tw:flex-1"
                icon={<CheckCircle2 size={24} aria-hidden="true" />}
                title="This page matches the approved version"
              />
            ) : (
              changesForPage.map((c: CompareChange, i) => {
                const KindIcon = KIND[c.kind].icon;
                return (
                <div key={`${c.key}-${c.kind}-${i}`} className={LIST_ROW}>
                  <span className={`tw:text-[11px] tw:font-semibold tw:flex-none tw:flex tw:items-center tw:gap-1 ${KIND[c.kind].className}`}>
                    <KindIcon size={14} aria-hidden="true" />
                    {KIND[c.kind].label}
                  </span>
                  <div className="tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
                    <span className="tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)]">{c.label}</span>
                    <span className={LIST_DETAIL}>{c.detail}</span>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </>
      ) : mode === "overlay" ? (
        <>
          <div className={STAGE}>
            <div className="tw:flex-1 tw:relative tw:min-h-0" data-testid="compare-overlay-pane">
              <Frame page={approvedPage} className={OVERLAY_FRAME} />
              {currentReady ? (
                /* opacity is the slider's live value — a genuinely computed
                   style, which is what an inline style is still for. */
                <div className={OVERLAY_FRAME} style={{ opacity: overlayOpacity }}>
                  <Frame page={currentPage} className={OVERLAY_FRAME} />
                </div>
              ) : (
                <div className={`${PLACEHOLDER} tw:absolute tw:inset-0`}>Rendering current…</div>
              )}
            </div>
          </div>
          <Toolbar edge="top">
            <span className={LIST_DETAIL}>Approved</span>
            <div className="tw:flex-1">
              <Slider
                value={Math.round(overlayOpacity * 100)}
                onChange={(v) => setOverlayOpacity(v / 100)}
                min={0}
                max={100}
                step={2}
                label="Overlay opacity"
                withField={false}
              />
            </div>
            <span className={LIST_DETAIL}>Current</span>
          </Toolbar>
        </>
      ) : (
        <div className={STAGE}>
          <div className={PANE} data-testid="compare-pane-approved">
            <div className={PANE_HEAD}>
              <span className={PANE_LABEL_APPROVED} data-testid="compare-pane-approved-label">Approved</span>
              {!currentReady && (
                <span className={PANE_HINT} data-testid="compare-pane-approved-hint">
                  instant — stored snapshot
                </span>
              )}
            </div>
            <Frame page={approvedPage} className={FRAME} />
          </div>
          <div className={PANE} data-testid="compare-pane-current">
            <div className={PANE_HEAD}>
              <span className={PANE_LABEL} data-testid="compare-pane-current-label">Current</span>
              {!currentReady && (
                <span className={PANE_HINT} data-testid="compare-pane-current-hint">
                  rendering…
                </span>
              )}
            </div>
            {currentReady ? (
              <Frame page={currentPage} className={FRAME} />
            ) : (
              <div className={PLACEHOLDER}>Rendering current…</div>
            )}
          </div>
        </div>
      )}

      {/* The legend decodes change kinds. With nothing to decode 168:82 draws
          none, and a key to five kinds none of which occurred is noise. */}
      {nothingChanged ? null : (
        <div className={LEGEND}>
          {KIND_ORDER.map((k) => {
            const KindIcon = KIND[k].icon;
            return (
              <span key={k} className="tw:flex tw:items-center tw:gap-1">
                <span className={`tw:inline-flex ${KIND[k].className}`}>
                  <KindIcon size={14} aria-hidden="true" />
                </span>
                {KIND[k].label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApprovedCompareView;
