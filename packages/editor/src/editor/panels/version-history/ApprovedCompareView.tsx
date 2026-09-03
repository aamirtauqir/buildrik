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
  type LucideIcon,
} from "lucide-react";
import { Slider, Button, EmptyState, Select, Toolbar, ToolbarSpacer } from "@/editor/chrome-ui";
import {
  compareApprovedToCurrent,
  type ComparePage,
  type CompareChange,
  type CompareChangeKind,
} from "@/shared/utils/html";

export interface ApprovedCompareViewProps {
  /** Pages frozen at approval. `null` = this round has no stored snapshot. */
  approvedPages: ComparePage[] | null;
  /** Live-exported pages. `null` = still rendering (per-side loading asymmetry). */
  currentPages: ComparePage[] | null;
  onRefreshCurrent?: () => void;
}

type Mode = "split" | "overlay" | "list";

const KIND: Record<CompareChangeKind, { icon: LucideIcon; className: string; label: string }> = {
  content: { icon: File, className: "tw:text-[var(--bk-accent-text)]", label: "Content" },
  style: { icon: Palette, className: "tw:text-[var(--bk-warning-text)]", label: "Style" },
  added: { icon: Plus, className: "tw:text-[var(--bk-success)]", label: "Added" },
  removed: { icon: Minus, className: "tw:text-[var(--bk-error)]", label: "Removed" },
  moved: { icon: GripVertical, className: "tw:text-[var(--bk-ink-muted)]", label: "Moved" },
};

const KIND_ORDER: CompareChangeKind[] = ["added", "removed", "moved", "content", "style"];

const BODY = "tw:flex tw:flex-col tw:h-full tw:min-h-0";
const STAGE = "tw:flex-1 tw:min-h-0 tw:flex tw:gap-2 tw:p-2 tw:overflow-hidden";
const PANE =
  "tw:flex-1 tw:min-w-0 tw:flex tw:flex-col tw:border tw:border-[var(--bk-gray-200)] tw:rounded-lg " +
  "tw:overflow-hidden tw:bg-[var(--bk-gray-50)]";
const PANE_LABEL =
  "tw:text-[11px] tw:font-semibold tw:text-[var(--bk-ink-muted)] tw:px-2.5 tw:py-1.5 tw:border-b tw:border-[var(--bk-gray-200)] " +
  "tw:uppercase tw:tracking-[0.04em]";
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
const COUNT =
  "tw:font-mono tw:text-[11px] tw:font-medium tw:leading-4 tw:tabular-nums tw:text-[var(--bk-ink-muted)]";
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
}) => {
  const [mode, setMode] = React.useState<Mode>("split");
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
      <Toolbar>
        {(["split", "overlay", "list"] as Mode[]).map((m) => (
          <Button
            key={m}
            color={mode === m ? undefined : "light"}
            size="xs"
            onClick={() => setMode(m)}
            className={mode === m ? undefined : GHOST}
          >
            {m === "split" ? "Side by side" : m === "overlay" ? "Overlay" : "List"}
          </Button>
        ))}
        <ToolbarSpacer />
        {/* Board 168:2 keeps the count in the header, in every mode — the
            change total and how many of them are on the page you are looking
            at. Live printed it only in List, so Side-by-side and Overlay left
            you comparing without knowing how much there was to find. */}
        <span className={COUNT} data-compare-count>
          {result.changes.length} change{result.changes.length === 1 ? "" : "s"}
          {result.changes.length > 0 ? ` · ${changesForPage.length} of ${result.changes.length}` : ""}
        </span>
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
        {onRefreshCurrent && (
          <Button color="light" size="xs" onClick={onRefreshCurrent} title="Re-render the current site" aria-label="Re-render the current site" className={GHOST}>
            <RefreshCw size={14} aria-hidden="true" />
          </Button>
        )}
      </Toolbar>

      {nothingChanged ? (
        <EmptyState
          className="tw:flex-1"
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
          <div className={LIST_SCROLL}>
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
            <div className="tw:flex-1 tw:relative tw:min-h-0">
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
          <div className={PANE}>
            <div className={PANE_LABEL}>Approved</div>
            <Frame page={approvedPage} className={FRAME} />
          </div>
          <div className={PANE}>
            <div className={PANE_LABEL}>Current</div>
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
