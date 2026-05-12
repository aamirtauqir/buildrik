/**
 * ExpandedMediaPanel — 560px expanded media panel (§12 prototype-v3).
 *
 * Rendered by MediaTab when `state.panelExpanded === true`. Composes:
 *  - Header: title + EXPANDED badge + Compact / Maximize / Close
 *  - Folder rail (180px): smart folders + user folders from MediaManager
 *  - Library area: TypePills + LibraryView with sort/format/grid-size controls
 *
 * Auto-expands on upload-complete (driven by useMediaState). Collapse via
 * the Compact button (header) or by explicit `setPanelExpanded(false)`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/editor/shared/vibcoder/Button";
import type { Composer } from "../../../../../engine/Composer";
import type { MediaStateResult } from "../data/mediaTypes";
import type { MediaFolder } from "@shared/types/media";
import { TypePills } from "./TypePills";
import { LibraryView } from "./LibraryView";
import "../MediaTab.css";
import "./ExpandedMediaPanel.css";

export interface ExpandedMediaPanelProps {
  composer: Composer;
  state: MediaStateResult;
  onCompact(): void;
  onOpenLibrary(opts?: { searchQuery?: string; folderId?: string | null }): void;
  onClose?(): void;
}

export function ExpandedMediaPanel({
  composer,
  state,
  onCompact,
  onOpenLibrary,
  onClose,
}: ExpandedMediaPanelProps) {
  // Subscribe to folder list — keep it minimal; full FolderTree component
  // (used in fullpage LibraryManager) is too prop-heavy for this slim form.
  const [folders, setFolders] = React.useState<MediaFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const refresh = () => {
      try {
        setFolders(composer.media.getFolders(null) ?? []);
      } catch {
        setFolders([]);
      }
    };
    refresh();
    composer.media.on("media:folder:created", refresh);
    composer.media.on("media:folder:deleted", refresh);
    composer.media.on("media:folder:updated", refresh);
    return () => {
      composer.media.off("media:folder:created", refresh);
      composer.media.off("media:folder:deleted", refresh);
      composer.media.off("media:folder:updated", refresh);
    };
  }, [composer]);

  const totalCount = state.libraryItems.length;

  return (
    <div className="exp-panel">
      <header className="exp-panel__header">
        <div className="exp-panel__title-group">
          <h3 className="exp-panel__title">Media library</h3>
          <span className="exp-panel__badge">EXPANDED</span>
        </div>
        <div className="exp-panel__actions">
          <Button
            type="button"
            className="exp-panel__compact-btn"
            onClick={onCompact}
            title="Collapse to compact view"
            aria-label="Collapse panel"
          >
            <Minimize2 size={12} />
            Compact
          </Button>
          <Button
            type="button"
            className="exp-panel__icon-btn"
            onClick={() => onOpenLibrary()}
            title="Open full library (⌘⇧M)"
            aria-label="Open full library"
          >
            <Maximize2 size={14} />
          </Button>
          {onClose ? (
            <Button
              type="button"
              className="exp-panel__icon-btn"
              onClick={onClose}
              title="Close"
              aria-label="Close panel"
            >
              <X size={14} />
            </Button>
          ) : null}
        </div>
      </header>

      <div className="exp-panel__body">
        {/* Folder rail */}
        <nav className="exp-panel__folders" aria-label="Folders">
          <div className="exp-panel__folders-head">
            <span className="exp-panel__folders-label">Folders</span>
          </div>
          <div className="exp-panel__folder-list">
            <Button
              type="button"
              className={`exp-folder-item${currentFolderId === null ? " is-active" : ""}`}
              onClick={() => setCurrentFolderId(null)}
            >
              <span className="exp-folder-item__name">All assets</span>
              <span className="exp-folder-item__count">{totalCount}</span>
            </Button>
            {folders.map((f) => (
              <Button
                key={f.id}
                type="button"
                className={`exp-folder-item${currentFolderId === f.id ? " is-active" : ""}`}
                onClick={() => setCurrentFolderId(f.id)}
              >
                <span className="exp-folder-item__name">{f.name}</span>
              </Button>
            ))}
          </div>
        </nav>

        {/* Library area */}
        <div className="exp-panel__library">
          <TypePills
            activeType={state.activeType}
            counts={state.counts}
            discMode={false}
            onTypeChange={state.setType}
          />
          <LibraryView
            items={state.libraryItems}
            uploadQueue={state.uploadQueue}
            activeType={state.activeType}
            counts={state.counts}
            sort={state.sort}
            sortDir={state.sortDir}
            gridN={state.gridN}
            fmtFilter={state.fmtFilter}
            selMode={state.selMode}
            selectedKeys={state.selectedKeys}
            searchQuery={state.librarySearch}
            onSort={state.setSort}
            onGridN={state.setGridN}
            onFmt={state.setFmtFilter}
            onSelToggle={state.toggleSelMode}
            onSelect={state.toggleSelect}
            onSelectAll={state.selectAll}
            onRequestBulkDelete={state.requestBulkDelete}
            onRequestDelete={state.requestDelete}
            onInsert={state.insertToCanvas}
            onCtxMenu={state.openCtxMenu}
            onDetail={state.openDetail}
          />
        </div>
      </div>
    </div>
  );
}
