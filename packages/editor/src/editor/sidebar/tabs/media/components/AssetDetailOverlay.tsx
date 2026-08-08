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
 * Versions view (146:32): 56h rows — dot · relative time · size delta,
 * current pinned with a 3px accent bar — and restore confirms INLINE in a
 * 32h band ("a drill-in that spawns a modal has lost the plot"). The data is
 * the server restore points; the old sibling-filename heuristic list is gone
 * (those are separate library items the grid already shows). No author line —
 * AssetVersion carries none; the board's "Ali/Sara" is sample shape.
 *
 * Used-in view (146:68): 44h rows grouped by page with a 28h count header,
 * Jump switches the active page and selects the element. The empty state is
 * load-bearing: "Not used on any page" is what makes deleting safe.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OptimizationPanel } from "@/editor/media/OptimizationPanel";
import { generateContent } from "@/shared/utils/openai";
import { formatRelativeTime } from "@/shared/utils/relativeTime";
import type { LibraryItem } from "../data/mediaTypes";
import { collectUsageByPage, fmtSize } from "../data/mediaUtils";
import type { Composer } from "../../../../../engine/Composer";
import {
  listAssetVersions,
  restoreAssetVersion,
  type AssetVersion,
} from "../../../../../services/MediaVersionService";
import { Button, PanelFrame, TextField } from "@/editor/chrome-ui";

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
}

const ROW =
  "tw:flex tw:h-8 tw:w-full tw:items-center tw:justify-start tw:gap-2 tw:rounded tw:border-0 tw:bg-transparent tw:px-4 " +
  "tw:text-left tw:text-[13px] tw:leading-5 tw:text-gray-900 tw:enabled:hover:bg-[var(--bk-bg-subtle)]";
const ROW_CHEVRON = "tw:text-[13px] tw:text-gray-500";
const ROW_COUNT =
  "tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:font-medium tw:tabular-nums tw:text-gray-500";
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

const BACK_ROW =
  "tw:flex tw:h-9 tw:w-full tw:items-center tw:justify-start tw:border-0 tw:bg-transparent tw:px-4 tw:text-left " +
  "tw:text-[13px] tw:leading-5 tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline";

