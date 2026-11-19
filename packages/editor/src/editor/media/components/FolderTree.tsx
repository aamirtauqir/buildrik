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

import { Trash2, ChevronDown, ChevronRight } from "lucide-react";
import * as React from "react";
import type { MediaBucket, MediaFolder, MediaTypeFilter } from "@/editor/sidebar/tabs/media/data/mediaTypes";
import { useMediaWriteAccess } from "@/editor/sidebar/tabs/media/hooks/useMediaWriteAccess";
import { Button, Tooltip } from "@/editor/chrome-ui";
/* `.mgr-*` lives in LibraryManager.css, which only LibraryManager imported — so
   this rail drew as unstyled 16px rows anywhere it was mounted on its own (a
   probe, a test, board 1205:4829's own measurement, which read every padding
   and gap as 0). Same rule StorageQuotaBar's header states after the same
   defect: a component that cannot be mounted alone cannot be measured alone. */
import "../LibraryManager.css";
// ─── Types ────────────────────────────────────────────────────────────────

export type SmartFolder = null | "recent" | "in-use" | "unused";

/** 2L9 B6-A01 (199:37199) — the rail's Fonts row is the type filter narrowed
 *  to font files with no smart folder and no folder as the scope. The rail's
 *  selected row and the page title both read it. */
export function isFontsScope(
  smartFolder: SmartFolder,
  currentFolderId: string | null,
  activeTypes: ReadonlySet<MediaBucket>,
): boolean {
  return !smartFolder && !currentFolderId && activeTypes.size === 1 && activeTypes.has("fnt");
}

interface TreeNodeProps {
  label: string;
  /** Conformance anchor — board 1205:4829 measures these rows individually. */
  testId?: string;
  /** Extra row class (the accent "+ New folder" row). */
  className?: string;
  active: boolean;
  expandable?: boolean;
  expanded?: boolean;
  depth?: number;
  onClick: () => void;
  onToggleExpand?: () => void;
  onDelete?: () => void;
  /** Audit G3-064: the row's OWN action is denied to this member (the
   *  New-folder door) — `aria-disabled`, click and Enter swallowed, the
   *  reason on the caller's tooltip. Never hidden. */
  viewOnlyReason?: string;
  /** Same, for the row's trash: it stays on show, muted, with this reason. */
  deleteViewOnlyReason?: string;
  /** Drop target: assets dragged from the grid land in this folder. */
  dropFolderId?: string | null;
  /** The pointer is over THIS row with an asset. */
  isDropTarget?: boolean;
  /** An asset is in flight somewhere — every droppable row is outlined. */
  dragActive?: boolean;
  onAssetDragOver?: (e: React.DragEvent<HTMLElement>, id: string | null) => void;
  onAssetDragLeave?: (id: string | null) => void;
  onAssetDrop?: (e: React.DragEvent<HTMLElement>, id: string | null) => void;
}

export interface FolderTreeProps {
  folders: MediaFolder[];
  currentFolderId: string | null;
  setCurrentFolderId(id: string | null): void;
  smartFolder: SmartFolder;
  setSmartFolder(sf: SmartFolder): void;
  /** The library's type filter — the Fonts row scopes through it, and reads
   *  it to know whether it is the selected row. */
  activeTypes: ReadonlySet<MediaBucket>;
  setType(t: MediaTypeFilter): void;
  /** Clone 3700:20347 — `row/＋ New folder` opens the orchestrator's modal. */
  onNewFolder(): void;
  deleteFolder(id: string): Promise<void>;
  /**
   * Drag an asset from the grid onto a folder row to move it. Ported from
   * ExpandedMediaPanel when that surface was retired — the fullpage manager
   * had no drop targets at all, so a straight deletion would have taken
   * drag-to-folder with it.
   */
  onMoveAssetToFolder?(assetKey: string, folderId: string | null): void;
  /** Clone 4215:26635 — while an asset is in flight every folder row (All
   *  assets and each user folder) is outlined as a place it can land. */
  assetDragActive?: boolean;
}

// ─── TreeNode (leaf, internal) ────────────────────────────────────────────

