/**
 * SnapshotPreview - Hover tooltip showing version thumbnail
 * Phase 4: Visual snapshot preview on version row hover
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface SnapshotPreviewProps {
  snapshotUrl: string;
  versionName: string;
  anchorRect: DOMRect;
}

export const SnapshotPreview: React.FC<SnapshotPreviewProps> = ({
  snapshotUrl,
  versionName,
  anchorRect,
}) => {
  // Position above the anchor element, clamping to viewport
  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(anchorRect.right + 8, window.innerWidth - 170),
    top: Math.max(0, anchorRect.top),
    zIndex: 100,
    width: 160,
    pointerEvents: "none",
    animation: "fadeIn 150ms ease-out",
  };

  return (
    <div className="snapshot-preview" style={style}>
      <img src={snapshotUrl} alt={versionName} />
    </div>
  );
};
