import { IconButton, Menu, MenuItem, POPOVER_BASE_CLASS, Button} from "@/editor/chrome-ui";
/**
 * AddPageButton — sticky cobalt CTA in pages footer.
 *
 * "From template" is a visible sibling of "+ Add page" (founder call
 * 2026-08-28): buried in the ⋮ overflow, the template route was invisible —
 * this walk's own probe missed it there. The overflow (⋮) keeps only
 * "New folder".
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useClickOutside } from "@/shared/hooks";

export interface AddPageButtonProps {
  onAddBlank: () => void;
  onFromTemplate?: () => void;
  onAddFolder?: () => void;
}

export const AddPageButton: React.FC<AddPageButtonProps> = ({
  onAddBlank,
  onFromTemplate,
  onAddFolder,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(wrapRef, () => setMenuOpen(false), { enabled: menuOpen });

  const hasOverflow = !!onAddFolder;

  /* gap 12, not 4 — at 4px "+ Add page" and "From template" read as one
     run-on phrase (designer walk 2026-08-28). */
  return (
    <div ref={wrapRef} style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
      {/* Board 140:38-39: "+  Add page" is a plain accent text link — no
          filled pill. */}
      <Button
        type="button"
        color="light"
        size="xs"
        onClick={onAddBlank}
        aria-label="Add new page"
        variant="link"
      >
        +&nbsp;&nbsp;Add page
      </Button>
      {onFromTemplate && (
        <Button
          type="button"
          color="light"
          size="xs"
          onClick={onFromTemplate}
          variant="link" className="tw:text-[var(--bk-ink-soft)] tw:enabled:hover:text-[var(--bk-ink)]"
        >
          From template
        </Button>
      )}
      {hasOverflow && (
        <>
          <IconButton
            label="More add options"
            size="sm"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: 14, height: 14 }}>
              <circle cx="5" cy="12" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="19" cy="12" r="1.6" />
            </svg>
          </IconButton>
          {menuOpen && (
            <div
              className={POPOVER_BASE_CLASS}
              role="presentation"
              style={{ position: "absolute", bottom: "calc(100% + 4px)", right: 0, zIndex: 10 }}
            >
              <Menu label="More add options">
                {onAddFolder && (
                  <MenuItem
                    onClick={() => {
                      onAddFolder();
                      setMenuOpen(false);
                    }}
                  >
                    New folder
                  </MenuItem>
                )}
              </Menu>
            </div>
          )}
        </>
      )}
    </div>
  );
};
