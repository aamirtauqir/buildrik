/**
 * SlimLauncher — the Media drawer at 320. Figma `Media · grid` 144:2.
 *
 * `MediaTab` picks between three renderers; this is the one the board's Media
 * screens describe, which is why the redesign lands here rather than in the
 * fullpage manager.
 *
 * ORDER IS THE DESIGN. Header, search, folder row, type chips, grid, spacer,
 * footer. It used to be header, chips + "+ Stock" button, search, grid, a
 * drop-zone footer — so the first thing under the title was a filter for
 * assets the user had not found yet. Search leads now, and Stock moved to the
 * footer beside Upload, where the two ways of getting media in sit together.
 *
 * WHAT THE FOOTER KEPT. The board draws two text links. `UploadZone` is still
 * mounted under them because it owns the file input, the drag-and-drop target,
 * the quota bar and the persistent failed-upload list with retry — none of
 * which the board's mock shows and all of which are real behaviour. Deleting
 * the component to match a static frame would have removed working surfaces;
 * the links drive it instead.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelFrame, Button, IconButton, SkeletonBlock, TextField } from "@/editor/chrome-ui";
import { Search, Upload, Cloud, Folder, ChevronDown, LayoutGrid, Rows3, ArrowUpDown } from "lucide-react";
import type { Composer } from "@/engine/Composer";
import type { LibraryItem, MediaTypeFilter, TypeCounts, UploadProgress } from "../data/mediaTypes";
import { TypePills } from "./TypePills";
import { SelectionContextBar } from "./SelectionContextBar";
import { AssetCell } from "./AssetCell";
import { UploadZone } from "./UploadZone";
import "./SlimLauncher.css";

interface SlimLauncherProps {
  composer: Composer;
  libraryItems: LibraryItem[];
  activeType: MediaTypeFilter;
  counts: TypeCounts;
  searchQuery: string;
  storage: { used: number; total: number };
  uploadQueue: UploadProgress[];
  usageMap: Map<string, number>;
  appliedAssetKey?: string;
  onInsert(key: string): void;
  onTypeChange(type: MediaTypeFilter): void;
  onSearchChange(query: string): void;
  onUpload(files: File[]): void;
  /** Storage has not been read yet — draw the skeleton, not the empty state. */
  loading?: boolean;
  /** Storage could not be read. Distinct from empty: the assets still exist. */
  loadError?: string | null;
  onRetryLoad?(): void;
  /**
   * Retry a failed upload. The drawer had no way to reach it: `MediaTab` wired
   * `state.retryUpload` into the fullpage branch only, so the persistent
   * failed-upload row the board draws with a Retry link (145:195) rendered
   * here without one. Found by building that state as a probe case.
   */
  onRetryUpload?(fileName: string): void;
  onOpenStock(): void;
  onOpenLibrary?(opts?: { searchQuery?: string; folderId?: string | null }): void;
  onClose?(): void;
  selectionContext?: { elementId: string; label?: string } | null;
  onCancelSelection?(): void;
}

