/**
 * FolderTree — D5 Stage 1 extraction (audit-remediation 2026-05-08).
 *
 * The LEFT-rail folder navigation lifted out of LibraryManager. Owns
 * its own collapse/expand state (`collapsedFolders`) since that's
 * purely an in-tree UI concern. `smartFolder` lives on the orchestrator
 * because it gates the asset grid's `visibleItems` filter as well.
 *
 * Pre-extraction: lines 257-294 (renderFolderTree + toggleCollapsed)
 * + lines 355-445 (LEFT JSX) + lines 1037-1084 (TreeNode subcomponent)
 * of LibraryManager.tsx. Net source dropped: ~145 LOC from the
 * orchestrator.
 *
 * @license BSD-3-Clause
 */

import {
  Clock,
  CheckCircle,
  MinusCircle,
  Folder,
  FolderOpen,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import * as React from "react";
import type { MediaFolder } from "../../sidebar/tabs/media/data/mediaTypes";
import { Button, TextField } from "@/editor/chrome-ui";
/* `.mgr-*` lives in LibraryManager.css, which only LibraryManager imported — so
   this rail drew as unstyled 16px rows anywhere it was mounted on its own (a
   probe, a test, board 1205:4829's own measurement, which read every padding
   and gap as 0). Same rule StorageQuotaBar's header states after the same
   defect: a component that cannot be mounted alone cannot be measured alone. */
import "../LibraryManager.css";
// ─── Types ────────────────────────────────────────────────────────────────

export type SmartFolder = null | "recent" | "in-use" | "unused";

export interface TypeCounts {
  all: number;
  img: number;
  vid: number;
  ico: number;
  fnt: number;
}

interface TreeNodeProps {
  icon: React.ReactNode;
  label: string;
  /** Conformance anchor — board 1205:4829 measures these rows individually. */
  testId?: string;
  count?: number;
  active: boolean;
  expandable?: boolean;
  expanded?: boolean;
  depth?: number;
  onClick: () => void;
  onToggleExpand?: () => void;
  onDelete?: () => void;
  /** Drop target: assets dragged from the grid land in this folder. */
  dropFolderId?: string | null;
  isDropTarget?: boolean;
  onAssetDragOver?: (e: React.DragEvent<HTMLElement>, id: string | null) => void;
  onAssetDragLeave?: (id: string | null) => void;
  onAssetDrop?: (e: React.DragEvent<HTMLElement>, id: string | null) => void;
}

export interface FolderTreeProps {
  folders: MediaFolder[];
  currentFolderId: string | null;
  setCurrentFolderId(id: string | null): void;
  counts: TypeCounts;
  smartFolder: SmartFolder;
  setSmartFolder(sf: SmartFolder): void;
  recentCount: number;
  inUseCount: number;
  unusedCount: number;
  allTags: string[];
  setLibrarySearch(q: string): void;
  /** Clone 3698:20337 — each folder row prints its own asset count. */
  folderCounts: ReadonlyMap<string, number>;
  createFolder(name: string): Promise<void>;
  deleteFolder(id: string): Promise<void>;
  /** Trash placeholder — orchestrator wires this to a toast. */
  onTrashClick(): void;
  /**
   * Drag an asset from the grid onto a folder row to move it. Ported from
   * ExpandedMediaPanel when that surface was retired — the fullpage manager
   * had no drop targets at all, so a straight deletion would have taken
   * drag-to-folder with it.
   */
  onMoveAssetToFolder?(assetKey: string, folderId: string | null): void;
}

// ─── TreeNode (leaf, internal) ────────────────────────────────────────────

function TreeNode({
  icon,
  label,
  testId,
  count,
  active,
  expandable,
  expanded = true,
  depth = 0,
  onClick,
  onToggleExpand,
  onDelete,
  dropFolderId,
  isDropTarget = false,
  onAssetDragOver,
  onAssetDragLeave,
  onAssetDrop,
}: TreeNodeProps) {
  const depthClass = depth === 1 ? " depth-1" : depth === 2 ? " depth-2" : "";
  const droppable = onAssetDrop !== undefined;
  return (
    /* Every row in this rail — the smart folders, Trash, and each user folder —
       carried an onClick on a bare div, so none of them was reachable by Tab or
       actionable by Enter. Gate 24 owns native elements in chrome, so the row
       stays a div and gets the semantics instead of becoming a <button>. */
    <div
      className={`mgr-node${active ? " active" : ""}${depthClass}${isDropTarget ? " dragover" : ""}`}
      data-testid={testId}
      role="button"
      tabIndex={0}
      aria-current={active ? "true" : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        // Space scrolls the rail otherwise, and the chevron button inside this
        // row handles its own keys — don't fire the row for those.
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        onClick?.();
      }}
      onDragOver={droppable ? (e) => onAssetDragOver?.(e, dropFolderId ?? null) : undefined}
      onDragLeave={droppable ? () => onAssetDragLeave?.(dropFolderId ?? null) : undefined}
      onDrop={droppable ? (e) => onAssetDrop?.(e, dropFolderId ?? null) : undefined}
    >
      {expandable ? (
        <Button
          className="mgr-chev-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </Button>
      ) : (
        <span className="mgr-chev hidden" style={{ width: 12, height: 12 }} />
      )}
      {icon}
      <span className="mgr-node-name">{label}</span>
      {count !== undefined && <span className="mgr-node-count">{count}</span>}
      {onDelete && (
        <Button
          className="mgr-node-del"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete folder"
        >
          <Trash2 size={11} />
        </Button>
      )}
    </div>
  );
}

