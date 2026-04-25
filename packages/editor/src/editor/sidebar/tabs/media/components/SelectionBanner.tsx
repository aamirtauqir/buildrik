/**
 * Media Tab — Selection Banner (XSWRz spec)
 * Fill cobalt-accent-tint, Move/Download/Deselect all/More buttons
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
  progress: number;
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
      {(showCancel || onCancel != null) && (
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
      <span className="med-selection-count">{count} selected</span>
      <button className="med-selection-action">Move</button>
      <button className="med-selection-action">Download</button>
      <span className="med-strip-spacer" />
      <button className="med-selection-secondary" onClick={onExit}>Deselect all</button>
      <button className="med-selection-more">More</button>
    </div>
  );
}
