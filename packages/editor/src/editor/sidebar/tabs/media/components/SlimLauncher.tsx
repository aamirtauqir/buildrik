/**
 * SlimLauncher — the Media drawer at 320. Figma `Media · grid` 144:2.
 *
 * `MediaTab` picks between three renderers; this is the one the board's Media
 * screens describe, which is why the redesign lands here rather than in the
 * fullpage manager.
 *
 * ORDER IS THE DESIGN (v3 board 4418:59771). Header ("Assets · N", ⋯,
 * close), Manage assets ›, Filter ▾, grid, spacer, Upload + caret. Search is
 * the topbar field while this drawer is open (MediaTab claims it).
 *
 * WHAT THE FOOTER KEPT. `UploadZone` is still mounted above Upload because
 * it owns the file input, the drag-and-drop target, the quota bar and the
 * persistent failed-upload list with retry — none of which the board's mock
 * shows and all of which are real behaviour. Upload drives its input.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelFrame, Button, IconButton, Menu, MenuItem, MenuSeparator, Popover, SkeletonBlock, Tooltip } from "@/editor/chrome-ui";
import { Upload, Cloud, Shapes, Folder, ChevronDown, ChevronRight } from "lucide-react";
import type { Composer } from "@/engine/Composer";
import type { MediaAsset, UploadResult } from "@shared/types/media";
import { MEDIA_SIZE_LIMITS_LABEL, fileExtensionLabel } from "@shared/constants/media";
import { displayNameFor } from "../data/mediaUtils";
import { formatBytes } from "@shared/utils/helpers/number";
import type { FailedUpload, LibraryItem, MediaBucket, MediaFolder, TypeCounts, UploadProgress } from "../data/mediaTypes";
import { flattenFolderTree } from "../utils/folderTree";
import { AssetCell } from "./AssetCell";
import { UploadZone } from "./UploadZone";
import { ReplacementUploadModal } from "./ReplacementUploadModal";
import { useMediaWriteAccess } from "../hooks/useMediaWriteAccess";
import "./SlimLauncher.css";

interface SlimLauncherProps {
  composer: Composer;
  libraryItems: LibraryItem[];
  activeTypes: ReadonlySet<MediaBucket>;
  counts: TypeCounts;
  searchQuery: string;
  storage: { used: number; total: number };
  uploadQueue: UploadProgress[];
  usageMap: Map<string, number>;
  onInsert(key: string): void;
  onToggleType(type: MediaBucket): void;
  onSearchChange(query: string): void;
  /** Resolves the engine's result per file — the replacement banner
   *  (Clone 3585:23337) names the asset that landed. */
  onUpload(files: File[]): Promise<UploadResult[]>;
  /** The engine's verdicts by name; a size-gate record offers a replacement
   *  (Clone 3584:45522). */
  failedUploads?: FailedUpload[];
  /** Drop a failed upload's row — the replacement confirm clears the file it
   *  stands in for. */
  onDismissUpload?(fileName: string): void;
  /** Storage has not been read yet — draw the skeleton, not the empty state. */
  loading?: boolean;
  /** Storage could not be read. Distinct from empty: the assets still exist. */
  loadError?: string | null;
  onRetryLoad?(): void;

  // ── Bulk select (board `145:300`) ─────────────────────────────────────────
  /**
   * Two ways in: the header ⋯ "Select assets…" (board 7077:79223) and
   * right-click on a card, which pre-selects the card it landed on. The way
   * out — Done — is visible the whole time selection is on.
   */
  /**
   * Open the asset drill-in (board `146:2`, and its Versions / Used-in tabs at
   * `146:32` / `146:68`). Double-click, because single click inserts — the
   * primary job of this drawer is putting an asset on the canvas, and taking
   * that over would trade a one-click flow for a two-click one.
   */
  onOpenDetail?(item: LibraryItem): void;
  /** Icon picker drill-in (board `147:2`). */
  onOpenIconPicker?(): void;

  // ── Folder scope (board `145:49`) ────────────────────────────────────────
  /** null = the whole library. */
  currentFolderId?: string | null;
  allFolders?: MediaFolder[];
  onFolderChange?(folderId: string | null): void;

  selectionMode?: boolean;
  /** Header ⋯ "Select assets…" — enter bulk-select. */
  onToggleSelection?(): void;
  selectedKeys?: Set<string>;
  onEnterSelection?(key: string): void;
  onToggleSelect?(key: string): void;
  onExitSelection?(): void;
  /** Legacy: open the full library, where the picker used to live. */
  onBulkMove?(): void;
  /** Move every selected asset to a folder (null = root). When provided, the
   *  bulk bar shows its own picker instead of bouncing to the library. */
  onBulkMoveTo?(folderId: string | null): void;
  onBulkDelete?(): void;
  /**
   * Retry a failed upload. The drawer had no way to reach it: `MediaTab` wired
   * `state.retryUpload` into the fullpage branch only, so the persistent
   * failed-upload row the board draws with a Retry link (145:195) rendered
   * here without one. Found by building that state as a probe case.
   */
  onRetryUpload?(fileName: string): void;
  /** Server paging edges — null in the standalone demo, which has no server. */
  serverPage?: { nextCursor: string | null; total: number; loaded: number } | null;
  /** Where a whole-library search stands — see `LibraryStateResult`. */
  searchState?: "idle" | "searching" | "whole" | "truncated" | "failed";
  loadingMore?: boolean;
  loadMoreError?: boolean;
  onLoadMore?(): Promise<void> | void;
  onOpenStock(): void;
  onOpenLibrary?(opts?: { searchQuery?: string; folderId?: string | null }): void;
  onClose?(): void;
}

