/**
 * Stock Source Modal — Browse and save stock assets to library.
 * Replaces the old Discovery tab. Opens on demand via "+ Add from Stock".
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ModalContent, ModalRoot, Button } from "@/editor/chrome-ui";
import { X, Download, SquareArrowOutUpRight } from "lucide-react";
import { SearchBar } from "../../../shared/SearchBar";
import type {
  DiscoveryViewProps,
  DiscOrientation,
  DiscColor,
  DiscSource,
  MediaTypeFilter,
} from "../data/mediaTypes";
import type { IconConfig } from "../../../../../shared/types/media";

interface StockSourceModalProps extends DiscoveryViewProps {
  open: boolean;
  onClose: () => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
}

const COLORS: Array<{ id: DiscColor; hex?: string; label: string }> = [
  { id: "all", label: "All Colors" },
  { id: "black_and_white", label: "B&W", hex: "linear-gradient(45deg, #000 50%, var(--bk-bg-card) 50%)" },
  { id: "black", hex: "#000000", label: "Black" },
  { id: "white", hex: "var(--bk-bg-card)", label: "White" },
  { id: "red", hex: "#ef4444", label: "Red" },
  { id: "orange", hex: "#f97316", label: "Orange" },
  { id: "yellow", hex: "#eab308", label: "Yellow" },
  { id: "green", hex: "#22c55e", label: "Green" },
  { id: "teal", hex: "#14b8a6", label: "Teal" },
  { id: "blue", hex: "#3b82f6", label: "Blue" },
  { id: "purple", hex: "#a855f7", label: "Purple" },
  { id: "magenta", hex: "#ec4899", label: "Magenta" },
];

const TABS = [
  { id: "img" as const, label: "Photos" },
  { id: "vid" as const, label: "Videos" },
  { id: "ico" as const, label: "Icons" },
  { id: "fnt" as const, label: "Fonts" },
];

const SOURCES: ReadonlyArray<{ id: DiscSource; label: string }> = [
  { id: "unsplash", label: "Unsplash" },
  { id: "pexels", label: "Pexels" },
  { id: "pixabay", label: "Pixabay" },
];

export function StockSourceModal({
  open,
  onClose,
  photos,
  videos,
  icons,
  fonts,
  loading,
  searchQuery,
  orientation,
  color,
  source,
  quota,
  onSearch,
  onSetOrientation,
  onSetColor,
  onSetSource,
  onLoadMore,
  onSave,
  onInsert,
  onOpenIconPicker,
}: StockSourceModalProps) {
  const [activeTab, setActiveTab] = React.useState<"img" | "vid" | "ico" | "fnt">("img");


  if (!open) return null;

  const isLoading = loading[activeTab];
  const showFilters = activeTab === "img" || activeTab === "vid";

  return (
    <ModalRoot open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <ModalContent srTitle="Browse stock assets" className="stock-modal">
        {/* Header */}
        <div className="stock-modal-header">
          <h3 className="stock-modal-title">Add from Stock</h3>
          <Button className="stock-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </div>

        {/* S19 quota strip — hidden when prop absent */}
        {quota && (
          <div
            data-testid="stock-quota-strip"
            style={{
              margin: "12px 20px 0",
              padding: "8px 12px",
              background: "var(--bk-ink-muted)",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
            }}
          >
            <span>
              Stock searches:{" "}
              <b>{quota.used}</b> / {quota.limit} this month
            </span>
            {quota.upgradeHref && (
              <a
                href={quota.upgradeHref}
                style={{ color: "var(--bk-accent)", fontWeight: 500, textDecoration: "none" }}
              >
                Upgrade for unlimited →
              </a>
            )}
          </div>
        )}

        {/* Tab bar */}
        <div className="stock-modal-tabs">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              className={`stock-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="stock-modal-search" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <SearchBar
              value={searchQuery}
              onChange={(q) => onSearch(q, orientation, color)}
              placeholder={`Search ${activeTab === "img" ? "photos" : activeTab === "vid" ? "videos" : activeTab === "ico" ? "icons" : "fonts"}...`}
              debounceMs={400}
            />
          </div>

          {/* S19 source pills — only meaningful for photos/videos */}
          {showFilters && onSetSource && (
            <div
              role="radiogroup"
              aria-label="Stock source"
              data-testid="stock-source-pills"
              style={{ display: "flex", gap: 2, padding: 2, background: "var(--bk-bg-subtle)", borderRadius: 6 }}
            >
              {SOURCES.map((s) => {
                const active = source === s.id;
                return (
                  <Button
                    key={s.id}
                    type="button"
                    color="light"
                    size="xs"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onSetSource(s.id)}
                    className={`tw:px-2.5 tw:py-1 tw:text-xs tw:rounded ${
                      active
                        ? "tw:bg-[var(--bk-accent)] tw:text-white tw:font-semibold tw:border-[var(--bk-accent)]"
                        : "tw:bg-transparent tw:text-[var(--bk-ink-muted)] tw:font-medium tw:border-transparent"
                    }`}
                  >
                    {s.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        {/* Filters (photos/videos only) */}
        {showFilters && (
          <div className="stock-modal-filters">
            <div className="stock-orientation-group">
              {(["all", "landscape", "portrait", "squarish"] as DiscOrientation[]).map((o) => (
                <Button
                  key={o}
                  onClick={() => onSetOrientation(o)}
                  className={`stock-orient-btn${orientation === o ? " active" : ""}`}
                >
                  {o === "all" ? "Any" : o.charAt(0).toUpperCase()}
                </Button>
              ))}
            </div>
            <div className="stock-filter-divider" />
            <div className="stock-color-row">
              {COLORS.map((c) => (
                <Button
                  key={c.id}
                  onClick={() => onSetColor(c.id)}
                  title={c.label}
                  className={`stock-color-dot${color === c.id ? " active" : ""}`}
                  style={{ background: c.hex || "var(--bk-bg-subtle)" }}
                >
                  {c.id === "all" && "\u00d7"}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="stock-modal-content">
          {isLoading && (
            <div className="stock-loading">Searching...</div>
          )}

          {/* Photos grid */}
          {activeTab === "img" && photos.length > 0 && (
            <div className="med-grid" data-cols="3">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="med-img-card"
                  onClick={() => onSave("img", p)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/x-aquibra-media-src", p.url);
                    e.dataTransfer.setData("application/x-aquibra-media-type", "img");
                    e.dataTransfer.setData("application/x-aquibra-media-name", p.alt);
                  }}
                >
                  <div className="med-img-card-bg">
                    <img src={p.thumb} alt={p.alt} loading="lazy" />
                  </div>
                  <div className="med-img-hover-bar">
                    <Download size={16} color="white" />
                    <span style={{ color: "white", fontSize: 11 }}>Save to Library</span>
                  </div>
                  {(p.author || p.source) && (
                    <div
                      className="med-img-attribution"
                      data-testid="stock-tile-attribution"
                    >
                      {p.author ? (
                        p.authorUrl ? (
                          <a
                            href={p.authorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {p.author}
                          </a>
                        ) : (
                          <span>{p.author}</span>
                        )
                      ) : null}
                      {p.author && p.source ? " · " : null}
                      {p.source ? <span className="med-img-attribution__src">{p.source}</span> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Videos grid */}
          {activeTab === "vid" && videos.length > 0 && (
            <div className="med-grid" data-cols="2">
              {videos.map((v) => (
                <div
                  key={v.id}
                  className="med-vid-card"
                  onClick={() => onSave("vid", v)}
                >
                  <div className="med-img-card-bg">
                    <img src={v.thumb} alt="Stock video" loading="lazy" />
                  </div>
                  <div className="med-vid-play">
                    <svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z" fill="white" /></svg>
                  </div>
                  {(v.author || v.source) && (
                    <div
                      className="med-img-attribution"
                      data-testid="stock-tile-attribution"
                    >
                      {v.author ? <span>{v.author}</span> : null}
                      {v.author && v.source ? " · " : null}
                      {v.source ? <span className="med-img-attribution__src">{v.source}</span> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Icons grid */}
          {activeTab === "ico" && (
            <>
              {onOpenIconPicker && (
                <div className="stock-icon-header">
                  <Button
                    onClick={() => onOpenIconPicker(undefined, () => {})}
                    className="stock-browse-all"
                  >
                    Browse full icon library <SquareArrowOutUpRight size={12} />
                  </Button>
                </div>
              )}
              {icons.length > 0 ? (
                <div className="med-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                  {icons.map((ico) => (
                    <div
                      key={ico.id}
                      className="med-img-card"
                      onClick={() => onInsert(ico.id)}
                      style={{ padding: 8 }}
                    >
                      <img src={ico.svgDataUrl} alt={ico.name} style={{ width: 24, height: 24 }} />
                      <span style={{ fontSize: 11, color: "var(--bk-ink-disabled)", marginTop: 4 }}>{ico.name}</span>
                    </div>
                  ))}
                </div>
              ) : !isLoading ? (
                <div className="stock-empty">No icons found.</div>
              ) : null}
            </>
          )}

          {/* Fonts list */}
          {activeTab === "fnt" && fonts.length > 0 && (
            <div className="med-fnt-list">
              {fonts.map((f) => (
                <div key={f.id} className="med-fnt-card" onClick={() => onInsert(f.id)}>
                  <div className="med-fnt-top">
                    <span className="med-fnt-name">{f.family}</span>
                    <Button className="med-action-btn">Use</Button>
                  </div>
                  <div className="med-fnt-preview" style={{ fontFamily: f.family }}>Aa Bb Cc 123</div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading &&
            activeTab === "img" && photos.length === 0 &&
            searchQuery.length > 0 && (
              <div className="stock-empty">No photos found for "{searchQuery}"</div>
            )}
          {!isLoading &&
            activeTab === "vid" && videos.length === 0 &&
            searchQuery.length > 0 && (
              <div className="stock-empty">No videos found for "{searchQuery}"</div>
            )}

          {/* Load more */}
          {(activeTab === "img" || activeTab === "vid") && (
            (activeTab === "img" ? photos.length : videos.length) > 0
          ) && (
            <Button
              className="stock-load-more"
              onClick={() => onLoadMore(activeTab)}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load more"}
            </Button>
          )}
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
