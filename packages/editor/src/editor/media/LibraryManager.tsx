/**
 * LibraryManager — fullpage 3-column asset manager (Surface 0)
 * Three columns: folder tree (240px) | asset grid (5-col) | details rail (320px)
 * Opens via "Manage library" button or J shortcut from MediaTab.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Upload, Plus, X, Search, FolderOpen, Clock, Star, CheckCircle,
  MinusCircle, ChevronDown, ChevronRight, Trash2, Download, Pencil,
  Replace, Grid2X2, List, SlidersHorizontal, AlertCircle,
} from "lucide-react";
import type { Composer } from "../../engine/Composer";
import { useMediaState } from "../sidebar/tabs/media/hooks/useMediaState";
import { StockSourceModal } from "../sidebar/tabs/media/components/StockSourceModal";
import { ConfirmDeleteModal } from "../sidebar/tabs/media/components/ConfirmDeleteModal";
import { MediaContextMenu } from "../sidebar/tabs/media/components/MediaContextMenu";
import { STORAGE_QUOTA_BYTES } from "../../shared/constants/media";
import { useToast } from "../../shared/ui/Toast";
import type { LibraryItem } from "../sidebar/tabs/media/data/mediaTypes";
import type { IconConfig } from "../../shared/types/media";
import "./LibraryManager.css";

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

  // Collect all unique tags from assets
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    for (const asset of state.libraryItems) {
      // Tags would come from the asset metadata — for now use alt text keywords
    }
    return Array.from(tagSet);
  }, [state.libraryItems]);

  // Recursive folder tree renderer
  const renderFolderTree = React.useCallback(
    (parentId: string | null, depth: number): React.ReactNode => {
      const children = state.folders.filter((f) => f.parentId === parentId);
      if (children.length === 0) return null;
      const FOLDER_COLORS = ["#F59E0B", "#10B981", "#EC4899", "#8B5CF6", "#0EA5E9"];
      return children.map((folder, i) => (
        <React.Fragment key={folder.id}>
          <TreeNode
            icon={<div className="mgr-folder-dot" style={{ background: FOLDER_COLORS[i % FOLDER_COLORS.length] }} />}
            label={folder.name}
            active={state.currentFolderId === folder.id}
            expandable={state.folders.some((f) => f.parentId === folder.id)}
            depth={depth}
            onClick={() => state.setCurrentFolderId(folder.id)}
            onDelete={() => state.deleteFolder(folder.id)}
          />
          {renderFolderTree(folder.id, depth + 1)}
        </React.Fragment>
      ));
    },
    [state.folders, state.currentFolderId, state.deleteFolder, state.setCurrentFolderId]
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
            {/* Smart folders */}
            <TreeNode
              icon={<Clock size={14} style={{ color: "#0EA5E9" }} />}
              label="Recent"
              count={state.counts.all}
              active={!state.currentFolderId && state.activeType === "all"}
              onClick={() => { state.setCurrentFolderId(null); state.setType("all"); }}
            />
            <TreeNode
              icon={<CheckCircle size={14} style={{ color: "#10B981" }} />}
              label="In use"
              active={false}
              onClick={() => addToast({ message: "In-use filter coming soon", variant: "info" })}
            />
            <TreeNode
              icon={<MinusCircle size={14} style={{ color: "var(--ls-text-ghost)" }} />}
              label="Unused"
              active={false}
              onClick={() => addToast({ message: "Unused filter coming soon", variant: "info" })}
            />

            <hr className="mgr-tree-sep" />

            {/* All assets */}
            <TreeNode
              icon={<FolderOpen size={14} />}
              label="All assets"
              count={state.counts.all}
              active={!state.currentFolderId}
              onClick={() => state.setCurrentFolderId(null)}
              expandable
            />

            <hr className="mgr-tree-sep" />
            <div className="mgr-tree-section">My folders</div>

            {/* User folders (nested tree) */}
            {renderFolderTree(null, 0)}

            {state.folders.length === 0 && (
              <div style={{ padding: "12px 8px", fontSize: 11, color: "var(--ls-text-ghost)" }}>
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
              <button className="mgr-btn" onClick={() => {
                const folderId = window.prompt("Move to folder ID (or leave empty for root):");
                if (folderId !== null) {
                  state.bulkMoveAssets(Array.from(state.selectedKeys), folderId || null);
                  addToast({ message: `Moved ${state.selectedKeys.size} assets`, variant: "success" });
                  state.toggleSelMode();
                }
              }}>
                <FolderOpen size={12} /> Move
              </button>
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
            <button className="mgr-sort">
              <SlidersHorizontal size={12} />
              Sort: {SORT_OPTIONS.find((o) => o.value === state.sort)?.label || "Recent"}
              <ChevronDown size={12} />
            </button>
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

          {state.libraryItems.length > 0 ? (
            <div className={viewMode === "grid" ? "mgr-grid" : "mgr-list"}>
              {state.libraryItems.map((item) => {
                const isSelected = selectedAssetId === item.key;
                const thumbContent = (item.type === "img" || item.type === "vid") && item.thumb
                  ? <img src={item.thumb || item.src} alt={item.name} loading="lazy" />
                  : item.type === "ico"
                    ? <img src={item.src} alt={item.name} style={{ width: 36, height: 36, objectFit: "contain" }} />
                    : item.type === "fnt"
                      ? <span style={{ fontSize: viewMode === "list" ? 18 : 32, fontWeight: 700, color: "var(--ls-text-primary)" }}>Aa</span>
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
                      if (e.metaKey || e.ctrlKey) {
                        // Multi-select: toggle via Cmd/Ctrl+click
                        if (!state.selMode) state.toggleSelMode();
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
                      if (e.metaKey || e.ctrlKey) {
                        // Multi-select: toggle via Cmd/Ctrl+click
                        if (!state.selMode) state.toggleSelMode();
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
              Showing <strong>{state.libraryItems.length}</strong> of {state.counts.all}
              {state.currentFolderId && breadcrumbPath.length > 1
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
                  <span style={{ fontSize: 48, fontWeight: 700, color: "var(--ls-text-primary)" }}>Aa Bb</span>
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
                          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ls-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {v.name}
                            {i === 0 && <span style={{ marginLeft: 6, fontSize: 9, background: "var(--ls-accent-bg)", color: "var(--ls-accent-txt)", padding: "1px 5px", borderRadius: 6, fontWeight: 700 }}>CURRENT</span>}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--ls-text-ghost)" }}>
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
                      <div style={{ fontSize: 12, color: "var(--ls-text-ghost)", padding: 8 }}>
                        Not used on any page yet
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "var(--ls-text-ghost)", padding: 8 }}>
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
                  <button className="mgr-btn" onClick={() => state.openDetail(selectedItem)}>
                    <Pencil size={12} />
                    Edit
                  </button>
                  {usageCount > 0 && (
                    <button
                      className="mgr-btn"
                      onClick={() => {
                        const newUrl = window.prompt("New asset URL to replace with:");
                        if (!newUrl?.trim()) return;
                        const result = composer.mediaCommands.replaceAcross(selectedItem.src, newUrl.trim());
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
                      }}
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
              <div style={{ textAlign: "center", color: "var(--ls-text-ghost)" }}>
                <FolderOpen size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <div style={{ fontSize: 13 }}>Select an asset to view details</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <div className="mgr-status">
        <span><strong style={{ color: "var(--ls-text-medium)" }}>{state.counts.all}</strong> assets</span>
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
        />
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
  depth?: number;
  onClick: () => void;
  onDelete?: () => void;
}

function TreeNode({ icon, label, count, active, expandable, depth = 0, onClick, onDelete }: TreeNodeProps) {
  const depthClass = depth === 1 ? " depth-1" : depth === 2 ? " depth-2" : "";
  return (
    <div className={`mgr-node${active ? " active" : ""}${depthClass}`} onClick={onClick}>
      {expandable ? (
        <ChevronDown size={12} className="mgr-chev" />
      ) : (
        <span className="mgr-chev hidden" style={{ width: 12, height: 12 }} />
      )}
      {icon}
      <span className="mgr-node-name">{label}</span>
      {count !== undefined && <span className="mgr-node-count">{count}</span>}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            background: "none", border: "none", color: "var(--ls-text-ghost)",
            cursor: "pointer", padding: 2, display: "flex", opacity: 0.5,
          }}
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}
