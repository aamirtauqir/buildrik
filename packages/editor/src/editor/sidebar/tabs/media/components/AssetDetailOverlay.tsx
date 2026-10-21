/**
 * AssetDetailOverlay — the asset drill-in HUB, board 146:2, with its two
 * sub-screens: Versions (146:32) and Used-in (146:68).
 *
 * The board's IA is list rows, not tabs: preview + dimensions, alt text
 * ABOVE the fold ("the one field with a legal consequence"), then
 * five 32h rows — Used in N places · Versions · Edit image · Optimise ·
 * Replace across site. Edit image opens the image-editor MODAL (cargo-sheets
 * §4: "Modals, not drill-in"); Optimise opens the same modal on its Optimise
 * tab (4418:149547, G3-026) — the drawer's own optimise panel is gone.
 *
 * Versions view (146:32 / v3 4418:62883) is `AssetVersionList` — the same
 * list, data and restore the library's Asset versions dialog draws
 * (`useAssetVersions`): the asset's family, where Restore moves every
 * placement onto the chosen version's file (REA 2026-10-20 M-5). It used to
 * list the server's best-effort history instead, so the drawer and the
 * library disagreed about one asset's versions.
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
import type { LibraryItem } from "../data/mediaTypes";
import { collectUsageByPage, fmtSize } from "../data/mediaUtils";
import { useAltTextDraft } from "../hooks/useAltTextDraft";
import type { Composer } from "@/engine/Composer";
import { useAssetVersions } from "../hooks/useAssetVersions";
import { AssetVersionList } from "./AssetVersionList";
import { Button, PanelFrame, Textarea, useFocusTrap } from "@/editor/chrome-ui";
import { Download, Link2, Pencil, SquarePlus, Trash2 } from "lucide-react";

type View = "hub" | "used" | "versions";

const NO_VERSIONS: LibraryItem[] = [];

interface AssetDetailOverlayProps {
  item: LibraryItem;
  /** `versionsOf(item.key)`, memoized — the family the Versions view lists.
   *  Absent: the asset has no saved version. */
  versions?: LibraryItem[];
  /** Back to the grid (the ‹ row). ESC does the same, one level at a time. */
  onClose(): void;
  onUpdate?(key: string, updates: Partial<LibraryItem>): Promise<void>;
  /** Opens the image-editor modal; Optimise asks for its "optimise" tab. */
  onEditImage?(item: LibraryItem, initialTab?: "optimise"): void | Promise<void>;
  composer?: Composer;
  onReplaceAcross?(item: LibraryItem): void;
  /* Board 4418:61698 — the library's own actions, under the destination rows
     (G3-021). Each row renders only when its handler is supplied. */
  onInsert?(item: LibraryItem): void;
  onRename?(item: LibraryItem): void;
  onCopyUrl?(item: LibraryItem): void;
  onDownload?(item: LibraryItem): void;
  onDelete?(item: LibraryItem): void;
  /** Board 4418:61698's header expand — this asset, selected, in the full library. */
  onExpand?(item: LibraryItem): void;
  /** A viewer's reasons — Rename / Delete stay visible, disabled, titled. */
  viewOnly?: { rename?: string; delete?: string };
}

const ROW =
  "tw:flex tw:h-8 tw:w-full tw:items-center tw:justify-start tw:gap-2 tw:rounded tw:border-0 tw:bg-transparent tw:px-4 tw:font-normal " +
  "tw:text-left tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]";
/* Board 4418:61698: the nav rows end in a 12px ink › in a 24 box, and
   Versions' count is 11/400 ink beside it. */
const ROW_CHEVRON = "tw:flex tw:w-6 tw:shrink-0 tw:justify-center tw:text-[12px] tw:text-[var(--bk-ink)]";
const ROW_COUNT = "tw:text-[11px] tw:font-normal tw:tabular-nums tw:text-[var(--bk-ink)]";

/* Button's `link` variant supplies the recipe; the row's own geometry
   (full-width 36h nav row) stays here. */
const BACK_ROW = "tw:flex tw:h-9 tw:w-full tw:items-center tw:justify-start tw:px-4 tw:text-left tw:font-normal";
/* v3: the hub's back row is 14 ink (4418:61698); a sub-view's — "‹ name ·
   versions / used in" — is the 13 accent link (4418:62883 / 63087). */
const BACK_ROW_HUB = "tw:text-[14px] tw:text-[var(--bk-ink)]";
const BACK_ROW_SUB = "tw:text-[13px] tw:text-[var(--bk-accent-text)]";

