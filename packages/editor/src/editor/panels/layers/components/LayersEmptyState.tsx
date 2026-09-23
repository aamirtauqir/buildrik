/**
 * LayersEmptyState — board 4418:83911 (S·Layers · empty; audit G2-063):
 * "No layers yet. Add an element…" and the one accent "Open Add" link — the
 * rail item is Add, not Insert. No icon, no button chrome.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";

interface LayersEmptyStateProps {
  onAddBlockClick?: () => void;
}

export const LayersEmptyState: React.FC<LayersEmptyStateProps> = ({ onAddBlockClick }) => {
  return (
    <div
      className="tw:flex tw:flex-col tw:items-center tw:gap-2.5 tw:px-6 tw:pt-12"
      data-testid="layers-empty"
    >
      <p className="tw:m-0 tw:text-center tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
        No layers yet. Add an element to start building.
      </p>
      {onAddBlockClick && (
        <Button
          type="button"
          color="light"
          size="xs"
          variant="link"
          data-testid="layers-open-add"
          onClick={onAddBlockClick}
        >
          Open Add
        </Button>
      )}
    </div>
  );
};

export default LayersEmptyState;