/* Board 7077:79171's TYPE rows. SVG is the `ico` bucket, Icons the `fnt`
   bucket (icon sets and fonts) — the labels the chips carried as "svg" /
   "icon". */
const TYPE_ROWS: Array<{ key: MediaBucket; label: string }> = [
  { key: "img", label: "Images" },
  { key: "vid", label: "Video" },
  { key: "ico", label: "SVG" },
  { key: "fnt", label: "Icons" },
];

function FilterRowLabel({ label, count }: { label: string; count?: number }) {
  return (
    <span className="tw:flex tw:w-full tw:items-center tw:justify-between">
      {label}
      {count === undefined ? null : (
        <span className="tw:text-[11px] tw:tabular-nums tw:text-[var(--bk-ink-muted)]">{count}</span>
      )}
    </span>
  );
}

/* Boards 7077:79171 / 7077:79204 / 7077:79223: the drawer's menus are 224
   wide (206 of menu inside the popover's 8 + 1), rows 30, and their section
   heads are plain 13/500 ink — not the 11px spaced caps of MenuLabel. */
const DRAWER_MENU = "tw:w-[206px] tw:[&_[role^=menuitem]]:h-[30px]";

function DrawerMenuHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="tw:flex tw:h-[30px] tw:items-center tw:px-2 tw:text-[13px] tw:font-medium tw:leading-5 tw:text-[var(--bk-ink)]">
      {children}
    </div>
  );
}

