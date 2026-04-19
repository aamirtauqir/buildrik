/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * LibraryManager — fullpage 3-column asset manager (Surface 0)
 * Three columns: folder tree (240px) | asset grid (5-col) | details rail (320px)
 * Opens via "Manage library" button or J shortcut from MediaTab.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Upload, Plus, X, Search, FolderOpen, Clock, CheckCircle,
  MinusCircle, ChevronDown, ChevronRight, Trash2, Download, Pencil,
  Replace, Grid2X2, List, SlidersHorizontal, AlertCircle, Check,
} from "lucide-react";
import type { Composer } from "../../engine/Composer";
import { useMediaState } from "../sidebar/tabs/media/hooks/useMediaState";
import { StockSourceModal } from "../sidebar/tabs/media/components/StockSourceModal";
import { ConfirmDeleteModal } from "../sidebar/tabs/media/components/ConfirmDeleteModal";
import { MediaContextMenu } from "../sidebar/tabs/media/components/MediaContextMenu";
import { AssetDetailOverlay } from "../sidebar/tabs/media/components/AssetDetailOverlay";
import { STORAGE_QUOTA_BYTES } from "../../shared/constants/media";
import { useToast } from "../../shared/ui/Toast";
import type { LibraryItem } from "../sidebar/tabs/media/data/mediaTypes";
import type { IconConfig } from "../../shared/types/media";
import "./LibraryManager.css";

type SmartFolder = null | "recent" | "in-use" | "unused";

interface LibraryManagerProps {
  composer: Composer;
  onClose: () => void;
  onOpenImageEditor?: (imageSrc: string, onSave: (editedSrc: string) => void) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
}

// ─── Helper: format bytes ──────────────────────────────────
function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Type pills config ──────────────────────────────────────
const TYPE_PILLS = [
  { id: "all" as const, label: "All" },
  { id: "img" as const, label: "Images" },
  { id: "vid" as const, label: "Videos" },
  { id: "ico" as const, label: "Icons" },
  { id: "fnt" as const, label: "Fonts" },
] as const;

const SORT_OPTIONS = [
  { value: "date", label: "Recent" },
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
  { value: "type", label: "Type" },
] as const;

