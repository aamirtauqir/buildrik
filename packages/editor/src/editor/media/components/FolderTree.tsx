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
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import * as React from "react";
import type { MediaFolder } from "../../sidebar/tabs/media/data/mediaTypes";
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

/* 1160:44 / Clone 3695:45155 — a tag chip: 8/3 on a full radius, a
   --bk-border edge on bg-panel, 11 ink-soft. On a flowbite Button every one of
   its own groups (h-10, px-5, text-sm, font-medium, rounded-lg, the primary
   fill) has to be displaced per property or it stands; the `.mgr-tag` rule
   this replaces set no height, so the chips would have drawn 40 tall.
   The active chip (3721:43697) takes the toolbar's format-chip recipe —
   accent edge on the accent tint; the board's own pressed state is drawn at
   near-zero contrast and is not a colour anyone can read. */
const TAG_CHIP =
  "tw:h-auto tw:min-h-0 tw:px-2 tw:py-[3px] tw:rounded-full tw:border tw:font-normal " +
  "tw:text-[length:var(--bk-text-11)] tw:leading-[14px] tw:focus:ring-0 tw:focus:[box-shadow:var(--bk-shadow-focus)]";
const TAG_CHIP_REST =
  `${TAG_CHIP} tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:text-[var(--bk-ink-soft)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]`;
const TAG_CHIP_ACTIVE =
  `${TAG_CHIP} active tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-accent-text)] tw:enabled:hover:bg-[var(--bk-accent-tint)]`;

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
  counts: TypeCounts;
  smartFolder: SmartFolder;
  setSmartFolder(sf: SmartFolder): void;
  recentCount: number;
  inUseCount: number;
  unusedCount: number;
  /** Every tag in the LIBRARY (Clone 3721:43697 lists `menu · team · food`
   *  whatever the scope) — the orchestrator reads `allLibraryItems`. */
  allTags: string[];
  /** Clone 3721:43697 — the active chip; a chip is a FILTER, not a search
   *  string. Clicking the active one clears it. */
  tagFilter: string | null;
  setTagFilter(tag: string | null): void;
  /** Clone 3698:20337 — each folder row prints its own asset count. */
  folderCounts: ReadonlyMap<string, number>;
  /** Clone 3700:20347 — `row/＋ New folder` opens the orchestrator's modal. */
  onNewFolder(): void;
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
  /** Clone 4215:26635 — while an asset is in flight every folder row (All
   *  assets and each user folder) is outlined as a place it can land. */
  assetDragActive?: boolean;
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
      className={`mgr-node${active ? " active" : ""}${depthClass}${dropClass}`}
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
      {icon}
      <span className="mgr-node-name">{label}</span>
      {count !== undefined && <span className="mgr-node-count">{count}</span>}
      {onDelete && !deleteViewOnlyReason && (
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
      {onDelete && deleteViewOnlyReason && (
        <Tooltip content={deleteViewOnlyReason} placement="right">
          <Button
            className="mgr-node-del mgr-node-del--view-only"
            aria-label="Delete folder"
            aria-disabled="true"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 size={11} />
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
  counts,
  smartFolder,
  setSmartFolder,
  recentCount,
  inUseCount,
  unusedCount,
  allTags,
  tagFilter,
  setTagFilter,
  folderCounts,
  onNewFolder,
  deleteFolder,
  onTrashClick,
  onMoveAssetToFolder,
  assetDragActive = false,
}: FolderTreeProps) {
  const [collapsedFolders, setCollapsedFolders] = React.useState<Set<string>>(new Set());
  /* Audit G3-064: viewers see New folder and each folder's trash disabled
     with the reason (board 6289:148485 pattern). */
  const write = useMediaWriteAccess();

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
    [folders, folderCounts, currentFolderId, deleteFolder, setCurrentFolderId, setSmartFolder, collapsedFolders, toggleCollapsed, dropTargetId, handleAssetDragOver, handleAssetDragLeave, handleAssetDrop, onMoveAssetToFolder, assetDragActive, write]
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

        {/* Clone 3700:20347 — `row/＋ New folder` is a row IN the list, right
            after the last folder, and it opens the Create folder OVERLAY. It
            displaced V1 board 1205:4829's inline editing row (a field that
            opened here with "Enter to create · Esc to cancel" under it), which
            had itself displaced a native prompt(). Same row shape as every
            other row in this rail — a TreeNode, so it is reachable by Tab and
            fires on Enter — and never a scope: it has no `active` state. */}
        {write.canWrite ? (
          <TreeNode
            icon={<Plus size={14} className="mgr-node-ico" />}
            label="New folder"
            testId="mgr-new-folder-open"
            active={false}
            onClick={onNewFolder}
          />
        ) : (
          <Tooltip content={write.reason("upload")} placement="right">
            <TreeNode
              icon={<Plus size={14} className="mgr-node-ico" />}
              label="New folder"
              testId="mgr-new-folder-open"
              active={false}
              onClick={onNewFolder}
              viewOnlyReason={write.reason("upload")}
            />
          </Tooltip>
        )}

        {folders.length === 0 && (
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
                it the same row shape as a folder said it was a place.
                Clone 3721:43697 — a chip FILTERS (`tagFilter`), it does not
                write the search string; the pressed one is the active tag,
                another chip swaps it, the same chip again clears it. */}
            <div className="mgr-tags" role="group" aria-label="Filter by tag" data-testid="mgr-tags">
              {allTags.map((tag) => (
                <Button
                  key={`tag-${tag}`}
                  variant="secondary"
                  className={tagFilter === tag ? TAG_CHIP_ACTIVE : TAG_CHIP_REST}
                  data-testid={`mgr-tag-${tag}`}
                  aria-pressed={tagFilter === tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
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
