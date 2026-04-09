/**
 * Media Tab — Selection Banner + Upload Progress Banner
 * Bottom bar matching .pen Screen 8i / 8m design.
 * @license BSD-3-Clause
 */

import * as React from "react";

interface SelectionBannerProps {
  count: number;
  onExit(): void;
  onDelete(): void;
}

interface UploadProgressBannerProps {
  fileName: string;
  progress: number; // 0-100
  showCancel?: boolean;
  onCancel?: () => void;
}

export function UploadProgressBanner({ fileName, progress, showCancel = false, onCancel }: UploadProgressBannerProps) {
  return (
    <div className="med-banner--upload">
      <span className="med-banner__label">{fileName}</span>
      <div className="med-progress">
        <div className="med-progress__bar" style={{ width: `${progress}%` }} />
      </div>
      {showCancel && (
        <button className="med-banner__cancel" onClick={onCancel} aria-label="Cancel upload">✕</button>
      )}
    </div>
  );
}

export function SelectionBanner({ count, onExit, onDelete }: SelectionBannerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
      if (e.key === "Delete" && count > 0) onDelete();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, onDelete, count]);

  return (
    <div className="med-selection-banner" role="status" aria-live="polite">
      <span className="med-selection-count">
        {count === 0 ? "No files selected" : `${count} selected`}
      </span>
      <button
        className="med-selection-delete"
        onClick={onDelete}
        disabled={count === 0}
        aria-label={`Delete ${count} selected files`}
      >
        Delete
      </button>
    </div>
  );
}
