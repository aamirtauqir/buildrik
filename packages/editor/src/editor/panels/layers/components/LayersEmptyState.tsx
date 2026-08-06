/**
 * LayersEmptyState — board 143:355 (Layers · empty): two centered muted
 * lines and the one accent "Open Insert" link. No icon, no button chrome.
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
        This page is empty. Drop something on the canvas to see it here.
      </p>
      {onAddBlockClick && (
        <Button
          type="button"
          color="light"
          size="xs"
          className="tw:min-h-0 tw:border-0 tw:bg-transparent tw:p-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-accent-text)] tw:shadow-none tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
          data-testid="layers-open-insert"
          onClick={onAddBlockClick}
        >
          Open Insert
        </Button>
      )}
    </div>
  );
};

export default LayersEmptyState;
