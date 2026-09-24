/**
 * AssetDetailOverlay — the asset drill-in HUB, board 146:2, with its two
 * sub-screens: Versions (146:32) and Used-in (146:68).
 *
 * The board's IA is list rows, not tabs: preview + dimensions, alt text with
 * ✨ Generate ABOVE the fold ("the one field with a legal consequence"), then
 * five 32h rows — Used in N places · Versions · Edit image · Optimise ·
 * Replace across site. Edit image opens the image-editor MODAL (cargo-sheets
 * §4: "Modals, not drill-in"); Optimise keeps the OptimizationPanel view until
 * its S3.6 board pass.
 *
 * Versions view (146:32): 44h chips — dot · relative time · size delta,
 * current pinned with a 3px accent bar (boards 75:65 / 75:71 beat 241:1436's
 * 56h full-bleed row) — and restore confirms INLINE in the 84h band 146:64
 * draws ("a drill-in that spawns a modal has lost the plot"). The data is
 * the server restore points; the old sibling-filename heuristic list is gone
 * (those are separate library items the grid already shows). No author line —
 * AssetVersion carries none; the board's "Ali/Sara" is sample shape.
 *
 * Used-in view: one 44h chip PER HIT — page name over the element's own name
 * with a "Go ›" link — and no page-group header, per board 75:90, which beat
 * 146:68's grouped list (that drew the page name twice and left the row with
 * no shape). Go switches the active page and selects the element. Both ends
 * of the state are load-bearing: "Not used on any page" is what makes
 * deleting safe, and 75:111's warning band is what says when it is not.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OptimizationPanel } from "@/editor/media/OptimizationPanel";
import { formatRelativeTime } from "@/shared/utils/relativeTime";
import type { LibraryItem } from "../data/mediaTypes";
import { collectUsageByPage, fmtSize } from "../data/mediaUtils";
import type { Composer } from "../../../../../engine/Composer";
import {
  listAssetVersions,
  restoreAssetVersion,
  type AssetVersion,
} from "../../../../../services/MediaVersionService";
import { Button, PanelFrame, Textarea } from "@/editor/chrome-ui";
import { Download, Link2, Pencil, SquarePlus, Trash2 } from "lucide-react";

type View = "hub" | "used" | "versions" | "optimize";

interface AssetDetailOverlayProps {
  item: LibraryItem;
  /** Back to the grid (the ‹ row). ESC does the same, one level at a time. */
  onClose(): void;
  onUpdate?(key: string, updates: Partial<LibraryItem>): Promise<void>;
  onEditImage?(item: LibraryItem): void | Promise<void>;
  composer?: Composer;
  onOptimized?: (optimizedSrc: string) => void | Promise<void>;
  onReplaceAcross?(item: LibraryItem): void;
  /** G3-022 — the server's alt-text model (AltTextService). `null` = it
   *  could not run; `skipped` = the server kept text the user wrote. */
  onGenerateAltText?(item: LibraryItem): Promise<{ altText: string; skipped: boolean } | null>;
  /* Board 4418:61698 — the library's own actions, under the destination rows
     (G3-021). Each row renders only when its handler is supplied. */
  onInsert?(item: LibraryItem): void;
  onRename?(item: LibraryItem): void;
  onCopyUrl?(item: LibraryItem): void;
  onDownload?(item: LibraryItem): void;
  onDelete?(item: LibraryItem): void;
  /** A viewer's reasons — Rename / Delete stay visible, disabled, titled. */
  viewOnly?: { rename?: string; delete?: string };
}

const ROW =
  "tw:flex tw:h-8 tw:w-full tw:items-center tw:justify-start tw:gap-2 tw:rounded tw:border-0 tw:bg-transparent tw:px-4 tw:font-normal " +
  "tw:text-left tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]";
const ROW_CHEVRON = "tw:text-[13px] tw:text-[var(--bk-ink-muted)]";
const ROW_COUNT =
  "tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:font-medium tw:tabular-nums tw:text-[var(--bk-ink-muted)]";
