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
import { X, Search } from "lucide-react";
import { Button } from "@/editor/shared/vibcoder/Button";
import { Input } from "@/editor/shared/vibcoder/Input";
import type { Composer } from "@/engine/Composer";
import type { LibraryItem, MediaTypeFilter, TypeCounts } from "../data/mediaTypes";
import { TypePills } from "./TypePills";
import { SelectionContextBar } from "./SelectionContextBar";
import "./SlimLauncher.css";

interface SlimLauncherProps {
  composer: Composer;
  libraryItems: LibraryItem[];
  activeType: MediaTypeFilter;
  counts: TypeCounts;
  searchQuery: string;
  storage: { used: number; total: number };
  uploadQueue: unknown[];
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

  return (
    <div className="sl-launcher">
      {selectionContext ? (
        <SelectionContextBar
          label={selectionContext.label}
          onCancel={onCancelSelection ?? (() => {})}
        />
      ) : null}
      <header className="sl-header">
        <h3 className="sl-title">Media</h3>
        <div className="sl-header-actions">
          {onClose ? (
            <Button
              type="button"
              className="sl-icon-btn"
              onClick={onClose}
              aria-label="Close panel"
            >
              <X size={16} />
            </Button>
          ) : null}
        </div>
      </header>
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
        <Input
          type="text"
          className="sl-search__input"
          placeholder="Search library…"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          aria-label="Search library"
        />
      </div>
      {/* Grid + UploadZone in Tasks 12-13 */}
    </div>
  );
}