// ─── FolderTree (LEFT panel) ──────────────────────────────────────────────

export function FolderTree({
  folders,
  currentFolderId,
  setCurrentFolderId,
  counts,
  smartFolder,
  setSmartFolder,
  recentCount,
  inUseCount,
  unusedCount,
  allTags,
  setLibrarySearch,
  folderCounts,
  createFolder,
  deleteFolder,
  onTrashClick,
  onMoveAssetToFolder,
}: FolderTreeProps) {
  const [collapsedFolders, setCollapsedFolders] = React.useState<Set<string>>(new Set());

  const toggleCollapsed = React.useCallback((folderId: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  // Recursive folder tree renderer (Bug #8 fix: expand/collapse).
  // Drop-target state for asset→folder drags (ported with the behaviour).
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null);
  /*
    Naming a folder happens IN the tree, where the folder will appear. It used
    to be a native prompt() — an OS dialog dropped into a designed product:
    unstyleable, unable to say why a name was refused, and a hard stop for
    anything driving the page.
  */
  const [newFolderName, setNewFolderName] = React.useState<string | null>(null);
  const readDraggedAssetKey = (e: React.DragEvent<HTMLElement>): string =>
    e.dataTransfer.getData("application/x-buildrik-media-asset-key") ||
    e.dataTransfer.getData("text/plain") ||
    "";
  const handleAssetDragOver = React.useCallback(
    (e: React.DragEvent<HTMLElement>, id: string | null) => {
      if (!onMoveAssetToFolder) return;
      // preventDefault is required for the drop event to fire at all.
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
      const marker = id ?? "__root__";
      setDropTargetId((prev) => (prev === marker ? prev : marker));
    },
    [onMoveAssetToFolder],
  );
  const handleAssetDragLeave = React.useCallback((id: string | null) => {
    const marker = id ?? "__root__";
    setDropTargetId((prev) => (prev === marker ? null : prev));
  }, []);
  const handleAssetDrop = React.useCallback(
    (e: React.DragEvent<HTMLElement>, folderId: string | null) => {
      e.preventDefault();
      e.stopPropagation();
      const assetKey = readDraggedAssetKey(e);
      setDropTargetId(null);
      if (assetKey) onMoveAssetToFolder?.(assetKey, folderId);
    },
    [onMoveAssetToFolder],
  );
  const dropProps = onMoveAssetToFolder
    ? {
        onAssetDragOver: handleAssetDragOver,
        onAssetDragLeave: handleAssetDragLeave,
        onAssetDrop: handleAssetDrop,
      }
    : {};

  const renderFolderTree = React.useCallback(
    (parentId: string | null, depth: number): React.ReactNode => {
      const children = folders.filter((f) => f.parentId === parentId);
      if (children.length === 0) return null;
      return children.map((folder) => {
        const hasChildren = folders.some((f) => f.parentId === folder.id);
        const isCollapsed = collapsedFolders.has(folder.id);
        return (
          <React.Fragment key={folder.id}>
            {/* Clone 3698:20337 — a folder glyph and the folder's own count
                ("Products 8"). The 10px swatch this replaces cycled five hexes
                no board names. A folder the map does not know holds nothing,
                so it reads 0 (3700:20353), not blank. */}
            <TreeNode
              icon={<Folder size={14} className="mgr-node-ico" />}
              label={folder.name}
              testId={`mgr-row-folder-${folder.id}`}
              count={folderCounts.get(folder.id) ?? 0}
              active={currentFolderId === folder.id}
              expandable={hasChildren}
              expanded={!isCollapsed}
              depth={depth}
              onClick={() => {
                setSmartFolder(null);
                setCurrentFolderId(folder.id);
              }}
              onToggleExpand={hasChildren ? () => toggleCollapsed(folder.id) : undefined}
              onDelete={() => deleteFolder(folder.id)}
              dropFolderId={folder.id}
              isDropTarget={dropTargetId === folder.id}
              {...dropProps}
            />
            {!isCollapsed && renderFolderTree(folder.id, depth + 1)}
          </React.Fragment>
        );
      });
    },
    [folders, folderCounts, currentFolderId, deleteFolder, setCurrentFolderId, setSmartFolder, collapsedFolders, toggleCollapsed, dropTargetId, handleAssetDragOver, handleAssetDragLeave, handleAssetDrop, onMoveAssetToFolder]
  );

  return (
    /* Board 1160:16/27/43 — the rail is three NAMED groups (SMART, FOLDERS,
       TAGS) separated by 10-high gaps, with Trash at the foot. It shipped as
       one "Folders" head over four hairline-separated blocks, which named the
       whole rail after one of its groups and gave the smart folders no name at
       all. */
    <div className="mgr-left" data-testid="mgr-folders">
      <div className="mgr-tree">
        <div className="mgr-tree-section" data-testid="mgr-section-smart">Smart</div>
        {/* Smart folders (Bugs #6, #7 fix: actually filter) */}
        <TreeNode
          icon={<Clock size={14} style={{ color: /* @lint-hex-policy: "Recent" smart-folder sky-500 marker, off chrome palette */ "#0EA5E9" }} />}
          label="Recent"
          testId="mgr-row-recent"
          count={recentCount}
          active={smartFolder === "recent"}
          onClick={() => {
            setSmartFolder("recent");
            setCurrentFolderId(null);
          }}
        />
        <TreeNode
          icon={<CheckCircle size={14} style={{ color: "var(--bk-success)" }} />}
          label="In use"
          testId="mgr-row-in-use"
          count={inUseCount}
          active={smartFolder === "in-use"}
          onClick={() => {
            setSmartFolder("in-use");
            setCurrentFolderId(null);
          }}
        />
        <TreeNode
          icon={<MinusCircle size={14} style={{ color: "var(--bk-ink-disabled)" }} />}
          label="Unused"
          testId="mgr-row-unused"
          count={unusedCount}
          active={smartFolder === "unused"}
          onClick={() => {
            setSmartFolder("unused");
            setCurrentFolderId(null);
          }}
        />

        <div className="mgr-tree-gap" data-testid="mgr-tree-gap-1" />
        <div className="mgr-tree-section" data-testid="mgr-section-folders">Folders</div>

        {/* All assets */}
        <TreeNode
          icon={<FolderOpen size={14} />}
          label="All assets"
          testId="mgr-row-all-assets"
          count={counts.all}
          active={!currentFolderId && !smartFolder}
          onClick={() => {
            setSmartFolder(null);
            setCurrentFolderId(null);
          }}
          dropFolderId={null}
          isDropTarget={dropTargetId === "__root__"}
          {...dropProps}
        />

        {/* User folders (nested tree) */}
        {/* Board 1205:4849 / 1205:4853 draw user folders inset 16, one level
            under `🏠 All assets` — they hang off it, they are not its peers. */}
        {renderFolderTree(null, 1)}

        {/*
          Board 1205:4829 — the name is typed at the bottom of My folders,
          where the folder will land, with the two keys spelled out. It
          replaced a native prompt(), which could not say any of this.

          Board 1163:13695's row/＋ New folder (12/400 ink-soft, 8/6 padding,
          r6) is a row IN the list, right after the last folder — not the
          18x18 icon-only button that used to sit in the "Folders" header.
          `.mgr-node`'s own padding/radius/font are that exact spec, so the
          trigger reuses it rather than carrying a second copy.
        */}
        {newFolderName === null ? (
          <Button
            className="mgr-node"
            title="New folder"
            aria-label="New folder"
            data-testid="mgr-new-folder-open"
            onClick={() => setNewFolderName("")}
          >
            {"＋  New folder"}
          </Button>
        ) : null}

        {newFolderName !== null ? (
          <div className="mgr-tree-newfolder tw:flex tw:flex-col tw:gap-1 tw:px-2 tw:py-1" data-testid="mgr-new-folder">
            <TextField
              autoFocus
              className="tw:h-[var(--bk-size-row-dense)] tw:rounded-md tw:px-[var(--bk-space-8)] tw:text-[length:var(--bk-text-12)]"
              value={newFolderName}
              placeholder="Folder name"
              aria-label="New folder name"
              data-testid="mgr-new-folder-input"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
              onBlur={() => setNewFolderName(null)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter" && newFolderName.trim()) {
                  createFolder(newFolderName.trim());
                  setNewFolderName(null);
                } else if (e.key === "Escape") {
                  e.stopPropagation();
                  setNewFolderName(null);
                }
              }}
            />
            <p className="tw:m-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid="mgr-new-folder-hint">
              Enter to create · Esc to cancel
            </p>
          </div>
        ) : null}

        {/* Not while one is being named — "No folders yet" under a folder the
            user is in the middle of creating contradicts what they are doing. */}
        {folders.length === 0 && newFolderName === null && (
          <div style={{ padding: "12px 8px", fontSize: 11, color: "var(--bk-ink-disabled)" }}>
            No folders yet
          </div>
        )}

        {/* Tags section */}
        {allTags.length > 0 && (
          <>
            <div className="mgr-tree-gap" data-testid="mgr-tree-gap-2" />
            <div className="mgr-tree-section" data-testid="mgr-section-tags">Tags</div>
            {/* 1160:44 — tags are PILLS on a 6 gap, not another column of
                rows with counts. A tag is a filter you scan sideways; giving
                it the same row shape as a folder said it was a place. */}
            <div className="mgr-tags" role="group" aria-label="Filter by tag" data-testid="mgr-tags">
              {allTags.map((tag) => (
                <Button
                  key={`tag-${tag}`}
                  className="mgr-tag"
                  data-testid={`mgr-tag-${tag}`}
                  onClick={() => setLibrarySearch(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </>
        )}

        <div className="mgr-tree-gap" data-testid="mgr-tree-gap-3" />
        <TreeNode
          icon={<Trash2 size={14} />}
          label="Trash"
          testId="mgr-row-trash"
          count={0}
          active={false}
          onClick={onTrashClick}
        />
      </div>
    </div>
  );
}