/**
 * True when another modal dialog is VISIBLE above `el` — i.e. one this surface
 * opened. Escape belongs to the topmost layer, not to us.
 *
 * The visibility test is the whole trick: several dialogs stay mounted while
 * closed (the stock modal, the delete confirm), so a presence-only check
 * reported "covered" permanently and swallowed every Escape. A closed dialog
 * has no client rects.
 */
function isCoveredByModal(el: HTMLElement): boolean {
  const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]');
  for (const d of dialogs) {
    if (d === el || d.contains(el) || el.contains(d)) continue;
    if (d.hidden || d.getAttribute("aria-hidden") === "true") continue;
    const cs = getComputedStyle(d);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    return true;
  }
  return false;
}

/* Button's `link` variant supplies the recipe; the row's own geometry
   (full-width 36h nav row) stays here. */
const BACK_ROW =
  "tw:flex tw:h-9 tw:w-full tw:items-center tw:justify-start tw:px-4 tw:text-left";

export function AssetDetailOverlay({
  item,
  onClose,
  onUpdate,
  onEditImage,
  composer,
  onOptimized,
  onReplaceAcross,
  onGenerateAltText,
  onInsert,
  onRename,
  onCopyUrl,
  onDownload,
  onDelete,
  viewOnly,
}: AssetDetailOverlayProps) {
  const [view, setView] = useState<View>("hub");
  // Escape reads the level from a ref: calling onClose() inside a setState
  // updater is a side effect in the render phase, which StrictMode's double
  // invoke discards — the drill-in simply ignored Escape.
  const viewRef = useRef<View>("hub");
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  const [altDraft, setAltDraft] = useState(item.altText ?? "");
  const [altBusy, setAltBusy] = useState(false);
  const [altFailed, setAltFailed] = useState(false);
  const [metaError, setMetaError] = useState(false);
  // Board 146:9 draws "1440×960 · 245 KB" under the preview, and MediaAsset
  // only carries width/height when the upload went through the WebP optimiser
  // (MediaManager.ts:950) — an SVG, a server-loaded row and a stock save all
  // have neither, so the board's first fact shipped blank for most assets.
  // Measured below instead, from the file itself.
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  const display = item.displayName ?? item.name;

  // ── Server restore points — loaded on mount so the hub row carries a count.
  const [dbVersions, setDbVersions] = useState<AssetVersion[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<string | null>(null);

  const reloadDbVersions = useCallback(() => {
    if (!item.assetId) {
      setDbVersions([]);
      return;
    }
    listAssetVersions(item.assetId)
      .then((vs) => {
        if (mountedRef.current) setDbVersions(vs);
      })
      .catch(() => {
        if (mountedRef.current) setDbVersions([]);
      });
  }, [item.assetId]);

  useEffect(() => {
    reloadDbVersions();
  }, [reloadDbVersions]);

  const confirmRestore = useCallback(
    (versionId: string) => {
      setRestoringId(versionId);
      setPendingRestore(null);
      restoreAssetVersion(versionId)
        .then((res) => {
          if (!mountedRef.current) return;
          onUpdate?.(item.key, { src: res.url });
          reloadDbVersions();
        })
        .catch(() => {})
        .finally(() => {
          if (mountedRef.current) setRestoringId(null);
        });
    },
    [onUpdate, item.key, reloadDbVersions],
  );

  // ── Cross-page usage (board 146:68 groups by page).
  const usage = useMemo(() => {
    if (!composer || !item.src) return [];
    try {
      return collectUsageByPage(composer, item.src);
    } catch {
      return [];
    }
  }, [composer, item.src]);
  const usageCount = usage.reduce((n, p) => n + p.hits.length, 0);

  const handleJump = useCallback(
    (pageId: string, elementId: string) => {
      if (!composer) return;
      composer.elements.setActivePage(pageId);
      const el = composer.elements.getElement(elementId);
      if (el) composer.selection.select(el);
    },
    [composer],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ESC pops one level: sub-view → hub, hub → grid. Focus stays trapped.
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const firstFocusable = el.querySelector<HTMLElement>(
      "button, input, [tabindex]:not([tabindex='-1'])",
    );
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // A modal opened FROM this drill-in (the image editor) sits above it
        // and owns the keystroke. Without this guard one Escape closed the
        // modal AND navigated the drawer behind it — found on the live walk.
        if (isCoveredByModal(el)) return;
        e.preventDefault();
        // One level per press — and nobody else's Escape handler (drawer
        // close, canvas deselect) gets to also fire on the same keystroke.
        e.stopPropagation();
        if (viewRef.current === "hub") onClose();
        else setView("hub");
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        el.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // Capture on document, not bubble on window: a drill-in is the topmost
    // layer, and window-bubble is the LAST stop on the event path — the one
    // any of the app's other keydown listeners can preempt. Measured: with
    // the overlay open, Escape reached document but not window, so the
    // overlay ignored it. Capture puts it first instead of last.
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  useEffect(() => {
    setAltDraft(item.altText ?? "");
    setAltFailed(false);
    setView("hub");
    setMetaError(false);
    setPendingRestore(null);
    setNatural(null);
  }, [item.key, item.altText]);

  // Images decode off-screen, from `item.src` and never from `item.thumb`:
  // the thumbnail is a resize of the same picture, so its bitmap would print a
  // confidently wrong number. Videos report theirs from the element itself.
  useEffect(() => {
    if (item.width != null && item.height != null) return;
    if (item.type !== "img" || !item.src) return;
    const probe = new Image();
    probe.onload = () => {
      if (mountedRef.current && probe.naturalWidth && probe.naturalHeight) {
        setNatural({ w: probe.naturalWidth, h: probe.naturalHeight });
      }
    };
    probe.src = item.src;
    return () => {
      probe.onload = null;
    };
  }, [item.type, item.src, item.width, item.height]);

  const commitAltText = useCallback(() => {
    if (!onUpdate) return;
    const next = altDraft.trim();
    if (next === (item.altText ?? "")) return;
    void onUpdate(item.key, { altText: next });
  }, [onUpdate, altDraft, item.altText, item.key]);

  /* ✨ Generate / Regenerate (G3-022) — the server's alt-text model through
     AltTextService, which also writes the result to the asset. Its states are
     the boards': generating (6623:149646), failed + Retry (6623:150370). */
  const generateAlt = useCallback(async () => {
    if (altBusy || !onGenerateAltText) return;
    setAltBusy(true);
    setAltFailed(false);
    try {
      const result = await onGenerateAltText(item);
      if (!mountedRef.current) return;
      if (!result) setAltFailed(true);
      else if (!result.skipped) setAltDraft(result.altText);
    } catch {
      if (mountedRef.current) setAltFailed(true);
    } finally {
      if (mountedRef.current) setAltBusy(false);
    }
  }, [altBusy, item, onGenerateAltText]);

  // The asset's own metadata wins; the measured bitmap is the fallback.
  const dims = item.width != null && item.height != null
    ? { w: item.width, h: item.height }
    : natural;

  const showEdit = item.type === "img" && !!onEditImage;
  const showOptimize = item.type === "img" && !!onOptimized;
  const showReplace = (item.type === "img" || item.type === "vid") && !!onReplaceAcross;
  // Restore points + the live state — the count the hub row shows.
  const versionCount = dbVersions.length > 0 ? dbVersions.length + 1 : 0;

  const backLabel =
    view === "versions"
      ? `${display} · versions`
      : view === "used"
        ? `${display} · used in`
        : view === "optimize"
          ? `${display} · optimise`
          : display;

  return (
    <div
      ref={overlayRef}
      /* Boards 146:2 / 146:32 / 146:68 give the drill-in frame the drawer's own
         --flowbite/gray/100 edge; with no border set at all the computed
         border-color came back #000000, the initial value — the same defect
         SlimLauncher's own board found on 144:2. */
      className="med-detail-overlay tw:absolute tw:inset-0 tw:z-10 tw:flex tw:flex-col tw:items-stretch tw:overflow-y-auto tw:border tw:border-[var(--bk-gray-100)] tw:bg-[var(--bk-bg-panel,white)]"
      data-testid="media-detail-panel"
      role="dialog"
      aria-modal="true"
      aria-label={display}
    >
      {/* The drill-in draws the shared panel header itself — the overlay
          covers the drawer, and the board keeps Media's 44h header on every
          drill-in screen. */}
      <PanelFrame.Header title="Assets" onClose={onClose} />

      {/* Back row — ‹ pops one level, exactly like ESC. */}
      <Button
        variant="link" className={BACK_ROW}
        data-testid="media-detail-back"
        onClick={() => (view === "hub" ? onClose() : setView("hub"))}
        aria-label={view === "hub" ? "Back to media grid" : `Back to ${display}`}
      >
        {"‹"}&nbsp;&nbsp;{backLabel}
      </Button>

      {view === "hub" ? (
        metaError ? (
          <div className="tw:px-4 tw:pt-10 tw:text-center tw:text-[13px] tw:leading-5">
            <p className="tw:text-[var(--bk-ink)]">Preview unavailable</p>
            <p className="tw:mt-1 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
              The file may have been moved or deleted.
            </p>
            <Button
              type="button"
              color="light"
              size="xs"
              variant="link" className="tw:min-h-6 tw:mt-2"
              onClick={() => setMetaError(false)}
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Board 146:9 — 160h preview on bg-subtle, dims in mono at the
                bottom-left of the well. */}
            <div
              className="tw:relative tw:h-40 tw:w-full tw:shrink-0 tw:bg-[var(--bk-bg-subtle)]"
              data-testid="media-detail-preview"
            >
              {item.type === "vid" ? (
                <video
                  src={item.src}
                  className="tw:size-full tw:object-contain"
                  onLoadedMetadata={(e: React.SyntheticEvent<HTMLVideoElement>) => {
                    const v = e.currentTarget;
                    if (v.videoWidth && v.videoHeight) setNatural({ w: v.videoWidth, h: v.videoHeight });
                  }}
                  onError={() => setMetaError(true)}
                />
              ) : (
                <img
                  src={item.thumb ?? item.src}
                  alt={altDraft || display}
                  className="tw:size-full tw:object-contain"
                  onError={() => setMetaError(true)}
                />
              )}
              <span
                className="tw:absolute tw:bottom-2 tw:left-4 tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:leading-4 tw:font-medium tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]"
                data-testid="media-detail-dims"
              >
                {dims ? `${dims.w}\u00d7${dims.h} \u00b7 ` : ""}
                {fmtSize(item.size)}
              </span>
            </div>

            {/* Board 146:11 — alt text above the fold, with ✨ Generate. */}
            <div className="tw:w-full tw:px-4 tw:pt-1.5" data-testid="media-detail-alt">
              <label className="tw:block tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]" htmlFor="med-alt-input" data-testid="media-detail-alt-label">
                Alt text
              </label>
              {/* Board 4418:61698 — one bordered box: the text, then the
                  Generate link inside it. */}
              <div className="tw:mt-1 tw:flex tw:flex-col tw:rounded-md tw:border tw:border-[var(--bk-gray-400)] tw:bg-white tw:px-2 tw:py-1.5" data-testid="media-alt-box">
                <Textarea
                  id="med-alt-input"
                  rows={2}
                  className="tw:resize-none tw:border-0 tw:bg-transparent tw:p-0 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink)] tw:shadow-none tw:focus:ring-0"
                  value={altDraft}
                  disabled={altBusy}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setAltDraft(e.target.value);
                    setAltFailed(false);
                  }}
                  onBlur={commitAltText}
                  onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      commitAltText();
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder={
                    altBusy
                      ? "Generating alt text…"
                      : altFailed
                        ? "Couldn't generate alt text — write it or retry"
                        : "Describe this image for screen readers"
                  }
                  aria-label="Alt text"
                  aria-invalid={altFailed || undefined}
                />
                {onGenerateAltText && item.type === "img" ? (
                  <Button
                    type="button"
                    color="light"
                    size="xs"
                    variant="link"
                    className="tw:min-h-5 tw:self-start tw:text-[length:var(--bk-text-12)]"
                    data-testid="media-alt-generate"
                    disabled={altBusy}
                    aria-busy={altBusy || undefined}
                    onClick={generateAlt}
                  >
                    {"✨"}&nbsp;&nbsp;
                    {altBusy ? "Generating…" : altFailed ? "Retry" : altDraft.trim() ? "Regenerate" : "Generate"}
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Board 233:1254-1274 — the five 32h destination rows. */}
            <Button className={ROW} data-testid="media-detail-used" onClick={() => setView("used")}>
              <span className="tw:min-w-0 tw:flex-1 tw:truncate">
                Used in {usageCount} {usageCount === 1 ? "place" : "places"}
              </span>
              <span className={ROW_CHEVRON}>{"›"}</span>
            </Button>
            <Button
              className={ROW}
              data-testid="media-detail-versions"
              onClick={() => setView("versions")}
            >
              <span className="tw:min-w-0 tw:flex-1 tw:truncate">Versions</span>
              {versionCount > 0 ? <span className={ROW_COUNT}>{versionCount}</span> : null}
              <span className={ROW_CHEVRON}>{"›"}</span>
            </Button>
            {showEdit ? (
              <Button
                className={ROW}
                data-testid="media-detail-edit"
                onClick={() => onEditImage?.(item)}
              >
                <span className="tw:min-w-0 tw:flex-1 tw:truncate">Edit image</span>
                <span className={ROW_CHEVRON}>{"›"}</span>
              </Button>
            ) : null}
            {showOptimize ? (
              <Button
                className={ROW}
                data-testid="media-detail-optimize"
                onClick={() => setView("optimize")}
              >
                <span className="tw:min-w-0 tw:flex-1 tw:truncate">Optimise</span>
                <span className={ROW_CHEVRON}>{"›"}</span>
              </Button>
            ) : null}
            {showReplace ? (
              <Button
                className={ROW}
                data-testid="media-detail-replace"
                onClick={() => onReplaceAcross?.(item)}
              >
                <span className="tw:min-w-0 tw:flex-1 tw:truncate">Replace across site</span>
                <span className={ROW_CHEVRON}>{"›"}</span>
              </Button>
            ) : null}
            {/* Board 4418:61698 — the library's actions, glyph-led, no chevron:
                they act, they do not drill in. */}
            <div className="tw:w-full" data-testid="media-detail-actions">
              {[
                { id: "insert", label: "Insert to canvas", icon: <SquarePlus size={14} />, fn: onInsert },
                { id: "rename", label: "Rename…", icon: <Pencil size={14} />, fn: onRename, blocked: viewOnly?.rename },
                { id: "copy-url", label: "Copy URL", icon: <Link2 size={14} />, fn: onCopyUrl },
                { id: "download", label: "Download", icon: <Download size={14} />, fn: onDownload },
                { id: "delete", label: "Delete", icon: <Trash2 size={14} />, fn: onDelete, blocked: viewOnly?.delete },
              ].map((a) =>
                a.fn ? (
                  <Button
                    key={a.id}
                    className={ROW}
                    data-testid={`media-detail-${a.id}`}
                    disabled={Boolean(a.blocked)}
                    title={a.blocked}
                    onClick={() => a.fn?.(item)}
                  >
                    <span className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-2">
                      <span aria-hidden="true" className="tw:flex tw:text-[var(--bk-ink-soft)]">{a.icon}</span>
                      <span className="tw:truncate">{a.label}</span>
                    </span>
                  </Button>
                ) : null,
              )}
            </div>
          </>
        )
      ) : view === "versions" ? (
        <div className="tw:w-full" role="list" aria-label="Version history">
          {/* Current — pinned, accent-tint with the 3px bar (board 241:1436). */}
          {/* Board 75:65 — the current version is a 44-high accent-tint chip
              on a 6 radius at a 10 inset, the same box the older rows use in
              bg-subtle. It shipped 56 tall, full-bleed and square. */}
          <div
            className="tw:relative tw:mx-3 tw:mt-2 tw:flex tw:h-11 tw:items-center tw:gap-2.5 tw:rounded-md tw:bg-[var(--bk-accent-tint)] tw:px-2.5"
            data-testid="media-version-current"
            role="listitem"
          >
            <span className="tw:absolute tw:inset-y-0 tw:left-0 tw:w-[3px] tw:bg-[var(--bk-accent)]" aria-hidden="true" />
            <span className="tw:size-2 tw:shrink-0 tw:rounded-full tw:bg-[var(--bk-accent)]" aria-hidden="true" />
            <span className="tw:min-w-0 tw:flex-1 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
              now
            </span>
            <span className="tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:leading-4 tw:font-medium tw:text-[var(--bk-ink-muted)]">
              current
            </span>
          </div>
          {dbVersions.map((v, i) => {
            const ts = new Date(v.createdAt).getTime();
            const prev = dbVersions[i + 1];
            const delta = prev ? v.bytes - prev.bytes : null;
            const meta =
              i === dbVersions.length - 1
                ? "original"
                : delta === null || delta === 0
                  ? fmtSize(v.bytes)
                  : `${delta > 0 ? "+" : "−"}${fmtSize(Math.abs(delta))}`;
            return (
              <React.Fragment key={v.id}>
                {/* Boards 75:71 / 75:77 / 75:83 — an older version wears the
                    SAME box as the current one, in bg-subtle: 44 tall, 6
                    radius, 10 inset, 10 gap, inset from the panel edge. They
                    shipped 56 tall, full-bleed and square, directly under a
                    44 chip on a 6 radius, which read as two different lists. */}
                <div
                  className="tw:mx-3 tw:mt-2 tw:flex tw:h-11 tw:items-center tw:gap-2.5 tw:rounded-md tw:bg-[var(--bk-bg-subtle)] tw:px-2.5"
                  data-testid={`media-version-${v.id}`}
                  role="listitem"
                >
                  <span className="tw:size-2 tw:shrink-0 tw:rounded-full tw:bg-[var(--bk-gray-300)]" aria-hidden="true" />
                  <span className="tw:min-w-0 tw:flex-1 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
                    {formatRelativeTime(ts, { fallback: "daysShort" })}
                  </span>
                  <span className="tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:leading-4 tw:font-medium tw:tracking-[0.5px] tw:text-[var(--bk-ink-soft)]">
                    {meta}
                  </span>
                  <Button
                    type="button"
                    color="light"
                    size="xs"
                    className="tw:min-h-6 tw:shrink-0 tw:border-0 tw:bg-transparent tw:px-1 tw:text-[13px] tw:text-[var(--bk-ink-soft)] tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-ink)]"
                    data-testid={`media-version-menu-${v.id}`}
                    aria-label={`Restore options for version from ${formatRelativeTime(ts, { fallback: "daysShort" })}`}
                    disabled={restoringId !== null}
                    onClick={() => setPendingRestore(pendingRestore === v.id ? null : v.id)}
                  >
                    {restoringId === v.id ? "…" : "⋯"}
                  </Button>
                </div>
                {/* Board 146:64 — restore confirms INLINE, and the band is 84
                    tall because the question names the cost: it shipped as a
                    32h strip saying "Restore?", which asks for a decision
                    while withholding the one fact needed to make it. */}
                {pendingRestore === v.id ? (
                  <div
                    className="tw:flex tw:h-21 tw:w-full tw:flex-col tw:justify-start tw:gap-2 tw:bg-[var(--bk-bg-subtle)] tw:px-4 tw:pt-2 tw:text-[12px] tw:leading-[18px]"
                    data-testid="media-restore-confirm"
                  >
                    <span className="tw:text-[var(--bk-ink)]">
                      Restore this version?{usageCount > 0
                        ? ` It is used in ${usageCount} ${usageCount === 1 ? "place" : "places"} — those will update too.`
                        : ""}
                    </span>
                    <span className="tw:flex tw:items-center tw:justify-end tw:gap-4">
                      <Button
                        type="button"
                        color="light"
                        size="xs"
                        variant="link" className="tw:min-h-5 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]"
                        data-testid="media-restore-cancel"
                        onClick={() => setPendingRestore(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        color="light"
                        size="xs"
                        variant="link" className="tw:min-h-5 tw:text-[12px] tw:leading-[18px]"
                        data-testid="media-restore-go"
                        onClick={() => confirmRestore(v.id)}
                      >
                        Restore
                      </Button>
                    </span>
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
          {dbVersions.length === 0 ? (
            <div className="tw:px-4 tw:pt-6 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
              No saved versions yet. Edits create restore points automatically.
            </div>
          ) : null}
        </div>
      ) : view === "used" ? (
        <div className="tw:w-full" role="list" aria-label="Pages using this asset">
          {usage.length === 0 ? (
            /* The caption calls this state load-bearing — the full treatment,
               not a dash: this answer is what makes deleting safe. */
            <div className="tw:px-4 tw:pt-8 tw:text-[13px] tw:leading-5" data-testid="media-used-empty">
              <p className="tw:text-[var(--bk-ink)]">Not used on any page</p>
              <p className="tw:mt-1 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
                Deleting this file won{"’"}t change anything on your site.
              </p>
            </div>
          ) : (
            /* Board 75:90 lists one CHIP PER HIT — page name over the
               element's own name, with a "Go ›" link — and no page-group
               header at all: 75:96 "Home / Hero background", 75:101 "Menu /
               Header image", 75:106 "About / Gallery · item 2". It shipped as
               a 28-high bg-subtle header per page with bare full-bleed rows
               under it, which put the page name in two places and left the
               row itself with no shape. Flattened here to the board's list;
               the hit count the header carried is already in the drill-in row
               that opens this view. */
            usage.flatMap((pg) =>
              pg.hits.map((hit) => (
                <div
                  key={hit.elementId}
                  className="tw:mx-3 tw:mt-2 tw:flex tw:h-11 tw:items-center tw:gap-2.5 tw:rounded-md tw:bg-[var(--bk-bg-subtle)] tw:px-2.5"
                  data-testid={`media-used-row-${hit.elementId}`}
                  role="listitem"
                >
                  <span className="tw:min-w-0 tw:flex-1">
                    {/* 75:98 — the page, 12 on an 18 line box in ink. */}
                    <span className="tw:block tw:truncate tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]">
                      {pg.pageName}
                    </span>
                    {/* 75:99 — what it is on that page, 11/16 in ink-muted. */}
                    <span
                      className="tw:block tw:truncate tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]"
                      data-testid={`media-used-sub-${hit.elementId}`}
                    >
                      {hit.label}
                    </span>
                  </span>
                  {/* 75:100 — "Go ›", 11/16 in accent-text. It said "Jump ›". */}
                  <Button
                    type="button"
                    color="light"
                    size="xs"
                    variant="link"
                    className="tw:min-h-6 tw:shrink-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-accent-text)]"
                    data-testid={`media-jump-${hit.elementId}`}
                    onClick={() => handleJump(pg.pageId, hit.elementId)}
                  >
                    Go {"›"}
                  </Button>
                </div>
              )),
            )
          )}
          {/* Board 75:111 — the delete guard. The empty state already tells
              you deleting is safe; the state where it is NOT safe said
              nothing at all, which is the half that matters. 40h warning-tint
              band on a 6 radius, 11/16 in warning-text. */}
          {usage.length > 0 ? (
            <div
              className="tw:mx-3 tw:mt-2 tw:mb-3 tw:flex tw:h-10 tw:items-center tw:rounded-md tw:bg-[var(--bk-warning-tint)] tw:px-2.5"
              data-testid="media-used-delete-guard"
              role="note"
            >
              <span className="tw:min-w-0 tw:flex-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-warning-text)]">
                Deleting this breaks {usage.length} {usage.length === 1 ? "page" : "pages"}. Replace it instead.
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto">
          {/* No onClose: the ‹ back row is this screen's exit and board
              1124:4562 draws no second one. */}
          <OptimizationPanel
            imageSrc={item.src}
            onOptimized={async (src) => {
              await onOptimized?.(src);
              setView("hub");
            }}
          />
        </div>
      )}
    </div>
  );
}
