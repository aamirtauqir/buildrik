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

export function LayerSelectionBanner({
  count,
  onGroup,
  onHide,
  onDelete,
  onExit,
}: LayerSelectionBannerProps) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onExit]);

  if (count < 2) return null;

  return (
    <div
      className="aqb-layer-sel-banner"
      role="status"
      aria-live="polite"
      aria-label={`${count} layers selected`}
    >
      <span className="aqb-sel-count">{count} selected</span>
      <button className="aqb-sel-btn" onClick={onGroup} title="Wrap in container (⌘G)">
        Group
      </button>
      <button className="aqb-sel-btn" onClick={onHide} title="Hide all selected">
        Hide
      </button>
      <button
        className="aqb-sel-btn aqb-sel-btn--danger"
        onClick={onDelete}
        title={`Delete ${count} layers`}
      >
        Delete
      </button>
      <button
        className="aqb-sel-btn aqb-sel-btn--muted"
        onClick={onExit}
        title="Exit selection (Esc)"
      >
        Done
      </button>
    </div>
  );
}
