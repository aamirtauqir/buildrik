/**
 * Media Tab — Selection Banner
 * Fixed bottom bar during multi-select mode.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useEffect } from "react";

interface SelectionBannerProps {
  count: number;
  onExit(): void;
  onDelete(): void;
}

export function SelectionBanner({ count, onExit, onDelete }: SelectionBannerProps) {
  // Escape exits selection mode; Delete key deletes selected items
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
      if (e.key === "Delete" && count > 0) onDelete();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, onDelete, count]);

  return (
    <div className="med-selection-banner" role="status" aria-live="polite">
      <span className="med-sel-count">
        {count === 0 ? "No files selected" : `${count} selected`}
      </span>
      <div className="med-sel-actions">
        <button className="med-sel-exit" onClick={onExit} aria-label="Exit selection mode">
          Done
        </button>
        <button
          className="med-sel-delete danger"
          onClick={onDelete}
          disabled={count === 0}
          aria-disabled={count === 0}
          aria-label={`Delete ${count} selected files`}
        >
          Delete{count > 0 ? ` (${count})` : ""}
        </button>
      </div>
    </div>
  );
}
