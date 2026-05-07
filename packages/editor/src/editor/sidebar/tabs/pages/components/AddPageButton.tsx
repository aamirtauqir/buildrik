import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * AddPageButton — sticky cobalt CTA in pages footer.
 * Overflow (⋮) menu reveals secondary actions: "From template" + "New folder".
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

  const hasOverflow = !!onFromTemplate || !!onAddFolder;

  return (
    <div className="bd-pg-add-wrap" ref={wrapRef}>
      <Button
        type="button"
        className="bd-pg-add"
        onClick={onAddBlank}
        aria-label="Add new page"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add page
      </Button>
      {hasOverflow && (
        <Button
          type="button"
          className="bd-pg-add-overflow"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="More add options"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="19" cy="12" r="1.6" />
          </svg>
        </Button>
      )}
      {menuOpen && hasOverflow && (
        <div className="bd-pg-add-popover" role="menu">
          {onFromTemplate && (
            <Button
              type="button"
              className="bd-pg-add-option"
              role="menuitem"
              onClick={() => {
                onFromTemplate();
                setMenuOpen(false);
              }}
            >
              From template
            </Button>
          )}
          {onAddFolder && (
            <Button
              type="button"
              className="bd-pg-add-option"
              role="menuitem"
              onClick={() => {
                onAddFolder();
                setMenuOpen(false);
              }}
            >
              New folder
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