function TreeNode({
  label,
  testId,
  className,
  active,
  expandable,
  expanded = true,
  depth = 0,
  onClick,
  onToggleExpand,
  onDelete,
  viewOnlyReason,
  deleteViewOnlyReason,
  dropFolderId,
  isDropTarget = false,
  dragActive = false,
  onAssetDragOver,
  onAssetDragLeave,
  onAssetDrop,
}: TreeNodeProps) {
  const depthClass = depth === 1 ? " depth-1" : depth === 2 ? " depth-2" : "";
  const droppable = onAssetDrop !== undefined;
  const isTarget = droppable && dragActive;
  /* Clone 4215:26635 — while an asset is in flight every droppable row is
     outlined dashed as a place it can land; the one under the pointer keeps
     the `dragover` tint. Outline follows the row's radius and adds no box. */
  const dropClass = `${
    isTarget ? " tw:outline-1 tw:outline-dashed tw:-outline-offset-1 tw:outline-[var(--bk-accent)]" : ""
  }${isDropTarget ? " dragover" : ""}`;
  return (
    /* Every row in this rail — the smart folders, Trash, and each user folder —
       carried an onClick on a bare div, so none of them was reachable by Tab or
       actionable by Enter. Gate 24 owns native elements in chrome, so the row
       stays a div and gets the semantics instead of becoming a <button>. */
    <div
      className={`mgr-node${active ? " active" : ""}${depthClass}${dropClass}${className ? ` ${className}` : ""}`}
      data-testid={testId}
      data-drop-target={isTarget || undefined}
      role="button"
      tabIndex={0}
      aria-current={active ? "true" : undefined}
      aria-disabled={viewOnlyReason ? true : undefined}
      onClick={viewOnlyReason ? undefined : onClick}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        // Space scrolls the rail otherwise, and the chevron button inside this
        // row handles its own keys — don't fire the row for those.
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        if (viewOnlyReason) return;
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
      <span className="mgr-node-name">{label}</span>
      {onDelete && !deleteViewOnlyReason && (
        <Button
          className="mgr-node-del"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete folder"
        >
          <Trash2 size={12} />
        </Button>
      )}
      {onDelete && deleteViewOnlyReason && (
        <Tooltip content={deleteViewOnlyReason} placement="right">
          <Button
            className="mgr-node-del mgr-node-del--view-only"
            aria-label="Delete folder"
            aria-disabled="true"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 size={12} />
          </Button>
        </Tooltip>
      )}
    </div>
  );
}

// ─── FolderTree (LEFT panel) ──────────────────────────────────────────────

