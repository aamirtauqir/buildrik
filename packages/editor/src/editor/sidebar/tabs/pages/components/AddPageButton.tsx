import { Button } from "@/editor/chrome-ui";
/**
 * AddPageButton — the Pages footer, design-2l9 board 63:6393: a full-width
 * outlined "+ Add page", and under it "From template" and "New folder" side
 * by side. (New folder sat in a ⋯ overflow; the board draws it in the open.)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface AddPageButtonProps {
  onAddBlank: () => void;
  onFromTemplate?: () => void;
  onAddFolder?: () => void;
  /** Set while page creation must wait (the project is still loading): both
   *  create buttons are disabled and carry this as their reason. */
  disabledReason?: string;
}

const SECONDARY =
  "tw:h-7 tw:flex-1 tw:justify-center tw:border-transparent tw:bg-transparent tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0 tw:enabled:hover:bg-[var(--bk-bg-subtle)]";

export const AddPageButton: React.FC<AddPageButtonProps> = ({ onAddBlank, onFromTemplate, onAddFolder, disabledReason }) => (
  <div className="tw:flex tw:flex-col tw:gap-1 tw:px-2 tw:py-2">
    <Button
      type="button"
      color="light"
      size="xs"
      onClick={onAddBlank}
      disabled={!!disabledReason}
      title={disabledReason}
      aria-label="Add new page"
      data-testid="pages-add-page"
      className="tw:h-8 tw:w-full tw:justify-center tw:rounded-md tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0"
    >
      + Add page
    </Button>
    {(onFromTemplate || onAddFolder) && (
      <div className="tw:flex">
        {onFromTemplate && (
          <Button
            type="button"
            color="light"
            size="xs"
            onClick={onFromTemplate}
            disabled={!!disabledReason}
            title={disabledReason}
            className={SECONDARY}
            data-testid="pages-from-template"
          >
            From template
          </Button>
        )}
        {onAddFolder && (
          <Button type="button" color="light" size="xs" onClick={onAddFolder} className={SECONDARY} data-testid="pages-new-folder">
            New folder
          </Button>
        )}
      </div>
    )}
  </div>
);