export function AssetDetailOverlay({
  item,
  versions: family = NO_VERSIONS,
  onClose,
  onUpdate,
  onEditImage,
  composer,
  onReplaceAcross,
  onInsert,
  onRename,
  onCopyUrl,
  onDownload,
  onDelete,
  onExpand,
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
  const [metaError, setMetaError] = useState(false);
  // Board 146:9 draws "1440×960 · 245 KB" under the preview, and MediaAsset
  // only carries width/height when the upload went through the WebP optimiser
  // (MediaManager.ts:950) — an SVG, a server-loaded row and a stock save all
  // have neither, so the board's first fact shipped blank for most assets.
  // Measured below instead, from the file itself.
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const mountedRef = useRef(true);

  const display = item.displayName ?? item.name;

  const versions = useAssetVersions(composer, family);

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

  /* ESC pops one level: sub-view → hub, hub → grid. Focus is trapped and
     returned by chrome-ui's trap (DQ-019) — this file carried its own copy,
     which differed only in skipping dialogs that are mounted but closed; the
     shared trap does that now. A modal opened FROM the drill-in (the image
     editor) is the topmost dialog and owns Escape. */
  const overlayRef = useFocusTrap(true, () => {
    if (viewRef.current === "hub") onClose();
    else setView("hub");
  });

  useEffect(() => {
    setView("hub");
    setMetaError(false);
    setNatural(null);
  }, [item.key]);

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

  const saveAltText = useCallback(
    async (key: string, altText: string) => {
      await onUpdate?.(key, { altText });
    },
    [onUpdate],
  );
  const { field: altField, saveFailed: altSaveFailed } = useAltTextDraft(item, saveAltText);
  const altDraft = altField.value;

  // The asset's own metadata wins; the measured bitmap is the fallback.
  const dims = item.width != null && item.height != null
    ? { w: item.width, h: item.height }
    : natural;

  const showEdit = item.type === "img" && !!onEditImage;
  const showOptimize = showEdit;
  const showReplace = (item.type === "img" || item.type === "vid") && !!onReplaceAcross;
  // The family's size once a version is saved — the count the hub row shows.
  const versionCount = versions.rows.length > 1 ? versions.rows.length : 0;

  const backLabel =
    view === "versions"
      ? `${display} · versions`
      : view === "used"
        ? `${display} · used in`
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
      <PanelFrame.Header title="Assets" onClose={onClose} onExpandToggle={onExpand ? () => onExpand(item) : undefined} />

      {/* Back row — ‹ pops one level, exactly like ESC. */}
      <Button
        variant="link" className={`${BACK_ROW} ${view === "hub" ? BACK_ROW_HUB : BACK_ROW_SUB}`}
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

            {/* Board 146:11 — alt text above the fold. */}
            <div className="tw:w-full tw:px-4 tw:pt-1.5" data-testid="media-detail-alt">
              <label className="tw:block tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]" htmlFor="med-alt-input" data-testid="media-detail-alt-label">
                Alt text
              </label>
              {/* Board 4418:61698 — one bordered box around the text. */}
              <div className="tw:mt-1 tw:flex tw:flex-col tw:rounded-md tw:border tw:border-[var(--bk-gray-400)] tw:bg-white tw:px-2 tw:py-1.5" data-testid="media-alt-box">
                <Textarea
                  id="med-alt-input"
                  rows={2}
                  className="tw:resize-none tw:border-0 tw:bg-transparent tw:p-0 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink)] tw:shadow-none tw:focus:ring-0"
                  {...altField}
                  placeholder="Describe this image for screen readers"
                  aria-label="Alt text"
                />
              </div>
              {altSaveFailed && (
                <p role="alert" data-testid="media-alt-error" className="tw:mt-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]">
                  Could not save the alt text — the server did not save the change.
                </p>
              )}
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
                onClick={() => onEditImage?.(item, "optimise")}
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
                    <span className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-2 tw:text-[14px]">
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
        <AssetVersionList key={item.key} versions={versions} />
      ) : view === "used" ? (
        <div className="tw:w-full" role="list" aria-label="Pages using this asset">
          {usage.length === 0 ? (
            /* The caption calls this state load-bearing — the full treatment,
               not a dash: this answer is what makes deleting safe. */
            <div className="tw:px-4 tw:pt-8 tw:text-[13px] tw:leading-5" data-testid="media-used-empty">
              <p className="tw:text-[var(--bk-ink)]">Not used on any page</p>
              <p className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-gray-500)]">
                Deleting this file won{"’"}t change anything on your site.
              </p>
            </div>
          ) : (
            /* v3 4418:63087 groups the hits by PAGE again: a 28 gray-100 band
               with the page name and its count, then 44 rows — the element's
               name 13 ink over "Page › name" 11 muted, and "Jump ›" 12 accent.
               (The pre-v3 board 75:90 drew one chip per hit instead.) */
            usage.map((pg) => (
              <React.Fragment key={pg.pageId}>
                <div
                  className="tw:flex tw:h-7 tw:items-center tw:justify-between tw:bg-[var(--bk-gray-100)] tw:px-4 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]"
                  data-testid={`media-used-page-${pg.pageId}`}
                >
                  <span className="tw:truncate">{pg.pageName}</span>
                  <span className="tw:font-medium tw:tabular-nums">{pg.hits.length}</span>
                </div>
                {pg.hits.map((hit) => (
                  <div
                    key={hit.elementId}
                    className="tw:flex tw:h-11 tw:items-center tw:gap-2 tw:px-4"
                    data-testid={`media-used-row-${hit.elementId}`}
                    role="listitem"
                  >
                    <span className="tw:min-w-0 tw:flex-1">
                      <span className="tw:block tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
                        {hit.label}
                      </span>
                      <span
                        className="tw:block tw:truncate tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]"
                        data-testid={`media-used-sub-${hit.elementId}`}
                      >
                        {hit.crumb}
                      </span>
                    </span>
                    <Button
                      type="button"
                      color="light"
                      size="xs"
                      variant="link"
                      className="tw:min-h-6 tw:shrink-0 tw:p-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-accent-text)]"
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
      ) : null}
    </div>
  );
}