export function FolderTree({
  folders,
  currentFolderId,
  setCurrentFolderId,
  smartFolder,
  setSmartFolder,
  activeTypes,
  setType,
  onNewFolder,
  deleteFolder,
  onMoveAssetToFolder,
  assetDragActive = false,
}: FolderTreeProps) {
  const [collapsedFolders, setCollapsedFolders] = React.useState<Set<string>>(new Set());
  /* Audit G3-064: viewers see New folder and each folder's trash disabled
     with the reason (board 6289:148485 pattern). */
  const write = useMediaWriteAccess();
  const fontsActive = isFontsScope(smartFolder, currentFolderId, activeTypes);

  /* Every scope row but Fonts. Leaving the Fonts scope through one of them
     clears the type filter too, or "All assets" would go on showing fonts;
     otherwise the type filter is left as it is. */
  const pickScope = React.useCallback(
    (sf: SmartFolder, folderId: string | null) => {
      setSmartFolder(sf);
      setCurrentFolderId(folderId);
      if (fontsActive) setType("all");
    },
    [setSmartFolder, setCurrentFolderId, setType, fontsActive],
  );

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
        dragActive: assetDragActive,
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
            {/* 199:37199 — a folder row is its name alone, no glyph, no count. */}
            <TreeNode
              label={folder.name}
              testId={`mgr-row-folder-${folder.id}`}
              active={currentFolderId === folder.id}
              expandable={hasChildren}
              expanded={!isCollapsed}
              depth={depth}
              onClick={() => pickScope(null, folder.id)}
              onToggleExpand={hasChildren ? () => toggleCollapsed(folder.id) : undefined}
              onDelete={() => deleteFolder(folder.id)}
              deleteViewOnlyReason={write.reason("delete")}
              dropFolderId={folder.id}
              isDropTarget={dropTargetId === folder.id}
              {...dropProps}
            />
            {!isCollapsed && renderFolderTree(folder.id, depth + 1)}
          </React.Fragment>
        );
      });
    },
    [folders, currentFolderId, deleteFolder, pickScope, collapsedFolders, toggleCollapsed, dropTargetId, handleAssetDragOver, handleAssetDragLeave, handleAssetDrop, onMoveAssetToFolder, assetDragActive, write]
  );

  return (
    /* 2L9 B6-A01 (199:37199) — All assets and the three smart scopes, a gap,
       "My folders" over "Only you see these" with the folders and "+ New
       folder", then Fonts set apart at the foot. Every row is a centred label:
       no glyph, no count. The "Smart" head it replaced (board 1160:16) is not
       on the board. */
    <div className="mgr-left" data-testid="mgr-folders">
      <div className="mgr-tree">
        <TreeNode
          label="All assets"
          testId="mgr-row-all-assets"
          active={!currentFolderId && !smartFolder && !fontsActive}
          onClick={() => pickScope(null, null)}
          dropFolderId={null}
          isDropTarget={dropTargetId === "__root__"}
          {...dropProps}
        />
        {/* Smart folders (Bugs #6, #7 fix: actually filter) */}
        <TreeNode
          label="Recent"
          testId="mgr-row-recent"
          active={smartFolder === "recent"}
          onClick={() => pickScope("recent", null)}
        />
        <TreeNode
          label="Used on this site"
          testId="mgr-row-in-use"
          active={smartFolder === "in-use"}
          onClick={() => pickScope("in-use", null)}
        />
        <TreeNode
          label="No known placements"
          testId="mgr-row-unused"
          active={smartFolder === "unused"}
          onClick={() => pickScope("unused", null)}
        />

        <div className="mgr-tree-gap" data-testid="mgr-tree-gap-1" />
        {/* FC-4 (fix-all 2026-09-25): media folders are per-user (no shared-folder
            model exists), so the section is labelled "My folders" — same reasoning
            as the Pages folder tooltip (`PageFolder.tsx` `FOLDERS_TIP`) — so nobody
            reads a plain "Folders" head as a team-shared space. 199:37199 prints
            the "Only you see these" under it. */}
        <div className="mgr-tree-head" data-testid="mgr-section-folders">
          <div className="mgr-tree-head-title">My folders</div>
          <div className="mgr-tree-head-sub">Only you see these</div>
        </div>

        {/* User folders (nested tree) */}
        {renderFolderTree(null, 0)}

        {/* Clone 3700:20347 — `row/＋ New folder` is a row IN the list, right
            after the last folder, and it opens the Create folder OVERLAY. It
            displaced V1 board 1205:4829's inline editing row (a field that
            opened here with "Enter to create · Esc to cancel" under it), which
            had itself displaced a native prompt(). Same row shape as every
            other row in this rail — a TreeNode, so it is reachable by Tab and
            fires on Enter — and never a scope: it has no `active` state.
            199:37199 draws it as accent text with the "+" inline. */}
        {write.canWrite ? (
          <TreeNode
            label="+ New folder"
            testId="mgr-new-folder-open"
            className="mgr-node--new"
            active={false}
            onClick={onNewFolder}
          />
        ) : (
          <Tooltip content={write.reason("upload")} placement="right">
            <TreeNode
              label="+ New folder"
              testId="mgr-new-folder-open"
              className="mgr-node--new"
              active={false}
              onClick={onNewFolder}
              viewOnlyReason={write.reason("upload")}
            />
          </Tooltip>
        )}

        {/* 199:37199 — Fonts, set apart at the foot, scopes the library to
            font files in place through the type filter (the Fonts page,
            200:32519, is not built). A type is not a folder: no drop target. */}
        <div className="mgr-tree-gap mgr-tree-gap--foot" data-testid="mgr-tree-gap-2" />
        <TreeNode
          label="Fonts"
          testId="mgr-row-fonts"
          active={fontsActive}
          onClick={() => {
            setSmartFolder(null);
            setCurrentFolderId(null);
            setType("fnt");
          }}
        />
      </div>
    </div>
  );
}
