import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * LayersEmptyState - Empty state for Layers panel when canvas has no elements.
 * @license BSD-3-Clause
 */

import * as React from "react";

interface LayersEmptyStateProps {
  onAddBlockClick?: () => void;
}

export const LayersEmptyState: React.FC<LayersEmptyStateProps> = ({ onAddBlockClick }) => {
  return (
    <div className="bdc-layers-empty">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4" width="14" height="4" rx="1" />
        <rect x="7" y="10" width="14" height="4" rx="1" />
        <rect x="3" y="16" width="14" height="4" rx="1" />
      </svg>
      <h3>No layers yet</h3>
      <p>Drop in a block to get started.</p>
      {onAddBlockClick && (
        <Button className="bdc-btn bdc-primary" onClick={onAddBlockClick}>
          Browse blocks
        </Button>
      )}
    </div>
  );
};

export default LayersEmptyState;
