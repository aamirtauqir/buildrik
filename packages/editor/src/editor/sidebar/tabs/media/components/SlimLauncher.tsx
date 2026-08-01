/**
 * SlimLauncher — §10 default 320px experience.
 *
 * Phase 1 Task 11 — header zone rewrite: panel header + TypePills row +
 * "+ Stock" primary button + real search input. Grid + UploadZone land
 * in Phase 1 Tasks 12-13.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelFrame } from "@/editor/chrome-ui";
import { Search } from "lucide-react";
import type { Composer } from "@/engine/Composer";
import type { LibraryItem, MediaTypeFilter, TypeCounts, UploadProgress } from "../data/mediaTypes";
import { TypePills } from "./TypePills";
import { SelectionContextBar } from "./SelectionContextBar";
import { AssetCell } from "./AssetCell";
import { UploadZone } from "./UploadZone";
import "./SlimLauncher.css";
import { Button } from "@/editor/chrome-ui";
import { TextField } from "@/editor/chrome-ui";

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
    <PanelFrame className="sl-launcher">
      {selectionContext ? (
        <SelectionContextBar
          label={selectionContext.label}
          onCancel={onCancelSelection ?? (() => {})}
        />
      ) : null}
      <PanelFrame.Header title="Media" onClose={onClose} />
      <div className="sl-controls">
        <TypePills
          activeType={activeType}
          counts={counts}
          onTypeChange={onTypeChange}
        />
        <Button
          type="button"
          className="sl-stock-btn"
          onClick={onOpenStock}
        >
          + Stock
        </Button>
      </div>
      <div className="sl-search">
        <Search size={14} className="sl-search__icon" aria-hidden="true" />
        <TextField
          type="text"
          className="sl-search__input"
          placeholder="Search library…"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          aria-label="Search library"
        />
      </div>
      <div className="sl-grid-wrap">
        {filtered.length === 0 ? (
          props.libraryItems.length === 0 ? (
            <div className="sl-empty">
              <p className="sl-empty__title">Your library is empty</p>
              <p className="sl-empty__body">
                Upload your brand assets or browse free stock.
              </p>
              <Button
                type="button"
                className="sl-empty__cta"
                onClick={onOpenStock}
              >
                Browse stock
              </Button>
            </div>
          ) : (
            <div className="sl-empty">
              <p className="sl-empty__body">No assets matching this filter.</p>
            </div>
          )
        ) : (
          <div className="med-asset-grid" role="listbox" aria-label="Asset library">
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
      <div className="sl-upload-footer">
        <UploadZone
          storage={props.storage}
          onUpload={props.onUpload}
          uploadQueue={props.uploadQueue}
          disabled={props.storage.used >= props.storage.total}
        />
      </div>
    </PanelFrame>
  );
}