export function SlimLauncher(props: SlimLauncherProps) {
  const [bulkMoveOpen, setBulkMoveOpen] = React.useState(false);
  const {
    activeTypes,
    counts,
    searchQuery,
    onToggleType,
    onSearchChange,
    onOpenStock,
    onClose,
  } = props;

  // The footer's Upload link drives UploadZone's file input rather than
  // duplicating one: two inputs would mean two accept-lists to keep in step.
  const uploadInputRef = React.useRef<HTMLInputElement>(null);
  /* Audit G3-064: a viewer sees Upload and Delete disabled with the reason
     (board 6289:148485), never hidden. */
  const write = useMediaWriteAccess();
  const [folderMenuOpen, setFolderMenuOpen] = React.useState(false);
  const [panelMenuOpen, setPanelMenuOpen] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [addFromOpen, setAddFromOpen] = React.useState(false);

  /* Clone 3584:45522 → 3585:23326 → 3585:23337. The rejected row's `Choose a
     smaller file…` picked a file: it waits in the confirm; Upload file drops
     the refused row and sends it; what lands is named in a banner at the top
     of the drawer until the next upload starts. */
  const [replacement, setReplacement] = React.useState<{ original: FailedUpload; file: File } | null>(null);
  const [replacementBanner, setReplacementBanner] = React.useState<MediaAsset | null>(null);
  const confirmReplacement = async () => {
    if (!replacement) return;
    const { original, file } = replacement;
    setReplacement(null);
    props.onDismissUpload?.(original.fileName);
    const [landed] = await props.onUpload([file]);
    if (landed.success && landed.asset) setReplacementBanner(landed.asset);
  };
  const uploadFromDrawer = (files: File[]) => {
    setReplacementBanner(null);
    return props.onUpload(files);
  };
  /* Edge `Manage in full library|CLIC|OVE>` — the fullpage, with this file
     selected. The shell's opener takes no argument, so the file travels
     through the engine's own selection and `LibraryManager` reads it on mount. */
  const manageInFullLibrary = (asset: MediaAsset) => {
    props.composer.media.selectAssets([asset.id]);
    setReplacementBanner(null);
    props.onOpenLibrary?.();
  };
  // "All" is the honest label for the whole library; a folder that has been
  // deleted while its id is still selected falls back to it rather than
  // rendering an empty scope name.
  const currentFolderName =
    (props.allFolders ?? []).find((f) => f.id === props.currentFolderId)?.name ?? "All";

  // Filter items by activeType + search query
  const filtered = React.useMemo(() => {
    let result = props.libraryItems;
    if (activeTypes.size) result = result.filter((i) => activeTypes.has(i.type as MediaBucket));
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }
    return result;
  }, [props.libraryItems, activeTypes, searchQuery]);

  return (
    <PanelFrame
      /* Board 144:2 gives the panel a --flowbite/gray/100 (`var(--bk-gray-100)`) edge, which
         the shipped panel did not draw at all — measured border-color came back
         #000000, the initial value. Set here rather than via PanelFrame's
         `bordered` prop: that prop paints gray-200, and a single screen board
         must not redefine a chrome-ui-wide primitive (CLAUDE.md). */
      className="sl-launcher tw:border tw:border-[var(--bk-gray-100)]"
      data-testid="media-panel"
    >
      {/* Board 4418:59771 — "Assets · N", the ⋯ panel menu (7077:79223) and
          close. The expand brackets are gone (G3-002): they opened the same
          full-page library as "Manage assets ›" below while reading as
          "widen this drawer". The ⋯ carries "Select assets…" (G3-011) — the
          visible door to bulk select; right-click on a card still enters it. */}
      <PanelFrame.Header
        title={`Assets · ${props.serverPage?.total ?? props.libraryItems.length}`}
        onClose={onClose}
        actions={
          <Popover
            open={panelMenuOpen}
            onClose={() => setPanelMenuOpen(false)}
            placement="bottom-end"
            label="Assets options"
            trigger={
              <IconButton
                label="Assets options"
                aria-haspopup="menu"
                aria-expanded={panelMenuOpen}
                data-testid="media-panel-menu"
                onClick={() => setPanelMenuOpen((v) => !v)}
              >
                ⋯
              </IconButton>
            }
          >
            <Menu label="Assets options" className={DRAWER_MENU}>
              <MenuItem
                data-testid="media-select-mode"
                onClick={() => {
                  setPanelMenuOpen(false);
                  if (!props.selectionMode) props.onToggleSelection?.();
                }}
              >
                Select assets…
              </MenuItem>
            </Menu>
          </Popover>
        }
      />

      {/* Board 4418:59771 — `Manage assets ›`, a full-width quiet button under
          the header: the drawer's one door to the full-page library. */}
      {props.onOpenLibrary ? (
        <div className="tw:px-4 tw:pb-2" data-testid="media-manage-assets-row">
          <Button
            type="button"
            size="xs"
            variant="secondary"
            className="tw:h-10 tw:w-full tw:gap-1 tw:rounded-lg tw:border-transparent tw:bg-[var(--bk-gray-50)] tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-100)]"
            data-testid="media-manage-assets"
            onClick={() => props.onOpenLibrary?.()}
          >
            Manage assets
            <ChevronRight size={12} aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      {/* Clone 3585:23337 — the replacement that landed: name, `Uploaded ·
          EXT · size · where it is`, and the door to its details. EXT is the
          picked file's (the library may hold it transcoded); size and place
          are the asset's. A file the mirror never took says so — "In site
          library" over a local-only asset would be the `uploaded ✓` toast's
          lie a second time. */}
      {replacementBanner ? (
        <div
          className="tw:flex tw:flex-col tw:gap-0.5 tw:px-4 tw:pb-2 tw:text-[13px] tw:leading-5"
          role="status"
          data-testid="media-replacement-banner"
        >
          {/* The name the LIBRARY prints — the pipeline transcodes rasters to
              WebP (code:auto-webp), so the file that landed is not the file
              that was picked; a banner reading "pasta-2-small.jpg · JPG" over a
              rail reading "pasta-2-small.webp" named two files (seen live). */}
          <span className="tw:truncate tw:text-[var(--bk-ink)]" data-testid="media-replacement-name">
            {displayNameFor(replacementBanner.name, replacementBanner.mimeType)}
          </span>
          <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid="media-replacement-meta">
            Uploaded · {fileExtensionLabel(displayNameFor(replacementBanner.name, replacementBanner.mimeType))} · {formatBytes(replacementBanner.size, 1)} ·{" "}
            {replacementBanner.localOnly ? "On this device only" : "In site library"}
          </span>
          <Button
            type="button"
            color="light"
            size="xs"
            variant="link"
            className="tw:min-h-6 tw:self-start tw:pl-3.5 tw:text-[13px] tw:leading-5 tw:font-normal tw:text-[var(--bk-ink)]"
            data-testid="media-replacement-manage"
            onClick={() => manageInFullLibrary(replacementBanner)}
          >
            Manage in full library
          </Button>
        </div>
      ) : null}


      {/* Search scope — board `145:2` → `Search scope` (1313:11), 22h under the
          field. Shown only while a query is running against a library that is
          NOT fully loaded, because that is the only case where the scope is a
          question: every filter in this drawer runs on the client over what has
          been pulled, so a search used to reach 200 of 412 assets and report
          "Nothing matches" about a file that exists. */}
      {props.serverPage && searchQuery.trim().length >= 2 && props.serverPage.total > props.serverPage.loaded ? (
        <div
          /* Boards 1313:11 (filtered) and 1314:20 (no-results) draw this band.
             They disagree about its size — 11/16 there, 13/20 here — and about
             its height, 43 against 51, so neither settles it and it keeps the
             11/16 caption scale the rest of the drawer's small text uses. They
             AGREE on two things the code had wrong: it is Inter, not mono, and
             the informative state is accent, not ink-muted. */
          className={`tw:flex tw:min-h-[22px] tw:items-center tw:px-4 tw:text-[11px] tw:font-medium tw:leading-4 ${props.searchState === "failed" ? "tw:text-[var(--bk-error-text)]" : "tw:text-[var(--bk-accent-text)]"}`}
          data-testid="media-search-scope"
          role="status"
        >
          {/* Each state says something the code can actually stand behind.
              "Searching all N" over a TRUNCATED search result would be the same
              overstatement this line exists to fix, one level down; and a failed
              leg shown as silence is the original false negative back again —
              "Nothing matches" for a file that is on the server. */}
          {props.searchState === "searching"
            ? `Searching all ${props.serverPage.total} items…`
            : props.searchState === "truncated"
              ? "First 200 matches — narrow the search to see more"
              : props.searchState === "failed"
                ? "Couldn't reach the rest of your library"
                : `Searching all ${props.serverPage.total} items`}
        </div>
      ) : null}

      {/* Board 4418:59771 / 7077:79171 — one "Filter ▾" button. Its popover
          holds TYPE (All · Images · Video · SVG · Icons, with counts) and
          FOLDER (scope + change…). It replaces the four type chips and the
          folder row (G3-005). TYPE is one-of, as drawn (a leading ✓ on the
          current row): picking a type replaces the filter, All clears it. */}
      <div className="tw:flex tw:h-11 tw:items-center tw:px-4" data-testid="media-filter-row">
        <Popover
          open={filterOpen}
          onClose={() => { setFilterOpen(false); setFolderMenuOpen(false); }}
          placement="bottom"
          label="Filter"
          trigger={
            <Button
              type="button"
              color="light"
              size="xs"
              className="tw:h-7 tw:rounded-sm tw:border-[var(--bk-border)] tw:px-2 tw:text-[12px] tw:font-medium tw:text-[var(--bk-ink)]"
              aria-haspopup="menu"
              aria-expanded={filterOpen}
              aria-label={activeTypes.size || props.currentFolderId ? "Filter (active)" : "Filter"}
              data-testid="media-filter"
              onClick={() => setFilterOpen((v) => !v)}
            >
              <span className="tw:flex tw:items-center">
                Filter
                <ChevronDown size={12} aria-hidden="true" />
              </span>
            </Button>
          }
        >
          <Menu label="Filter" className={DRAWER_MENU}>
            <DrawerMenuHeading>TYPE</DrawerMenuHeading>
            <MenuItem
              radio
              selected={activeTypes.size === 0}
              data-testid="media-type-all"
              onClick={() => activeTypes.forEach((t) => onToggleType(t))}
            >
              <FilterRowLabel label="All" count={props.loadError ? undefined : counts.all} />
            </MenuItem>
            {TYPE_ROWS.map((row) => {
              const isActive = activeTypes.has(row.key);
              const count = counts[row.key];
              /* A type at zero leads to "No assets matching this filter" —
                 disabled with the reason rather than hidden. An ACTIVE type
                 stays enabled even at zero, so it can always be cleared. */
              const isDead = !props.loadError && count === 0 && !isActive;
              return (
                <MenuItem
                  key={row.key}
                  radio
                  selected={isActive}
                  disabled={isDead}
                  title={isDead ? `No ${row.label} in this library yet` : undefined}
                  data-testid={`media-type-chip-${row.key}`}
                  onClick={() => {
                    activeTypes.forEach((t) => { if (t !== row.key) onToggleType(t); });
                    if (!isActive) onToggleType(row.key);
                  }}
                >
                  <FilterRowLabel label={row.label} count={props.loadError ? undefined : count} />
                </MenuItem>
              );
            })}
            <MenuSeparator />
            <DrawerMenuHeading>FOLDER</DrawerMenuHeading>
            <MenuItem
              data-testid="media-folder-scope"
              aria-expanded={folderMenuOpen}
              disabled={(props.allFolders?.length ?? 0) === 0}
              onClick={() => setFolderMenuOpen((v) => !v)}
            >
              <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-1.5">
                <Folder size={13} className="tw:flex-none tw:text-[var(--bk-ink-muted)]" aria-hidden="true" />
                <span className="tw:truncate">{currentFolderName}</span>
                <ChevronDown size={12} className="tw:flex-none tw:text-[var(--bk-ink-muted)]" aria-hidden="true" />
                <span className="tw:ml-auto tw:text-[11px] tw:text-[var(--bk-ink-muted)]">change…</span>
              </span>
            </MenuItem>
            {folderMenuOpen ? (
              <>
                <MenuItem
                  radio
                  selected={!props.currentFolderId}
                  onClick={() => { setFolderMenuOpen(false); props.onFolderChange?.(null); }}
                >
                  All
                </MenuItem>
                {flattenFolderTree(props.allFolders ?? []).map(({ folder, depth }) => (
                  <MenuItem
                    key={folder.id}
                    radio
                    selected={props.currentFolderId === folder.id}
                    onClick={() => { setFolderMenuOpen(false); props.onFolderChange?.(folder.id); }}
                  >
                    {" ".repeat(depth * 2)}{folder.name}
                  </MenuItem>
                ))}
              </>
            ) : null}
          </Menu>
        </Popover>
      </div>

      <div className="sl-grid-wrap tw:min-h-0 tw:flex-1 tw:overflow-y-auto" data-testid="media-grid-wrap">
        {props.loadError ? (
          /*
            Board `453:3952`. "Couldn't load your media." in error-text with
            two accent links under it. NOT the empty state: an empty library is
            a fact about the user's account, a failed read is a fact about this
            browser, and only one of them is worth a retry.
          */
          <div className="tw:h-35 tw:px-4 tw:pt-11 tw:text-center tw:text-[13px] tw:leading-5" data-testid="media-load-error" role="alert">
            {/* `tw:m-0` is load-bearing, not tidiness: chrome-reset.css resets
                form controls only, so the UA's 1em <p> margin pushed both rows
                13px down the band. The board puts the message at 44 and the
                links at 74; the shipped block had them at 57 and 90, and the
                harness could not see it — only the band's own height was
                joined. Measured 2026-09-08. */}
            <p className="tw:m-0 tw:text-[var(--bk-error-text)]">Couldn&apos;t load your media.</p>
            <p className="tw:mx-0 tw:mb-0 tw:mt-2.5 tw:flex tw:justify-center tw:gap-10">
              <Button
                type="button"
                color="light"
                size="xs"
                variant="link" className="tw:min-h-6 tw:font-normal"
                data-testid="media-load-retry"
                onClick={props.onRetryLoad}
              >
                Try again
              </Button>
              <Button
                type="button"
                color="light"
                size="xs"
                variant="link" className="tw:min-h-6 tw:font-normal"
                onClick={onOpenStock}
              >
                {/* Board 453:3955 — "Browse stock", the same words the footer
                    and the empty state use for the same destination. */}
                Browse stock
              </Button>
            </p>
          </div>
        ) : props.loading ? (
          /*
            Board `777:4139`. Six cells on the real grid's geometry, so the
            layout does not jump when the assets land. The label bars are
            deliberately uneven — a column of identical bars reads as a
            rendered UI that has gone wrong, not as one still arriving.
          */
          <div
            className="tw:grid tw:grid-cols-2 tw:justify-items-stretch tw:gap-4 tw:px-4 tw:py-3"
            data-testid="media-grid-skeleton"
            aria-busy="true"
            aria-label="Loading media"
          >
            {/* Board `777:4140`-`777:4157`: 96, 72, 110, 84, 100, 66. Utility
                classes rather than an inline width — these are six fixed
                values from the design, not a computed one. */}
            {["tw:w-24", "tw:w-18", "tw:w-[110px]", "tw:w-21", "tw:w-25", "tw:w-[66px]"].map((w, i) => (
              <span key={i} className="tw:flex tw:h-26 tw:w-full tw:flex-col tw:gap-1" data-testid={`media-skeleton-cell-${i}`}>
                <SkeletonBlock className="tw:h-19 tw:w-full tw:rounded-md" data-testid={`media-skeleton-thumb-${i}`} />
                <SkeletonBlock className={`tw:h-2.5 ${w}`} data-testid={`media-skeleton-bar-${i}`} />
              </span>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /*
            `libraryItems` arrives ALREADY filtered by useLibraryState, so
            testing its length answered "did this search match anything", not
            "does this user own anything" — and a search for a word no file
            carries rendered "No images or files yet." over a full library.
            `counts` is the library's own total (see useLibraryState), so it
            is the honest signal for an empty library.
          */
          counts.all === 0 ? (
            /* Board 145:406: one muted line, then accent text links — no filled
               CTA.

               The board drew Upload here, and it is gone: on the empty screen
               the drop zone sits directly below saying "Drag files or click to
               browse", and the footer carries Upload as well, so the same act
               had THREE affordances stacked in one column. The board describes
               this block, not the composition around it, and the footer is
               where Upload lives (the same move that put Stock there).

               Stock stays, because it is the one action the drop zone cannot
               perform — and it is worded the way the footer words it. */
            <div className="sl-empty tw:h-35 tw:px-4 tw:pt-11 tw:text-center tw:text-[13px] tw:leading-5" data-testid="media-empty">
              <p className="tw:m-0 tw:text-[var(--bk-ink-muted)]">No images or files yet.</p>
              <p className="tw:mx-0 tw:mb-0 tw:mt-2.5 tw:flex tw:justify-center tw:gap-10">
                <Button
                  type="button"
                  color="light"
                  size="xs"
                  variant="link" className="tw:min-h-6 tw:font-normal"
                  data-testid="media-empty-cta"
                  onClick={onOpenStock}
                >
                  Browse stock
                </Button>
              </p>
            </div>
          ) : (
            searchQuery.trim() ? (
              /* Board 782:4399 — a left-aligned state block on its own inset
                 (px-24, pt-36, pb-32, gap-10), not a list row on the grid's
                 px-16. `leading-[normal]` is the one thing NOT taken from it:
                 that is Figma's AUTO line height, and every other 13px line on
                 every Media board is 13/20. */
              <div className="tw:flex tw:flex-col tw:items-start tw:gap-2.5 tw:px-6 tw:pt-9 tw:pb-8 tw:text-left tw:text-[13px] tw:leading-5" data-testid="media-no-results" role="status">
                <p className="tw:m-0 tw:text-[var(--bk-ink-muted)]" data-testid="media-no-results-message">
                  Nothing matches {"\u2018"}{searchQuery.trim()}{"\u2019"}.
                </p>
                <Button
                  type="button"
                  color="light"
                  size="xs"
                  variant="link" className="tw:min-h-6 tw:font-normal"
                  data-testid="media-clear-search"
                  onClick={() => onSearchChange("")}
                >
                  Clear search
                </Button>
              </div>
            ) : (
              /* Pill-only zero \u2014 no board of its own; scope and filters stay
                 set, same rule as the search state.

                 The way OUT was missing. The search state one branch up has
                 offered "Clear search" all along; this one stated the dead end
                 and left the user to work out that the way back was a pill
                 above the grid. Same shape, same treatment. */
              <div className="sl-empty tw:px-4 tw:py-6" data-testid="media-no-results" role="status">
                <p className="sl-empty__body tw:text-[12px] tw:text-[var(--bk-ink-soft)]">No assets matching this filter.</p>
                <Button
                  type="button"
                  color="light"
                  size="xs"
                  variant="link" className="tw:min-h-6 tw:mt-1.5 tw:font-normal"
                  data-testid="media-clear-filter"
                  onClick={() => activeTypes.forEach((tKey) => onToggleType(tKey))}
                >
                  Clear filter
                </Button>
              </div>
            )
          )
        ) : (
          /* Two FRACTIONAL columns. These were two fixed 136px cells, which
             made 320 arithmetic rather than a constraint: 16+136+16+136+16.
             The drawer could not narrow without clipping a cell, and that
             number was then cited as the reason the drawer could not narrow —
             circular. Fractional tracks reflow, so the panel width is free
             (founder decision D2, 2026-09-01). */
          <div
            className="med-asset-grid tw:grid tw:grid-cols-2 tw:justify-items-stretch tw:gap-4 tw:px-4 tw:py-3"
            role="listbox"
            aria-label="Asset library"
            data-testid="media-grid"
          >
            {filtered.map((item) => (
              <AssetCell
                key={item.key}
                item={item}
                usageCount={props.usageMap.get(item.key) ?? 0}
                isSelected={props.selectedKeys?.has(item.key) ?? false}
                selectable={props.selectionMode}
                // While selecting, a click selects — inserting an asset the
                // user is in the middle of choosing among would be a surprise.
                onClick={props.selectionMode && props.onToggleSelect ? props.onToggleSelect : props.onInsert}
                onDoubleClick={
                  props.onOpenDetail ? (key) => {
                    const hit = filtered.find((i) => i.key === key);
                    if (hit) props.onOpenDetail?.(hit);
                  } : undefined
                }
                onContextMenu={
                  props.onEnterSelection
                    ? (e, key) => {
                        e.preventDefault();
                        props.onEnterSelection?.(key);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Board `144:2` → `Load more` (1311:11), 36h between the grid and the
            spacer. The server has always paged `media.listAssets`; nothing in
            the editor ever asked for page two, so a library past the page size
            showed its first page and said nothing — the grid, the picker and
            replace-across-site all read that same truncated set. The count is
            the honest half: it names what is on screen AND what exists. */}
        {props.serverPage && props.serverPage.total > props.serverPage.loaded ? (
          <div
            className="tw:flex tw:h-9 tw:items-center tw:justify-between tw:px-4 tw:text-[12px] tw:leading-4"
            data-testid="media-load-more-row"
          >
            {/* The PAGING position against the server's total. Not the filtered
                list — with a video pill on it would read "Showing 3 of 412",
                comparing two different questions. And not the local asset count
                either: a server-side search imports real assets without moving
                the cursor, so counting those climbed the footer toward the total
                while "Load more" still had the same page to fetch. */}
            <span className="tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:font-medium tw:tabular-nums tw:text-[var(--bk-ink-muted)]" data-testid="media-shown-count">
              Showing {props.serverPage.loaded} of {props.serverPage.total}
            </span>
            <Button
              type="button"
              color="light"
              size="xs"
              variant="link" className="tw:min-h-6 tw:font-normal"
              data-testid="media-load-more"
              disabled={props.loadingMore || !props.serverPage.nextCursor}
              onClick={() => void props.onLoadMore?.()}
            >
              {props.loadingMore ? "Loading…" : props.loadMoreError ? "Try again" : "Load more"}
            </Button>
          </div>
        ) : null}
      </div>

      {props.selectionMode ? (
        /* Board `145:347` — 44h on ink, white 12/18. It REPLACES the footer
           links rather than stacking above them: Upload and Stock add assets,
           and adding while choosing among what is already there is a different
           job. */
        <div
          className="tw:flex tw:h-11 tw:items-center tw:gap-6 tw:bg-[var(--bk-gray-900)] tw:px-4 tw:text-[12px] tw:leading-[18px] tw:text-white"
          data-testid="media-bulk-bar"
        >
          <span data-testid="media-bulk-count">{props.selectedKeys?.size ?? 0} selected</span>
          {/* Board 145:349 draws "Move to…" — the ellipsis promises a second
              step. That step used to be "open the whole library and find the
              picker there". Now it is the picker: the same folder list the
              context menu shows, from the same helper, so the two cannot drift. */}
          {props.onBulkMoveTo ? (
            <Popover
              open={bulkMoveOpen}
              onClose={() => setBulkMoveOpen(false)}
              label="Move selected files to folder"
              placement="top"
              trigger={
                <Button
                  type="button"
                  color="light"
                  size="xs"
                  variant="link" className="tw:min-h-6 tw:text-[length:var(--bk-text-12)] tw:text-white"
                  onClick={() => setBulkMoveOpen((v) => !v)}
                  disabled={!props.selectedKeys?.size}
                  aria-haspopup="menu"
                  aria-expanded={bulkMoveOpen}
                >
                  Move to…
                </Button>
              }
            >
              <Menu label="Folders">
                <MenuItem onClick={() => { setBulkMoveOpen(false); props.onBulkMoveTo?.(null); }}>(Root)</MenuItem>
                {flattenFolderTree(props.allFolders ?? []).map(({ folder, depth }) => (
                  <MenuItem
                    key={folder.id}
                    onClick={() => { setBulkMoveOpen(false); props.onBulkMoveTo?.(folder.id); }}
                  >
                    {"\u00a0".repeat(depth * 2)}{folder.name}
                  </MenuItem>
                ))}
              </Menu>
            </Popover>
          ) : (
            <Button
              type="button"
              color="light"
              size="xs"
              variant="link" className="tw:min-h-6 tw:text-[length:var(--bk-text-12)] tw:text-white"
              onClick={props.onBulkMove}
              disabled={!props.selectedKeys?.size}
            >
              Move to…
            </Button>
          )}
          {write.canWrite ? (
            <Button
              type="button"
              color="light"
              size="xs"
              variant="link" className="tw:min-h-6 tw:text-[length:var(--bk-text-12)] tw:text-white"
              data-testid="media-bulk-delete"
              onClick={props.onBulkDelete}
              disabled={!props.selectedKeys?.size}
            >
              Delete
            </Button>
          ) : (
            <Tooltip content={write.reason("delete")} placement="top">
              <Button
                type="button"
                color="light"
                size="xs"
                variant="link" className="tw:min-h-6 tw:text-[length:var(--bk-text-12)] tw:text-white tw:opacity-55"
                data-testid="media-bulk-delete"
                aria-disabled="true"
              >
                Delete
              </Button>
            </Tooltip>
          )}
          <Button
            type="button"
            color="light"
            size="xs"
            variant="link" className="tw:min-h-6 tw:text-[length:var(--bk-text-12)] tw:text-white tw:ml-auto"
            data-testid="media-bulk-done"
            onClick={props.onExitSelection}
          >
            Done
          </Button>
        </div>
      ) : null}
      <div className="sl-upload-footer" data-testid="media-footer-region" hidden={props.selectionMode}>
        {/* Strip first: the board puts the failure above the footer links
            (145:195 sits between the spacer and 145:192), because the thing
            that went wrong outranks the thing you might do next. */}
        <UploadZone
          compact
          inputRef={uploadInputRef}
          storage={props.storage}
          onUpload={(files) => void uploadFromDrawer(files)}
          onRetryUpload={props.onRetryUpload}
          onReplacementPicked={(original, file) => setReplacement({ original, file })}
          onOptimize={props.onOpenLibrary ? () => props.onOpenLibrary?.() : undefined}
          uploadQueue={props.uploadQueue}
          failedUploads={props.failedUploads}
          disabled={props.storage.used >= props.storage.total}
          viewOnlyReason={write.reason("upload")}
        />
        {/* Board 4418:59771 — one dark Upload button and its caret. The caret
            opens ADD FROM · Stock photos · Icons · Fonts (7077:79204); those
            three were a row of links under Upload (G3-020). The accepted
            kinds and the engine's limits (`MEDIA_SIZE_LIMITS_LABEL`) moved
            from a caption line onto Upload's tooltip. When storage is full
            the foot goes to bg-subtle (board 145:294). */}
        <div
          className={`tw:flex tw:items-center tw:gap-1 tw:px-4 tw:pt-2 tw:pb-10 ${props.storage.used >= props.storage.total ? "tw:bg-[var(--bk-bg-subtle)]" : ""}`}
          data-testid="media-footer"
        >
            <Button
              type="button"
              size="xs"
              className={`tw:h-7 tw:min-w-0 tw:flex-1 tw:gap-1.5 tw:rounded-md tw:border-0 tw:bg-[var(--bk-gray-900)] tw:text-[13px] tw:font-medium tw:text-white tw:enabled:hover:bg-[var(--bk-gray-800)] ${write.canWrite ? "" : "tw:opacity-55"}`}
              data-testid="media-upload-action"
              title={write.canWrite ? `Images, videos and fonts · ${MEDIA_SIZE_LIMITS_LABEL}` : write.reason("upload")}
              aria-disabled={write.canWrite ? undefined : "true"}
              disabled={write.canWrite && props.storage.used >= props.storage.total}
              onClick={write.canWrite ? () => uploadInputRef.current?.click() : undefined}
            >
              <span className="tw:flex tw:items-center tw:gap-1.5">
                <Upload size={14} aria-hidden="true" />
                Upload
              </span>
            </Button>
          <Popover
            open={addFromOpen}
            onClose={() => setAddFromOpen(false)}
            placement="top-end"
            label="Add from"
            trigger={
              <IconButton
                label="Add from"
                aria-haspopup="menu"
                aria-expanded={addFromOpen}
                data-testid="media-add-from"
                className="tw:h-7 tw:w-7 tw:rounded-md tw:bg-[var(--bk-gray-900)] tw:text-white tw:enabled:hover:bg-[var(--bk-gray-800)] tw:enabled:hover:text-white"
                onClick={() => setAddFromOpen((v) => !v)}
              >
                <ChevronDown size={14} aria-hidden="true" />
              </IconButton>
            }
          >
            <Menu label="Add from" className={DRAWER_MENU}>
              <DrawerMenuHeading>ADD FROM</DrawerMenuHeading>
              <MenuItem
                icon={<Cloud size={13} aria-hidden="true" />}
                data-testid="media-stock-action"
                onClick={() => { setAddFromOpen(false); onOpenStock(); }}
              >
                Stock photos
              </MenuItem>
              {props.onOpenIconPicker ? (
                <MenuItem
                  icon={<Shapes size={13} aria-hidden="true" />}
                  data-testid="media-icons-action"
                  onClick={() => { setAddFromOpen(false); props.onOpenIconPicker?.(); }}
                >
                  Icons
                </MenuItem>
              ) : null}
              {/* The Site fonts dialog (3686:42317), mounted once in the shell
                  and opened by the composer event every door emits. */}
              <MenuItem
                icon={<span className="tw:text-[11px] tw:font-semibold tw:leading-none">Aa</span>}
                data-testid="media-fonts-action"
                onClick={() => { setAddFromOpen(false); props.composer.emit("ui:site-fonts", {}); }}
              >
                Fonts
              </MenuItem>
            </Menu>
          </Popover>
        </div>
      </div>
      {replacement ? (
        <ReplacementUploadModal
          open
          original={replacement.original}
          file={replacement.file}
          onUpload={() => void confirmReplacement()}
          onCancel={() => setReplacement(null)}
        />
      ) : null}
    </PanelFrame>
  );
}
