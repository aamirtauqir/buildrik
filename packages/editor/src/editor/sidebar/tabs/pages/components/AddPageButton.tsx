import { Button } from "@/editor/shared/vibcoder/Button";
import { IconButton } from "@/editor/shared/vibcoder/IconButton";
import { Menu, MenuItem } from "@/editor/shared/vibcoder/Menu";
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
    <div ref={wrapRef} style={{ display: "flex", alignItems: "center", gap: 4, position: "relative" }}>
      <Button type="button" variant="primary" size="sm" onClick={onAddBlank} aria-label="Add new page">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" style={{ width: 14, height: 14 }}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add page
      </Button>
      {hasOverflow && (
        <>
          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="More add options"
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
            <Menu style={{ position: "absolute", bottom: "calc(100% + 4px)", right: 0, zIndex: 10 }}>
              {onFromTemplate && (
                <MenuItem
                  type="button"
                  onClick={() => {
                    onFromTemplate();
                    setMenuOpen(false);
                  }}
                >
                  From template
                </MenuItem>
              )}
              {onAddFolder && (
                <MenuItem
                  type="button"
                  onClick={() => {
                    onAddFolder();
                    setMenuOpen(false);
                  }}
                >
                  New folder
                </MenuItem>
              )}
            </Menu>
          )}
        </>
      )}
    </div>
  );
};
