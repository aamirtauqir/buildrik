/**
 * Media Tab — Discovery View
 * Browse stock photos, videos, icons, and Google Fonts.
 * Sections rendered inline — no pass-through sub-components.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { DISC_SECTION_LABELS } from "./mediaData";
import type { DiscIcon, DiscoveryViewProps, StockPhoto, StockVideo } from "./mediaTypes";
import { fmtDur } from "./mediaUtils";

// ─── Inline section renderers ────────────────────────────────────────────────

function PhotoGrid({
  photos,
  loading,
  onSave,
  onLoadMore,
}: {
  photos: StockPhoto[];
  loading: boolean;
  onSave(item: StockPhoto): void;
  onLoadMore(): void;
}) {
  if (loading && photos.length === 0) {
    return (
      <div className="med-empty">
        <span className="med-empty-sub">Loading…</span>
      </div>
    );
  }
  if (photos.length === 0) {
    return (
      <div className="med-empty">
        <span className="med-empty-sub">Search for stock photos above.</span>
      </div>
    );
  }
  return (
    <>
      <div className="med-grid" data-cols="3">
        {photos.map((p) => (
          <div key={p.id} className="med-img-card" role="button" tabIndex={0} aria-label={p.alt}>
            <div className="med-img-card-bg">
              <img src={p.thumb} alt={p.alt} loading="lazy" />
            </div>
            <div className="med-img-overlay" />
            <div className="med-img-meta">
              <div className="med-img-size">{p.author}</div>
            </div>
            <button
              className="med-insert-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSave(p);
              }}
              aria-label="Save to library"
            >
              Save
            </button>
          </div>
        ))}
      </div>
      {photos.length > 0 && (
        <div style={{ padding: "6px 10px 10px" }}>
          <button
            className="med-upload-btn"
            onClick={onLoadMore}
            disabled={loading}
            style={{ height: 28 }}
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}

function VideoGrid({
  videos,
  loading,
  onSave,
  onLoadMore,
}: {
  videos: StockVideo[];
  loading: boolean;
  onSave(item: StockVideo): void;
  onLoadMore(): void;
}) {
  if (loading && videos.length === 0) {
    return (
      <div className="med-empty">
        <span className="med-empty-sub">Loading…</span>
      </div>
    );
  }
  if (videos.length === 0) {
    return (
      <div className="med-empty">
        <span className="med-empty-sub">Search for stock videos above.</span>
      </div>
    );
  }
  return (
    <>
      <div className="med-grid" data-cols="2">
        {videos.map((v) => (
          <div
            key={v.id}
            className="med-vid-card"
            role="button"
            tabIndex={0}
            aria-label={`Video by ${v.author}`}
          >
            <div className="med-img-card-bg">
              <img src={v.thumb} alt={`Video by ${v.author}`} loading="lazy" />
            </div>
            <div className="med-vid-play">
              <svg viewBox="0 0 24 24">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            </div>
            <div className="med-vid-dur">{fmtDur(v.duration)}</div>
            <button
              className="med-insert-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSave(v);
              }}
              aria-label="Save to library"
            >
              Save
            </button>
          </div>
        ))}
      </div>
      {videos.length > 0 && (
        <div style={{ padding: "6px 10px 10px" }}>
          <button
            className="med-upload-btn"
            onClick={onLoadMore}
            disabled={loading}
            style={{ height: 28 }}
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}

function IconGrid({ icons, onInsert }: { icons: DiscIcon[]; onInsert(filename: string): void }) {
  if (icons.length === 0) {
    return (
      <div className="med-empty">
        <span className="med-empty-sub">No icons found.</span>
      </div>
    );
  }
  return (
    <div className="med-ico-grid">
      {icons.map((ico) => (
        <div
          key={ico.id}
          className="med-ico-card"
          onClick={() => onInsert(ico.id)}
          role="button"
          tabIndex={0}
          aria-label={ico.name}
          title={ico.name}
        >
          <img src={ico.svgDataUrl} alt={ico.name} width="16" height="16" />
          <span className="med-ico-label">{ico.name}</span>
        </div>
      ))}
    </div>
  );
}

function FontList({
  fonts,
  onInsert,
}: {
  fonts: import("./mediaTypes").DiscFont[];
  onInsert(filename: string): void;
}) {
  if (fonts.length === 0) {
    return (
      <div className="med-empty">
        <span className="med-empty-sub">Search for Google Fonts above.</span>
      </div>
    );
  }
  return (
    <div className="med-fnt-list">
      {fonts.map((f) => (
        <div key={f.id} className="med-fnt-card" role="button" tabIndex={0} aria-label={f.family}>
          <div className="med-fnt-top">
            <span className="med-fnt-name">{f.family}</span>
            <span className="med-disc-badge gfonts">{f.category}</span>
            <button
              className="med-insert-btn"
              style={{ position: "static", display: "flex" }}
              onClick={() => onInsert(f.id)}
              aria-label="Use font"
            >
              Use
            </button>
          </div>
          <div className="med-fnt-preview" style={{ fontFamily: f.family }}>
            Aa Bb Cc 123
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export function DiscoveryView({
  activeType,
  photos,
  videos,
  icons,
  fonts,
  loading,
  searchQuery,
  onSearch,
  onLoadMore,
  onSave,
  onInsert,
}: DiscoveryViewProps) {
  const showAll = activeType === "all";

  return (
    <div className="med-discovery-view" style={{ flex: 1, overflowY: "auto" }}>
      {/* Shared search for discovery */}
      <div className="med-search-row">
        <div className="med-search">
          <svg
            className="med-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search stock media…"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Search discovery"
          />
        </div>
      </div>

      {/* Photos */}
      {(showAll || activeType === "img") && (
        <>
          <div className="med-sec-hdr">
            <span className="med-sec-label">{DISC_SECTION_LABELS.img}</span>
            <span className="med-disc-badge unsplash">Unsplash</span>
            <div className="med-sec-spacer" />
            {loading.img && (
              <span className="med-empty-sub" style={{ fontSize: 9 }}>
                Loading…
              </span>
            )}
          </div>
          <PhotoGrid
            photos={photos}
            loading={loading.img}
            onSave={(p) => onSave("img", p)}
            onLoadMore={() => onLoadMore("img")}
          />
        </>
      )}

      {/* Videos */}
      {(showAll || activeType === "vid") && (
        <>
          <div className="med-sec-hdr">
            <span className="med-sec-label">{DISC_SECTION_LABELS.vid}</span>
            <span className="med-disc-badge pexels">Pexels</span>
            <div className="med-sec-spacer" />
            {loading.vid && (
              <span className="med-empty-sub" style={{ fontSize: 9 }}>
                Loading…
              </span>
            )}
          </div>
          <VideoGrid
            videos={videos}
            loading={loading.vid}
            onSave={(v) => onSave("vid", v)}
            onLoadMore={() => onLoadMore("vid")}
          />
        </>
      )}

      {/* Icons */}
      {(showAll || activeType === "ico") && (
        <>
          <div className="med-sec-hdr">
            <span className="med-sec-label">{DISC_SECTION_LABELS.ico}</span>
            <span className="med-disc-badge iconlib">Library</span>
          </div>
          <IconGrid icons={icons} onInsert={onInsert} />
        </>
      )}

      {/* Fonts */}
      {(showAll || activeType === "fnt") && (
        <>
          <div className="med-sec-hdr">
            <span className="med-sec-label">{DISC_SECTION_LABELS.fnt}</span>
            <span className="med-disc-badge gfonts">Google Fonts</span>
          </div>
          <FontList fonts={fonts} onInsert={onInsert} />
        </>
      )}
    </div>
  );
}
