/**
 * LayerSelectionBanner - Bulk action bar shown when 2+ layers are selected.
 * Props-only, no hook imports. Escape closes via keyboard listener.
 * @license BSD-3-Clause
 */
import * as React from "react";

interface LayerSelectionBannerProps {
  count: number;
  onGroup: () => void;
  onHide: () => void;
  onDelete: () => void;
  onExit: () => void;
}

export const LayerSelectionBanner: React.FC<LayerSelectionBannerProps> = ({
  count,
  onGroup,
  onHide,
  onDelete,
  onExit,
}) => {
  React.useEffect(() => {
    if (count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, onExit]);

  if (count < 2) return null;
  return (
    <div className="bdc-layers-banner" role="toolbar" aria-label="Selection actions">
      <span className="bdc-layers-banner-count">{count} selected</span>
      <button className="bdc-icon-btn" title="Group" aria-label="Group" onClick={onGroup}>
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      </button>
      <button className="bdc-icon-btn" title="Hide" aria-label="Hide" onClick={onHide}>
        <svg viewBox="0 0 24 24">
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      </button>
      <button className="bdc-icon-btn" title="Delete" aria-label="Delete" onClick={onDelete}>
        <svg viewBox="0 0 24 24">
          <path d="M4 7h16 M6 7v13a2 2 0 002 2h8a2 2 0 002-2V7 M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
        </svg>
      </button>
      <button className="bdc-icon-btn" title="Done" aria-label="Done" onClick={onExit}>
        <svg viewBox="0 0 24 24">
          <path d="M6 6l12 12 M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
};
