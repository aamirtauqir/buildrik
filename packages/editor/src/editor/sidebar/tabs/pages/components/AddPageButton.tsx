/**
 * AddPageButton — Sticky primary "+ Add Page" in footer.
 * Overflow menu (⋮) reveals "From template" + "New folder".
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface AddPageButtonProps {
  onAddBlank: () => void;
  onFromTemplate?: () => void;
  onAddFolder?: () => void;
}

export const AddPageButton: React.FC<AddPageButtonProps> = ({ onAddBlank, onFromTemplate, onAddFolder }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const hasOverflow = !!onFromTemplate || !!onAddFolder;

  return (
    <div className="pg-add-wrap" ref={wrapRef}>
      <button className="pg-add-primary" onClick={onAddBlank} aria-label="Add new page">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Page
      </button>

      {hasOverflow && (
        <button
          className="pg-add-overflow"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="More add options"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="19" cy="12" r="1.6" />
          </svg>
        </button>
      )}

      {menuOpen && hasOverflow && (
        <div className="pg-add-popover" role="menu">
          {onFromTemplate && (
            <button className="pg-add-option" role="menuitem" onClick={() => { onFromTemplate(); setMenuOpen(false); }}>
              From template
            </button>
          )}
          {onAddFolder && (
            <button className="pg-add-option" role="menuitem" onClick={() => { onAddFolder(); setMenuOpen(false); }}>
              New folder
            </button>
          )}
        </div>
      )}
    </div>
  );
};
