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
  FolderOpen,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import * as React from "react";
import type { LibraryItem, MediaFolder } from "../../sidebar/tabs/media/data/mediaTypes";
import { Button, TextField } from "@/editor/chrome-ui";
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
  libraryItems: LibraryItem[];
  setLibrarySearch(q: string): void;
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
    <div
      className={`mgr-node${active ? " active" : ""}${depthClass}${isDropTarget ? " dragover" : ""}`}
      onClick={onClick}
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

const FOLDER_COLORS = ["#F59E0B", "#10B981", "#EC4899", "var(--bk-ink-soft)", "#0EA5E9"];

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
  libraryItems,
  setLibrarySearch,
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
      return children.map((folder, i) => {
        const hasChildren = folders.some((f) => f.parentId === folder.id);
        const isCollapsed = collapsedFolders.has(folder.id);
        return (
          <React.Fragment key={folder.id}>
            <TreeNode
              icon={
                <div
                  className="mgr-folder-dot"
                  style={{ background: FOLDER_COLORS[i % FOLDER_COLORS.length] }}
                />
              }
              label={folder.name}
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
    [folders, currentFolderId, deleteFolder, setCurrentFolderId, setSmartFolder, collapsedFolders, toggleCollapsed, dropTargetId, handleAssetDragOver, handleAssetDragLeave, handleAssetDrop, onMoveAssetToFolder]
  );

  return (
    <div className="mgr-left">
      <div className="mgr-left-head">
        Folders
        <Button
          className="mgr-tree-add"
          title="New folder"
          onClick={() => setNewFolderName((v) => (v === null ? "" : null))}
          aria-expanded={newFolderName !== null}
        >
          <Plus size={12} />
        </Button>
      </div>

      {newFolderName !== null ? (
        <div className="mgr-tree-newfolder tw:px-2 tw:pb-1.5" data-testid="mgr-new-folder">
          <TextField
            autoFocus
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
        </div>
      ) : null}

      <div className="mgr-tree">
        {/* Smart folders (Bugs #6, #7 fix: actually filter) */}
        <TreeNode
          icon={<Clock size={14} style={{ color: /* @lint-hex-policy: "Recent" smart-folder sky-500 marker, off chrome palette */ "#0EA5E9" }} />}
          label="Recent"
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
          count={unusedCount}
          active={smartFolder === "unused"}
          onClick={() => {
            setSmartFolder("unused");
            setCurrentFolderId(null);
          }}
        />

        <hr className="mgr-tree-sep" />

        {/* All assets */}
        <TreeNode
          icon={<FolderOpen size={14} />}
          label="All assets"
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

        <hr className="mgr-tree-sep" />
        <div className="mgr-tree-section">My folders</div>

        {/* User folders (nested tree) */}
        {renderFolderTree(null, 0)}

        {folders.length === 0 && (
          <div style={{ padding: "12px 8px", fontSize: 11, color: "var(--bk-ink-disabled)" }}>
            No folders yet
          </div>
        )}

        {/* Tags section */}
        {allTags.length > 0 && (
          <>
            <hr className="mgr-tree-sep" />
            <div className="mgr-tree-section">Tags</div>
            {allTags.map((tag) => (
              <TreeNode
                key={`tag-${tag}`}
                icon={<div className="mgr-node-dot" style={{ background: /* @lint-hex-policy: tag-node sky-500 dot, off chrome palette */ "#0EA5E9" }} />}
                label={tag}
                count={libraryItems.filter((i) => i.altText?.includes(tag)).length}
                active={false}
                onClick={() => setLibrarySearch(tag)}
              />
            ))}
          </>
        )}

        <hr className="mgr-tree-sep" />
        <TreeNode
          icon={<Trash2 size={14} />}
          label="Trash"
          count={0}
          active={false}
          onClick={onTrashClick}
        />
      </div>
    </div>
  );
}