export function AssetDetailOverlay({
  item,
  onClose,
  onUpdate,
  onEditImage,
  composer,
  onOptimized,
  onReplaceAcross,
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
  const [metaError, setMetaError] = useState(false);
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
      return collectUsageByPage(composer.elements.getAllPages(), item.src);
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
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setAltDraft(item.altText ?? "");
    setView("hub");
    setMetaError(false);
    setPendingRestore(null);
  }, [item.key, item.altText]);

  const commitAltText = useCallback(() => {
    if (!onUpdate) return;
    const next = altDraft.trim();
    if (next === (item.altText ?? "")) return;
    void onUpdate(item.key, { altText: next });
  }, [onUpdate, altDraft, item.altText, item.key]);

  // ✨ Generate — writes the draft AND commits it, so the field has a value
  // the moment the user looks at it.
  const generateAlt = useCallback(async () => {
    if (altBusy) return;
    setAltBusy(true);
    try {
      const alt = await generateContent(
        `Write one concise alt text (max 125 characters, no quotes) for an image file named "${display}".`,
        "headline",
        "professional",
      );
      const clean = alt.replace(/^["']|["']$/g, "").trim().slice(0, 125);
      if (clean && mountedRef.current) {
        setAltDraft(clean);
        void onUpdate?.(item.key, { altText: clean });
      }
    } catch {
      // AI unavailable — the field stays manual.
    } finally {
      if (mountedRef.current) setAltBusy(false);
    }
  }, [altBusy, item.key, display, onUpdate]);

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
      className="med-detail-overlay tw:absolute tw:inset-0 tw:z-10 tw:flex tw:flex-col tw:items-stretch tw:overflow-y-auto tw:bg-[var(--bk-bg-panel,white)]"
      role="dialog"
      aria-modal="true"
      aria-label={display}
    >
      {/* The drill-in draws the shared panel header itself — the overlay
          covers the drawer, and the board keeps Media's 44h header on every
          drill-in screen. */}
      <PanelFrame.Header title="Media" onClose={onClose} />

      {/* Back row — ‹ pops one level, exactly like ESC. */}
      <Button
        className={BACK_ROW}
        onClick={() => (view === "hub" ? onClose() : setView("hub"))}
        aria-label={view === "hub" ? "Back to media grid" : `Back to ${display}`}
      >
        {"‹"}&nbsp;&nbsp;{backLabel}
      </Button>

      {view === "hub" ? (
        metaError ? (
          <div className="tw:px-4 tw:pt-10 tw:text-center tw:text-[13px] tw:leading-5">
            <p className="tw:text-gray-900">Preview unavailable</p>
            <p className="tw:mt-1 tw:text-[12px] tw:text-gray-500">
              The file may have been moved or deleted.
            </p>
            <Button
              type="button"
              color="light"
              size="xs"
              className="tw:mt-2 tw:min-h-6 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[13px] tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
              onClick={() => setMetaError(false)}
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Board 146:9 — 160h preview on bg-subtle, dims in mono at the
                bottom-left of the well. */}
            <div className="tw:relative tw:h-40 tw:w-full tw:shrink-0 tw:bg-[var(--bk-bg-subtle)]">
              {item.type === "vid" ? (
                <video
                  src={item.src}
                  className="tw:size-full tw:object-contain"
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
              <span className="tw:absolute tw:bottom-2 tw:left-4 tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:font-medium tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]">
                {item.width != null && item.height != null ? `${item.width}×${item.height} · ` : ""}
                {fmtSize(item.size)}
              </span>
            </div>

            {/* Board 146:11 — alt text above the fold, with ✨ Generate. */}
            <div className="tw:w-full tw:px-4 tw:pt-1.5 tw:pb-2">
              <label className="tw:block tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]" htmlFor="med-alt-input">
                Alt text
              </label>
              <TextField
                id="med-alt-input"
                className="tw:mt-1 tw:h-8 tw:w-full tw:rounded-md tw:border tw:border-gray-400 tw:bg-white tw:px-2 tw:text-[12px] tw:text-gray-900"
                value={altDraft}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAltDraft(e.target.value)}
                onBlur={commitAltText}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitAltText();
                    (e.currentTarget as HTMLInputElement).blur();
                  }
                }}
                placeholder="Describe this image for screen readers"
                aria-label="Alt text"
              />
              <Button
                type="button"
                color="light"
                size="xs"
                className="tw:mt-1.5 tw:min-h-5 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[12px] tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
                data-testid="media-alt-generate"
                disabled={altBusy}
                aria-busy={altBusy || undefined}
                onClick={generateAlt}
              >
                {"✨"}&nbsp;&nbsp;{altBusy ? "Generating…" : "Generate"}
              </Button>
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
          </>
        )
      ) : view === "versions" ? (
        <div className="tw:w-full" role="list" aria-label="Version history">
          {/* Current — pinned, accent-tint with the 3px bar (board 241:1436). */}
          <div className="tw:relative tw:flex tw:h-14 tw:w-full tw:items-start tw:bg-[var(--bk-accent-subtle,#ebf5ff)]" role="listitem">
            <span className="tw:absolute tw:inset-y-0 tw:left-0 tw:w-[3px] tw:bg-[var(--bk-accent)]" aria-hidden="true" />
            <span className="tw:mt-4 tw:ml-5 tw:size-2 tw:shrink-0 tw:rounded-full tw:bg-[var(--bk-accent)]" aria-hidden="true" />
            <span className="tw:ml-3 tw:mt-2.5 tw:min-w-0 tw:flex-1 tw:text-[13px] tw:leading-5 tw:text-gray-900">
              now
            </span>
            <span className="tw:mt-2.5 tw:mr-4 tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:font-medium tw:text-gray-500">
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
                <div className="tw:flex tw:h-14 tw:w-full tw:items-start hover:tw:bg-[var(--bk-bg-subtle)]" role="listitem">
                  <span className="tw:mt-4 tw:ml-5 tw:size-2 tw:shrink-0 tw:rounded-full tw:bg-gray-300" aria-hidden="true" />
                  <span className="tw:ml-3 tw:mt-2.5 tw:min-w-0 tw:flex-1 tw:text-[13px] tw:leading-5 tw:text-gray-900">
                    {formatRelativeTime(ts)}
                  </span>
                  <span className="tw:mt-2.5 tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:font-medium tw:tracking-[0.5px] tw:text-gray-500">
                    {meta}
                  </span>
                  <Button
                    type="button"
                    color="light"
                    size="xs"
                    className="tw:mx-3 tw:mt-1.5 tw:min-h-6 tw:border-0 tw:bg-transparent tw:px-1 tw:text-[13px] tw:text-gray-500 tw:enabled:hover:bg-transparent tw:enabled:hover:text-gray-900"
                    aria-label={`Restore options for version from ${formatRelativeTime(ts)}`}
                    disabled={restoringId !== null}
                    onClick={() => setPendingRestore(pendingRestore === v.id ? null : v.id)}
                  >
                    {restoringId === v.id ? "…" : "⋯"}
                  </Button>
                </div>
                {/* Board 146:64 — restore confirms INLINE in a 32h band. */}
                {pendingRestore === v.id ? (
                  <div className="tw:flex tw:h-8 tw:w-full tw:items-center tw:gap-6 tw:bg-[var(--bk-bg-subtle)] tw:px-4 tw:text-[12px] tw:leading-[18px]" data-testid="media-restore-confirm">
                    <span className="tw:flex-1 tw:text-gray-900">Restore?</span>
                    <Button
                      type="button"
                      color="light"
                      size="xs"
                      className="tw:min-h-5 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[12px] tw:text-[var(--bk-ink-muted)] tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
                      onClick={() => setPendingRestore(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      color="light"
                      size="xs"
                      className="tw:min-h-5 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[12px] tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
                      data-testid="media-restore-go"
                      onClick={() => confirmRestore(v.id)}
                    >
                      Restore
                    </Button>
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
              <p className="tw:text-gray-900">Not used on any page</p>
              <p className="tw:mt-1 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
                Deleting this file won{"’"}t change anything on your site.
              </p>
            </div>
          ) : (
            usage.map((pg) => (
              <React.Fragment key={pg.pageId}>
                {/* 28h page-group header. */}
                <div className="tw:flex tw:h-7 tw:w-full tw:items-center tw:bg-[var(--bk-bg-subtle)] tw:px-4 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
                  <span className="tw:flex-1">{pg.pageName}</span>
                  <span className="tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:font-medium tw:tabular-nums">
                    {pg.hits.length}
                  </span>
                </div>
                {pg.hits.map((hit) => (
                  <div key={hit.elementId} className="tw:flex tw:h-11 tw:w-full tw:items-center tw:px-4" role="listitem">
                    <span className="tw:min-w-0 tw:flex-1">
                      <span className="tw:block tw:truncate tw:text-[13px] tw:leading-5 tw:text-gray-900">
                        {hit.label}
                      </span>
                      <span className="tw:block tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                        {hit.crumb}
                      </span>
                    </span>
                    <Button
                      type="button"
                      color="light"
                      size="xs"
                      className="tw:min-h-6 tw:shrink-0 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[13px] tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
                      data-testid={`media-jump-${hit.elementId}`}
                      onClick={() => handleJump(pg.pageId, hit.elementId)}
                    >
                      Jump {"›"}
                    </Button>
                  </div>
                ))}
              </React.Fragment>
            ))
          )}
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
