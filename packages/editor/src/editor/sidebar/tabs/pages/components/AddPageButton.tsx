/**
 * AddPageButton — Sticky "+ Add Page" button at the bottom of the page list.
 * Shows a popover with "Blank page" and "From template" options (Pencil screens c0ad1, QHkn0).
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface AddPageButtonProps {
  onAddBlank: () => void;
  onFromTemplate?: () => void;
}

export const AddPageButton: React.FC<AddPageButtonProps> = ({ onAddBlank, onFromTemplate }) => {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="pg-add-wrapper" ref={wrapperRef}>
      <button className="pg-add-btn" onClick={() => setOpen(!open)} aria-label="Add new page" aria-expanded={open} aria-haspopup="menu">
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Page
      </button>
      {open && (
        <div className="pg-add-popover" role="menu">
          <button
            className="pg-add-option"
            role="menuitem"
            onClick={() => { onAddBlank(); setOpen(false); }}
          >
            Blank page
          </button>
          {onFromTemplate && (
            <button
              className="pg-add-option"
              role="menuitem"
              onClick={() => { onFromTemplate(); setOpen(false); }}
            >
              From template
            </button>
          )}
        </div>
      )}
    </div>
  );
};