export function LibraryManager({ composer, onClose, onOpenImageEditor, onOpenIconPicker }: LibraryManagerProps) {
  const state = useMediaState(composer);
  const { addToast } = useToast();
  const [stockModalOpen, setStockModalOpen] = React.useState(false);
  const [selectedAssetId, setSelectedAssetId] = React.useState<string | null>(null);
  const [detailTab, setDetailTab] = React.useState<"details" | "versions" | "used">("details");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [sortMenuOpen, setSortMenuOpen] = React.useState(false);
  const [smartFolder, setSmartFolder] = React.useState<SmartFolder>(null);
  const [collapsedFolders, setCollapsedFolders] = React.useState<Set<string>>(new Set());
  const [bulkMovePickerOpen, setBulkMovePickerOpen] = React.useState(false);
  const [replaceAllPickerOpen, setReplaceAllPickerOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Usage count map: src → count (memoized to avoid N² on every render)
  const usageMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of state.libraryItems) {
      const count = composer.mediaCommands.getUsages(item.src).count;
      if (count > 0) map.set(item.key, count);
    }
    return map;
  }, [state.libraryItems, composer]);

  // Apply smart folder filter on top of state.libraryItems
  const visibleItems = React.useMemo(() => {
    let items = state.libraryItems;
    if (smartFolder === "recent") {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // last 7 days
      items = items
        .filter((i) => new Date(i.createdAt).getTime() >= cutoff)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (smartFolder === "in-use") {
      items = items.filter((i) => (usageMap.get(i.key) ?? 0) > 0);
    } else if (smartFolder === "unused") {
      items = items.filter((i) => (usageMap.get(i.key) ?? 0) === 0);
    }
    return items;
  }, [state.libraryItems, smartFolder, usageMap]);

  // In-use/unused counts for badges
  const inUseCount = React.useMemo(
    () => state.libraryItems.filter((i) => (usageMap.get(i.key) ?? 0) > 0).length,
    [state.libraryItems, usageMap]
  );
  const unusedCount = state.libraryItems.length - inUseCount;
  const recentCount = React.useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return state.libraryItems.filter((i) => new Date(i.createdAt).getTime() >= cutoff).length;
  }, [state.libraryItems]);

  // Selected asset details
  const selectedItem = React.useMemo(() => {
    if (!selectedAssetId) return null;
    return state.libraryItems.find((item) => item.key === selectedAssetId) || null;
  }, [selectedAssetId, state.libraryItems]);

  const usageCount = React.useMemo(() => {
    if (!selectedItem) return 0;
    return composer.mediaCommands.getUsages(selectedItem.src).count;
  }, [selectedItem, composer]);

  // Version history: group _v1234 files by base name
  const versions = React.useMemo(() => {
    if (!selectedItem) return [];
    // Strip _v1234 suffix to find base name
    const baseName = selectedItem.name.replace(/_v\d+$/, "");
    return state.libraryItems
      .filter((item) => {
        const itemBase = item.name.replace(/_v\d+$/, "");
        return itemBase === baseName && item.type === selectedItem.type;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedItem, state.libraryItems]);

  // Build breadcrumb path
  const breadcrumbPath = React.useMemo(() => {
    const parts = [{ id: null as string | null, name: "Home" }];
    if (state.currentFolderId) {
      const folder = state.folders.find((f) => f.id === state.currentFolderId);
      if (folder) parts.push({ id: folder.id, name: folder.name });
    }
    return parts;
  }, [state.currentFolderId, state.folders]);

  const handleUploadClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFromUrl = React.useCallback(async () => {
    const url = window.prompt("Paste image or media URL:");
    if (!url?.trim()) return;
    try {
      addToast({ message: "Importing...", variant: "info", duration: 2000 });
      const res = await fetch(url.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext = blob.type.split("/")[1] || "bin";
      const name = url.split("/").pop()?.split("?")[0] || `imported.${ext}`;
      const file = new File([blob], name, { type: blob.type });
      state.upload([file]);
      addToast({ message: `${name} imported`, variant: "success" });
    } catch {
      addToast({ message: "Could not import from that URL", variant: "error" });
    }
  }, [state, addToast]);

  const handleFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        state.upload(Array.from(e.target.files));
        e.target.value = "";
      }
    },
    [state]
  );

  const handleOpenIconPicker = React.useCallback(() => {
    if (!onOpenIconPicker) return;
    onOpenIconPicker(undefined, (icon) => {
      try {
        composer.mediaCommands.insertMedia(icon.name, "icon");
        addToast({ message: `${icon.name} icon added`, variant: "success" });
      } catch {
        addToast({ message: "Could not add icon", variant: "error" });
      }
    });
  }, [onOpenIconPicker, composer, addToast]);

  // Bug #1 fix: Edit button → open image editor, save as new version
  // Resolves fresh blob URL via getAssetSrc (item.src may be stale after page reload)
  const handleEditImage = React.useCallback(
    async (item: LibraryItem) => {
      if (!onOpenImageEditor) {
        addToast({ message: "Image editor unavailable", variant: "error" });
        return;
      }
      if (item.type !== "img") {
        addToast({ message: "Only images can be edited", variant: "info" });
        return;
      }
      // Resolve to a fresh blob URL — the stored src may be dead across sessions
      const freshSrc = (await composer.media.getAssetSrc(item.key)) || item.src;
      onOpenImageEditor(freshSrc, async (editedSrc) => {
        try {
          const res = await fetch(editedSrc);
          const blob = await res.blob();
          const timestamp = Date.now();
          const cleanName = item.name.replace(/_v\d+$/, "");
          const ext = (blob.type.split("/")[1] || "webp").replace("+xml", "");
          const fileName = `${cleanName}_v${timestamp % 10000}.${ext}`;
          const file = new File([blob], fileName, { type: blob.type });
          state.upload([file]);
          addToast({ message: `New version of ${item.name} saved`, variant: "success" });
        } catch {
          addToast({ message: "Could not save edited version", variant: "error" });
        }
      });
    },
    [onOpenImageEditor, state, addToast, composer]
  );

  // Collect all unique tags from assets (Bug #9 fix)
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    const assets = composer.media.getAssets();
    for (const asset of assets) {
      if (Array.isArray(asset.tags)) {
        for (const tag of asset.tags) {
          if (tag && typeof tag === "string") tagSet.add(tag);
        }
      }
    }
    return Array.from(tagSet).sort();
  }, [state.libraryItems, composer]);

  const toggleCollapsed = React.useCallback((folderId: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  // Recursive folder tree renderer (Bug #8 fix: expand/collapse)
  const renderFolderTree = React.useCallback(
    (parentId: string | null, depth: number): React.ReactNode => {
      const children = state.folders.filter((f) => f.parentId === parentId);
      if (children.length === 0) return null;
      const FOLDER_COLORS = ["#F59E0B", "#10B981", "#EC4899", "#8B5CF6", "#0EA5E9"];
      return children.map((folder, i) => {
        const hasChildren = state.folders.some((f) => f.parentId === folder.id);
        const isCollapsed = collapsedFolders.has(folder.id);
        return (
          <React.Fragment key={folder.id}>
            <TreeNode
              icon={<div className="mgr-folder-dot" style={{ background: FOLDER_COLORS[i % FOLDER_COLORS.length] }} />}
              label={folder.name}
              active={state.currentFolderId === folder.id}
              expandable={hasChildren}
              expanded={!isCollapsed}
              depth={depth}
              onClick={() => { setSmartFolder(null); state.setCurrentFolderId(folder.id); }}
              onToggleExpand={hasChildren ? () => toggleCollapsed(folder.id) : undefined}
              onDelete={() => state.deleteFolder(folder.id)}
            />
            {!isCollapsed && renderFolderTree(folder.id, depth + 1)}
          </React.Fragment>
        );
      });
    },
    [state.folders, state.currentFolderId, state.deleteFolder, state.setCurrentFolderId, collapsedFolders, toggleCollapsed]
  );

  const storageUsedPct = Math.min(100, (state.storage.used / state.storage.total) * 100);

  return (
    <div className="mgr">
      {/* ═══ TOP BAR ═══ */}
      <div className="mgr-top">
        <div className="mgr-title">
          <FolderOpen size={16} />
          Asset Library
          <span className="mgr-tag">MANAGE</span>
        </div>

        <div className="mgr-middle">
          <div className="mgr-breadcrumb">
            {breadcrumbPath.map((crumb, i) => (
              <React.Fragment key={crumb.id ?? "root"}>
                {i > 0 && <span className="mgr-sep">/</span>}
                <span
                  className={i === breadcrumbPath.length - 1 ? "mgr-crumb-current" : "mgr-crumb"}
                  onClick={() => state.setCurrentFolderId(crumb.id)}
                >
                  {crumb.name}
                </span>
              </React.Fragment>
            ))}
          </div>
          <div className="mgr-search">
            <Search size={14} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search across all folders..."
              value={state.librarySearch}
              onChange={(e) => state.setLibrarySearch(e.target.value)}
            />
            <span className="mgr-kbd">⌘K</span>
          </div>
        </div>

        <div className="mgr-right">
          <button className="mgr-btn" onClick={handleImportFromUrl}>
            <Download size={14} />
            Import URL
          </button>
          <button className="mgr-btn" onClick={handleUploadClick}>
            <Upload size={14} />
            Upload
          </button>
          <button className="mgr-btn-primary" onClick={() => setStockModalOpen(true)}>
            <Plus size={14} />
            Add from stock
          </button>
          <button className="mgr-close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="mgr-body">
        {/* ─── LEFT: Folder tree ─── */}
        <div className="mgr-left">
          <div className="mgr-left-head">
            Folders
            <button
              className="mgr-tree-add"
              title="New folder"
              onClick={() => {
                const name = window.prompt("Folder name:");
                if (name?.trim()) state.createFolder(name.trim());
              }}
            >
              <Plus size={12} />
            </button>
          </div>

          <div className="mgr-tree">
            {/* Smart folders (Bugs #6, #7 fix: actually filter) */}
            <TreeNode
              icon={<Clock size={14} style={{ color: "#0EA5E9" }} />}
              label="Recent"
              count={recentCount}
              active={smartFolder === "recent"}
              onClick={() => { setSmartFolder("recent"); state.setCurrentFolderId(null); }}
            />
            <TreeNode
              icon={<CheckCircle size={14} style={{ color: "var(--buildrick-success)" }} />}
              label="In use"
              count={inUseCount}
              active={smartFolder === "in-use"}
              onClick={() => { setSmartFolder("in-use"); state.setCurrentFolderId(null); }}
            />
            <TreeNode
              icon={<MinusCircle size={14} style={{ color: "var(--buildrick-text-disabled)" }} />}
              label="Unused"
              count={unusedCount}
              active={smartFolder === "unused"}
              onClick={() => { setSmartFolder("unused"); state.setCurrentFolderId(null); }}
            />

            <hr className="mgr-tree-sep" />

            {/* All assets */}
            <TreeNode
              icon={<FolderOpen size={14} />}
              label="All assets"
              count={state.counts.all}
              active={!state.currentFolderId && !smartFolder}
              onClick={() => { setSmartFolder(null); state.setCurrentFolderId(null); }}
            />

            <hr className="mgr-tree-sep" />
            <div className="mgr-tree-section">My folders</div>

            {/* User folders (nested tree) */}
            {renderFolderTree(null, 0)}

            {state.folders.length === 0 && (
              <div style={{ padding: "12px 8px", fontSize: 11, color: "var(--buildrick-text-disabled)" }}>
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
                    icon={<div className="mgr-node-dot" style={{ background: "#0EA5E9" }} />}
                    label={tag}
                    count={state.libraryItems.filter((i) => i.altText?.includes(tag)).length}
                    active={false}
                    onClick={() => state.setLibrarySearch(tag)}
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
              onClick={() => addToast({ message: "Trash coming soon", variant: "info" })}
            />
          </div>
        </div>

        {/* ─── MIDDLE: Asset grid ─── */}
        <div className="mgr-main">
          {/* Bulk action toolbar (multi-select mode) */}
          {state.selMode && state.selectedKeys.size > 0 && (
            <div className="mgr-bulk-bar">
              <span className="mgr-bulk-count">{state.selectedKeys.size} selected</span>
              {/* Bug #4 fix: Move → folder picker popover */}
              <div className="mgr-sort-wrap">
                <button className="mgr-btn" onClick={() => setBulkMovePickerOpen((o) => !o)}>
                  <FolderOpen size={12} /> Move to...
                </button>
                {bulkMovePickerOpen && (
                  <>
                    <div className="mgr-sort-scrim" onClick={() => setBulkMovePickerOpen(false)} />
                    <div className="mgr-sort-menu" style={{ minWidth: 200, maxHeight: 280, overflowY: "auto" }}>
                      <button
                        className="mgr-sort-item"
                        onClick={() => {
                          const keys = Array.from(state.selectedKeys);
                          state.bulkMoveAssets(keys, null);
                          addToast({ message: `Moved ${keys.length} to root`, variant: "success" });
                          setBulkMovePickerOpen(false);
                          state.toggleSelMode();
                        }}
                      >
                        <FolderOpen size={12} /> Root
                      </button>
                      {state.folders.length > 0 && <div className="mgr-sort-sep" />}
                      {state.folders.map((folder) => (
                        <button
                          key={folder.id}
                          className="mgr-sort-item"
                          onClick={() => {
                            const keys = Array.from(state.selectedKeys);
                            state.bulkMoveAssets(keys, folder.id);
                            addToast({ message: `Moved ${keys.length} to ${folder.name}`, variant: "success" });
                            setBulkMovePickerOpen(false);
                            state.toggleSelMode();
                          }}
                        >
                          <div className="mgr-folder-dot" style={{ background: "var(--buildrick-warning)" }} />
                          {folder.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                className="mgr-btn danger"
                onClick={() => {
                  const items = state.libraryItems.filter((i) => state.selectedKeys.has(i.key));
                  state.requestBulkDelete(items);
                }}
              >
                <Trash2 size={12} /> Delete
              </button>
              <div className="mgr-spacer" />
              <button className="mgr-btn" onClick={state.selectAll}>Select all</button>
              <button className="mgr-btn" onClick={state.toggleSelMode}>Cancel</button>
            </div>
          )}

          <div className="mgr-subbar">
            <div className="mgr-pills">
              {TYPE_PILLS.map((pill) => (
                <button
                  key={pill.id}
                  className={`mgr-pill${state.activeType === pill.id ? " active" : ""}`}
                  onClick={() => state.setType(pill.id)}
                >
                  {pill.label}
                  {state.counts[pill.id] > 0 && (
                    <span style={{ marginLeft: 4, opacity: 0.7 }}>{state.counts[pill.id]}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="mgr-spacer" />
            {/* Bug #3 fix: Sort dropdown */}
            <div className="mgr-sort-wrap">
              <button className="mgr-sort" onClick={() => setSortMenuOpen((o) => !o)}>
                <SlidersHorizontal size={12} />
                Sort: {SORT_OPTIONS.find((o) => o.value === state.sort)?.label || "Recent"}
                <ChevronDown size={12} />
              </button>
              {sortMenuOpen && (
                <>
                  <div className="mgr-sort-scrim" onClick={() => setSortMenuOpen(false)} />
                  <div className="mgr-sort-menu">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={`mgr-sort-item${state.sort === opt.value ? " active" : ""}`}
                        onClick={() => {
                          state.setSort(opt.value, state.sortDir);
                          setSortMenuOpen(false);
                        }}
                      >
                        {opt.label}
                        {state.sort === opt.value && <Check size={12} />}
                      </button>
                    ))}
                    <div className="mgr-sort-sep" />
                    <button
                      className="mgr-sort-item"
                      onClick={() => {
                        state.setSort(state.sort, state.sortDir === "asc" ? "desc" : "asc");
                        setSortMenuOpen(false);
                      }}
                    >
                      {state.sortDir === "asc" ? "Ascending ↑" : "Descending ↓"}
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="mgr-view-toggle">
              <button
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <Grid2X2 size={12} />
              </button>
              <button
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <List size={12} />
              </button>
            </div>
          </div>

          {visibleItems.length > 0 ? (
            <div className={viewMode === "grid" ? "mgr-grid" : "mgr-list"}>
              {visibleItems.map((item) => {
                const isSelected = selectedAssetId === item.key;
                const thumbContent = (item.type === "img" || item.type === "vid") && item.thumb
                  ? <img src={item.thumb || item.src} alt={item.name} loading="lazy" />
                  : item.type === "ico"
                    ? <img src={item.src} alt={item.name} style={{ width: 36, height: 36, objectFit: "contain" }} />
                    : item.type === "fnt"
                      ? <span style={{ fontSize: viewMode === "list" ? 18 : 32, fontWeight: 700, color: "var(--buildrick-text-primary)" }}>Aa</span>
                      : <img src={item.src} alt={item.name} loading="lazy" />;

                // Drag data for canvas drop
                const onDragStart = (e: React.DragEvent) => {
                  e.dataTransfer.setData("application/x-aquibra-media-src", item.src);
                  e.dataTransfer.setData("application/x-aquibra-media-type", item.type);
                  e.dataTransfer.setData("application/x-aquibra-media-name", item.name);
                  e.dataTransfer.effectAllowed = "copy";
                };

                if (viewMode === "list") {
                  return (
                    <div
                      key={item.key}
                      className={`mgr-list-row${isSelected ? " selected" : ""}`}
                      onClick={(e) => {
                      // Bug #10 fix: Cmd/Ctrl enters multi-select; in selMode, regular click toggles
                      if (e.metaKey || e.ctrlKey) {
                        if (!state.selMode) state.toggleSelMode();
                        state.toggleSelect(item.key);
                      } else if (state.selMode) {
                        state.toggleSelect(item.key);
                      } else {
                        setSelectedAssetId(item.key);
                      }
                    }}
                      onDoubleClick={() => state.insertToCanvas(item.key)}
                      onContextMenu={(e) => state.openCtxMenu(e, item)}
                      draggable
                      onDragStart={onDragStart}
                    >
                      <div className="mgr-list-thumb">{thumbContent}</div>
                      <div className="mgr-list-name">{item.name}</div>
                      <div className="mgr-list-type">{item.type.toUpperCase()}</div>
                      <div className="mgr-list-dims">
                        {item.width && item.height ? `${item.width}×${item.height}` : "—"}
                      </div>
                      <div className="mgr-list-size">{fmtBytes(item.size)}</div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.key}
                    className={`mgr-asset${isSelected ? " selected" : ""}`}
                    onClick={(e) => {
                      // Bug #10 fix: Cmd/Ctrl enters multi-select; in selMode, regular click toggles
                      if (e.metaKey || e.ctrlKey) {
                        if (!state.selMode) state.toggleSelMode();
                        state.toggleSelect(item.key);
                      } else if (state.selMode) {
                        state.toggleSelect(item.key);
                      } else {
                        setSelectedAssetId(item.key);
                      }
                    }}
                    onDoubleClick={() => state.insertToCanvas(item.key)}
                    onContextMenu={(e) => state.openCtxMenu(e, item)}
                    draggable
                    onDragStart={onDragStart}
                  >
                    <div className="mgr-asset-thumb">
                      {thumbContent}
                      {/* Source badge */}
                      <div className={`mgr-badge ${item.assetSource === "stock" ? "stock" : item.assetSource === "ai" ? "stock" : "uploaded"}`}>
                        {item.assetSource === "stock" ? "STOCK" : item.assetSource === "ai" ? "AI" : "UP"}
                      </div>
                      {/* Usage chip */}
                      {(usageMap.get(item.key) ?? 0) > 0 && (
                        <div className="mgr-usage">{usageMap.get(item.key)}×</div>
                      )}
                      {isSelected && (
                        <div className="mgr-sel-check">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                      )}
                    </div>
                    <div className="mgr-asset-meta">
                      <div className="mgr-asset-name">{item.name}</div>
                      <div className="mgr-asset-sub">
                        {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
                        {fmtBytes(item.size)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mgr-empty">
              <div className="mgr-empty-hero">
                <div className="mgr-empty-ring">
                  <FolderOpen size={32} />
                </div>
                <h4>{state.librarySearch ? "No results" : "Your library is empty"}</h4>
                <p>
                  {state.librarySearch
                    ? `No assets match "${state.librarySearch}"`
                    : "Upload your brand assets, browse free stock, or import from other tools."}
                </p>
                {!state.librarySearch && (
                  <div className="mgr-empty-actions">
                    <button className="mgr-btn-primary" onClick={handleUploadClick}>
                      <Upload size={14} />
                      Upload files
                    </button>
                    <button className="mgr-btn" onClick={() => setStockModalOpen(true)}>
                      <Search size={14} />
                      Browse stock
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mgr-grid-foot">
            <span>
              Showing <strong>{visibleItems.length}</strong> of {state.counts.all}
              {smartFolder
                ? ` in ${smartFolder === "in-use" ? "In use" : smartFolder === "unused" ? "Unused" : "Recent"}`
                : state.currentFolderId && breadcrumbPath.length > 1
                ? ` in ${breadcrumbPath[breadcrumbPath.length - 1].name}`
                : ""}
            </span>
          </div>
        </div>

        {/* ─── RIGHT: Details rail ─── */}
        <div className="mgr-details">
          {selectedItem ? (
            <>
              <div className="mgr-det-head">
                <div className="mgr-det-filename">{selectedItem.name}</div>
                <div className="mgr-det-sub">
                  {selectedItem.type.toUpperCase()} · {fmtBytes(selectedItem.size)}
                </div>
              </div>
              <div className="mgr-det-preview">
                {selectedItem.type === "img" || selectedItem.type === "vid" ? (
                  <img src={selectedItem.src} alt={selectedItem.name} />
                ) : selectedItem.type === "ico" ? (
                  <img src={selectedItem.src} alt={selectedItem.name} style={{ width: 64, height: 64 }} />
                ) : selectedItem.type === "fnt" ? (
                  <span style={{ fontSize: 48, fontWeight: 700, color: "var(--buildrick-text-primary)" }}>Aa Bb</span>
                ) : null}
              </div>
              <div className="mgr-det-tabs">
                <button
                  className={`mgr-det-tab${detailTab === "details" ? " active" : ""}`}
                  onClick={() => setDetailTab("details")}
                >
                  Details
                </button>
                {versions.length > 1 && (
                  <button
                    className={`mgr-det-tab${detailTab === "versions" ? " active" : ""}`}
                    onClick={() => setDetailTab("versions")}
                  >
                    Versions · {versions.length}
                  </button>
                )}
                <button
                  className={`mgr-det-tab${detailTab === "used" ? " active" : ""}`}
                  onClick={() => setDetailTab("used")}
                >
                  Used in · {usageCount}
                </button>
              </div>
              <div className="mgr-det-body">
                {detailTab === "details" && (
                  <div className="mgr-kv">
                    <span className="mgr-kv-key">Type</span>
                    <span className="mgr-kv-val">{selectedItem.type.toUpperCase()}</span>
                    {selectedItem.width && selectedItem.height && (
                      <>
                        <span className="mgr-kv-key">Dimensions</span>
                        <span className="mgr-kv-val">{selectedItem.width} × {selectedItem.height} px</span>
                      </>
                    )}
                    <span className="mgr-kv-key">File size</span>
                    <span className="mgr-kv-val">{fmtBytes(selectedItem.size)}</span>
                    <span className="mgr-kv-key">MIME</span>
                    <span className="mgr-kv-val">{selectedItem.mimeType}</span>
                    <span className="mgr-kv-key">Added</span>
                    <span className="mgr-kv-val">{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
                {detailTab === "versions" && (
                  <div className="mgr-version-list">
                    {versions.map((v, i) => (
                      <div
                        key={v.key}
                        className={`mgr-version-row${v.key === selectedItem.key ? " active" : ""}`}
                        onClick={() => setSelectedAssetId(v.key)}
                      >
                        <div className="mgr-version-thumb">
                          {v.thumb ? (
                            <img src={v.thumb || v.src} alt={v.name} />
                          ) : (
                            <span style={{ fontSize: 10 }}>{v.type.toUpperCase()}</span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--buildrick-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {v.name}
                            {i === 0 && <span style={{ marginLeft: 6, fontSize: 9, background: "var(--buildrick-accent-tint)", color: "var(--buildrick-text-primary)", padding: "1px 5px", borderRadius: 6, fontWeight: 700 }}>CURRENT</span>}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--buildrick-text-disabled)" }}>
                            {fmtBytes(v.size)} · {new Date(v.createdAt).toLocaleString()}
                          </div>
                        </div>
                        {i > 0 && v.key !== selectedItem.key && (
                          <button
                            className="mgr-btn"
                            style={{ height: 24, fontSize: 10, padding: "0 8px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Revert: replace all usages of current version with this one
                              if (versions[0]) {
                                composer.mediaCommands.replaceAcross(versions[0].src, v.src);
                                addToast({ message: `Reverted to ${v.name}`, variant: "success" });
                              }
                            }}
                          >
                            Revert
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {detailTab === "used" && (
                  <div>
                    <div className="mgr-used-head">
                      Used in <span className="mgr-used-count">{usageCount} places</span>
                    </div>
                    {usageCount === 0 ? (
                      <div style={{ fontSize: 12, color: "var(--buildrick-text-disabled)", padding: 8 }}>
                        Not used on any page yet
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "var(--buildrick-text-disabled)", padding: 8 }}>
                        {usageCount} element{usageCount !== 1 ? "s" : ""} reference this asset
                      </div>
                    )}
                  </div>
                )}
                <div className="mgr-det-actions">
                  <button className="mgr-btn" onClick={() => state.insertToCanvas(selectedItem.key)}>
                    <Download size={12} />
                    Insert
                  </button>
                  {/* Bug #1 fix: Edit → image editor for images, rename overlay otherwise */}
                  <button
                    className="mgr-btn"
                    onClick={() => {
                      if (selectedItem.type === "img") {
                        handleEditImage(selectedItem);
                      } else {
                        state.openDetail(selectedItem);
                      }
                    }}
                  >
                    <Pencil size={12} />
                    {selectedItem.type === "img" ? "Edit" : "Rename"}
                  </button>
                  {/* Bug #5 fix: Replace all opens library picker instead of URL prompt */}
                  {usageCount > 0 && (
                    <button
                      className="mgr-btn"
                      onClick={() => setReplaceAllPickerOpen(true)}
                    >
                      <Replace size={12} />
                      Replace all
                    </button>
                  )}
                  <button
                    className="mgr-btn danger"
                    onClick={() => state.requestDelete(selectedItem.key)}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
              <div style={{ textAlign: "center", color: "var(--buildrick-text-disabled)" }}>
                <FolderOpen size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <div style={{ fontSize: 13 }}>Select an asset to view details</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <div className="mgr-status">
        <span><strong style={{ color: "var(--buildrick-text-secondary)" }}>{state.counts.all}</strong> assets</span>
        <span className="mgr-status-dot" />
        <span>{fmtBytes(state.storage.used)} / {fmtBytes(state.storage.total)}</span>
        <div className="mgr-status-right">
          <div className="mgr-quota-bar">
            <div className="mgr-quota-fill" style={{ width: `${storageUsedPct}%` }} />
          </div>
          <span className="mgr-sync-pill">
            <AlertCircle size={10} />
            This device only
          </span>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.svg,.ttf,.otf,.woff,.woff2"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Modals */}
      <StockSourceModal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        activeType={state.activeType}
        photos={state.stockPhotos}
        videos={state.stockVideos}
        icons={state.discIcons}
        fonts={state.discFonts}
        loading={state.discLoading}
        searchQuery={state.discoverySearch}
        orientation={state.discOrientation}
        color={state.discColor}
        onSearch={state.discSearchAll}
        onSetOrientation={state.setDiscOrientation}
        onSetColor={state.setDiscColor}
        onLoadMore={state.loadMoreDisc}
        onSave={state.saveToLibrary}
        onInsert={state.insertToCanvas}
        onOpenIconPicker={handleOpenIconPicker}
      />

      {state.confirmDelete && (
        <ConfirmDeleteModal
          payload={state.confirmDelete}
          onConfirm={state.executeDelete}
          onCancel={state.cancelDelete}
        />
      )}

      {state.ctxMenu && (
        <MediaContextMenu
          x={state.ctxMenu.x}
          y={state.ctxMenu.y}
          item={state.ctxMenu.item}
          folders={state.folders}
          onRename={state.openDetail}
          onMove={(item, fid) => state.moveAsset(item.key, fid)}
          onDelete={(item) => state.requestDelete(item.key)}
          onCopyUrl={state.copyUrl}
          onClose={state.closeCtxMenu}
          onEditImage={handleEditImage}
        />
      )}

      {/* Bug #2 fix: mount AssetDetailOverlay so rename from context menu actually shows */}
      {state.detailItem && (
        <AssetDetailOverlay
          item={state.detailItem}
          onInsert={state.insertToCanvas}
          onRename={state.renameItem}
          onUpdate={state.updateItem}
          onDelete={(key) => {
            state.requestDelete(key);
            state.closeDetail();
          }}
          onClose={state.closeDetail}
          onEditImage={handleEditImage}
        />
      )}

      {/* Bug #5 fix: Replace-all picker modal (select asset from library) */}
      {replaceAllPickerOpen && selectedItem && (
        <div className="stock-modal-backdrop" onClick={() => setReplaceAllPickerOpen(false)}>
          <div
            className="stock-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(640px, 90vw)" }}
          >
            <div className="stock-modal-header">
              <h3 className="stock-modal-title">Replace "{selectedItem.name}" across {usageCount} use{usageCount !== 1 ? "s" : ""}</h3>
              <button className="stock-modal-close" onClick={() => setReplaceAllPickerOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="stock-modal-content">
              <p style={{ fontSize: 12, color: "var(--buildrick-text-disabled)", marginBottom: 12 }}>
                Pick a replacement asset. All canvas usages will be swapped atomically (one undo reverses everything).
              </p>
              <div className="med-grid" data-cols="3">
                {state.libraryItems
                  .filter((i) => i.key !== selectedItem.key && i.type === selectedItem.type)
                  .map((i) => (
                    <div
                      key={i.key}
                      className="med-img-card"
                      onClick={() => {
                        const result = composer.mediaCommands.replaceAcross(selectedItem.src, i.src);
                        if (result.replaced.length > 0) {
                          addToast({
                            message: `Replaced in ${result.replaced.length} element${result.replaced.length > 1 ? "s" : ""}`,
                            variant: "success",
                          });
                        }
                        if (result.failed.length > 0) {
                          addToast({
                            message: `${result.failed.length} replacement${result.failed.length > 1 ? "s" : ""} failed`,
                            variant: "error",
                          });
                        }
                        setReplaceAllPickerOpen(false);
                      }}
                    >
                      <div className="med-img-card-bg">
                        {i.thumb || (i.type === "img" || i.type === "vid") ? (
                          <img src={i.thumb || i.src} alt={i.name} loading="lazy" />
                        ) : null}
                      </div>
                      <div style={{ padding: "4px 6px", fontSize: 11, color: "var(--buildrick-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {i.name}
                      </div>
                    </div>
                  ))}
              </div>
              {state.libraryItems.filter((i) => i.key !== selectedItem.key && i.type === selectedItem.type).length === 0 && (
                <div className="stock-empty">
                  No other {selectedItem.type === "img" ? "images" : "assets of the same type"} in your library.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tree Node sub-component ────────────────────────────────

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
}

function TreeNode({
  icon, label, count, active, expandable, expanded = true, depth = 0,
  onClick, onToggleExpand, onDelete,
}: TreeNodeProps) {
  const depthClass = depth === 1 ? " depth-1" : depth === 2 ? " depth-2" : "";
  return (
    <div className={`mgr-node${active ? " active" : ""}${depthClass}`} onClick={onClick}>
      {expandable ? (
        <button
          className="mgr-chev-btn"
          onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      ) : (
        <span className="mgr-chev hidden" style={{ width: 12, height: 12 }} />
      )}
      {icon}
      <span className="mgr-node-name">{label}</span>
      {count !== undefined && <span className="mgr-node-count">{count}</span>}
      {onDelete && (
        <button
          className="mgr-node-del"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label="Delete folder"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}