export function SlimLauncher(props: SlimLauncherProps) {
  const {
    activeType,
    counts,
    searchQuery,
    onTypeChange,
    onSearchChange,
    onOpenStock,
    onClose,
    selectionContext,
    onCancelSelection,
  } = props;

  // The footer's Upload link drives UploadZone's file input rather than
  // duplicating one: two inputs would mean two accept-lists to keep in step.
  const uploadInputRef = React.useRef<HTMLInputElement>(null);

  // Filter items by activeType + search query
  const filtered = React.useMemo(() => {
    let result = props.libraryItems;
    if (activeType !== "all") result = result.filter((i) => i.type === activeType);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }
    return result;
  }, [props.libraryItems, activeType, searchQuery]);

  return (
    <PanelFrame className="sl-launcher" data-testid="media-panel">
      {selectionContext ? (
        <SelectionContextBar
          label={selectionContext.label}
          onCancel={onCancelSelection ?? (() => {})}
        />
      ) : null}
      <PanelFrame.Header title="Media" onClose={onClose} />

      {/* Search — board `144:7`: 28h field inset 16, on bg-subtle. */}
      <div className="sl-search tw:flex tw:h-9 tw:items-center tw:px-4" data-testid="media-search">
        <span className="tw:relative tw:flex tw:w-full tw:items-center">
          <Search
            size={14}
            className="sl-search__icon tw:pointer-events-none tw:absolute tw:left-2.5 tw:text-gray-500"
            aria-hidden="true"
          />
          <TextField
            type="text"
            className="sl-search__input tw:h-7 tw:w-full tw:rounded-md tw:border-0 tw:bg-gray-100 tw:pl-8 tw:text-[13px] tw:text-gray-900 tw:placeholder:text-gray-500"
            placeholder="Search"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            aria-label="Search library"
          />
        </span>
      </div>

      {/*
        Folder row — board `144:10`. Scope on the left, view + sort on the
        right. The controls are rendered disabled rather than omitted: the
        board draws them, the drawer has one flat folder today, and a control
        that is present-but-disabled says "not here yet" where a missing one
        says nothing at all. They light up with the folder work (T12).
      */}
      <div className="tw:flex tw:h-8 tw:items-center tw:gap-2 tw:px-4" data-testid="media-folder-row">
        <span className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-1.5 tw:text-[13px] tw:text-gray-900">
          <Folder size={14} className="tw:text-gray-500" aria-hidden="true" />
          <span className="tw:truncate">All</span>
          <ChevronDown size={12} className="tw:text-gray-500" aria-hidden="true" />
        </span>
        <span className="tw:flex tw:items-center tw:gap-1 tw:text-gray-600" data-testid="media-view-controls">
          <IconButton label="Grid view" size="sm" pressed disabled>
            <LayoutGrid size={14} />
          </IconButton>
          <IconButton label="List view" size="sm" disabled>
            <Rows3 size={14} />
          </IconButton>
          <IconButton label="Sort" size="sm" disabled>
            <ArrowUpDown size={14} />
          </IconButton>
        </span>
      </div>

      <TypePills
        activeType={activeType}
        counts={counts}
        onTypeChange={onTypeChange}
      />

      <div className="sl-grid-wrap tw:min-h-0 tw:flex-1 tw:overflow-y-auto" data-testid="media-grid-wrap">
        {props.loadError ? (
          /*
            Board `453:3952`. "Couldn't load your media." in error-text with
            two accent links under it. NOT the empty state: an empty library is
            a fact about the user's account, a failed read is a fact about this
            browser, and only one of them is worth a retry.
          */
          <div className="tw:px-4 tw:pt-11 tw:text-center tw:text-[13px] tw:leading-5" data-testid="media-load-error" role="alert">
            <p className="tw:text-red-700">Couldn&apos;t load your media.</p>
            <p className="tw:mt-2 tw:flex tw:justify-center tw:gap-10">
              <Button
                type="button"
                color="light"
                size="xs"
                className="tw:min-h-6 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[13px] tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
                data-testid="media-load-retry"
                onClick={props.onRetryLoad}
              >
                Try again
              </Button>
              <Button
                type="button"
                color="light"
                size="xs"
                className="tw:min-h-6 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[13px] tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
                onClick={onOpenStock}
              >
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
            className="tw:grid tw:grid-cols-2 tw:justify-items-start tw:gap-4 tw:px-4 tw:py-3"
            data-testid="media-grid-skeleton"
            aria-busy="true"
            aria-label="Loading media"
          >
            {[96, 72, 110, 84, 100, 66].map((w, i) => (
              <span key={i} className="tw:flex tw:h-26 tw:w-34 tw:flex-col tw:gap-1">
                <SkeletonBlock className="tw:h-19 tw:w-34 tw:rounded-md" />
                <SkeletonBlock className="tw:h-2.5" style={{ width: w }} />
              </span>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          props.libraryItems.length === 0 ? (
            <div className="sl-empty tw:px-4 tw:py-6" data-testid="media-empty">
              <p className="sl-empty__title tw:text-[13px] tw:text-gray-900">Your library is empty</p>
              <p className="sl-empty__body tw:mt-1 tw:text-[12px] tw:text-gray-600">
                Upload your brand assets or browse free stock.
              </p>
              <Button
                type="button"
                size="xs"
                className="sl-empty__cta tw:mt-3"
                data-testid="media-empty-cta"
                onClick={onOpenStock}
              >
                Browse stock
              </Button>
            </div>
          ) : (
            <div className="sl-empty tw:px-4 tw:py-6" data-testid="media-no-results">
              <p className="sl-empty__body tw:text-[12px] tw:text-gray-600">No assets matching this filter.</p>
            </div>
          )
        ) : (
          /* Two 136px columns with 16px gutters: 16+136+16+136+16 = 320. */
          <div
            className="med-asset-grid tw:grid tw:grid-cols-2 tw:justify-items-start tw:gap-4 tw:px-4 tw:py-3"
            role="listbox"
            aria-label="Asset library"
            data-testid="media-grid"
          >
            {filtered.map((item) => (
              <AssetCell
                key={item.key}
                item={item}
                usageCount={props.usageMap.get(item.key) ?? 0}
                isApplied={props.appliedAssetKey === item.key}
                onClick={props.onInsert}
              />
            ))}
          </div>
        )}
      </div>

      <div className="sl-upload-footer" data-testid="media-footer-region">
        {/* Strip first: the board puts the failure above the footer links
            (145:195 sits between the spacer and 145:192), because the thing
            that went wrong outranks the thing you might do next. */}
        <UploadZone
          compact
          inputRef={uploadInputRef}
          storage={props.storage}
          onUpload={props.onUpload}
          onRetryUpload={props.onRetryUpload}
          uploadQueue={props.uploadQueue}
          disabled={props.storage.used >= props.storage.total}
        />
        {/* Board `144:46` — two accent text links, 44h row. */}
        <div
          className="tw:flex tw:h-11 tw:items-center tw:gap-6 tw:px-4 tw:text-[13px] tw:leading-5 tw:text-blue-700"
          data-testid="media-footer"
        >
          <Button
            type="button"
            color="light"
            size="xs"
            className="tw:min-h-6 tw:gap-1.5 tw:border-0 tw:bg-transparent tw:px-0 tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
            data-testid="media-upload-action"
            onClick={() => uploadInputRef.current?.click()}
          >
            <Upload size={14} aria-hidden="true" />
            Upload
          </Button>
          <Button
            type="button"
            color="light"
            size="xs"
            className="tw:min-h-6 tw:gap-1.5 tw:border-0 tw:bg-transparent tw:px-0 tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
            data-testid="media-stock-action"
            onClick={onOpenStock}
          >
            <Cloud size={14} aria-hidden="true" />
            Stock
          </Button>
        </div>
      </div>
    </PanelFrame>
  );
}
