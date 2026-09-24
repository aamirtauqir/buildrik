/**
 * RenameUrlDecision — boards 4418:91805 / 6881:94598 / 6887:78797 (G2-076).
 * A rename that would move the page's URL asks first: "URL: /about →
 * /our-story?" · Keep URL · Update URL · Cancel rename. The URL used to stay
 * put silently, so a rename never told anyone its address was now stale.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";

interface RenameUrlDecisionProps {
  pageId: string;
  fromSlug: string;
  toSlug: string;
  onKeep: () => void;
  onUpdate: () => void;
  onCancel: () => void;
}

/* Keep the rename input's blur from committing before the choice lands. */
const keepFocus = (e: React.MouseEvent) => e.preventDefault();

export function RenameUrlDecision({ pageId, fromSlug, toSlug, onKeep, onUpdate, onCancel }: RenameUrlDecisionProps) {
  return (
    <div
      className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:pb-2 tw:pt-1"
      data-testid={`page-rename-url-${pageId}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-soft)]">
        {`URL: /${fromSlug} → /${toSlug}?`}
      </span>
      <div className="tw:flex tw:items-center tw:gap-2">
        <Button type="button" size="xs" variant="ghost" onMouseDown={keepFocus} onClick={onKeep} data-testid="page-rename-keep-url">
          Keep URL
        </Button>
        <Button type="button" size="xs" variant="primary" onMouseDown={keepFocus} onClick={onUpdate} data-testid="page-rename-update-url">
          Update URL
        </Button>
      </div>
      <Button
        type="button"
        size="xs"
        variant="ghost"
        className="tw:self-start tw:text-[var(--bk-ink)]"
        onMouseDown={keepFocus}
        onClick={onCancel}
        data-testid="page-rename-cancel"
      >
        Cancel rename
      </Button>
    </div>
  );
}
