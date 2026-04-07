/**
 * AddPageButton — Sticky "+ Add Page" button at the bottom of the page list.
 * @license BSD-3-Clause
 */

import * as React from "react";

interface Props {
  onClick: () => void;
}

export const AddPageButton: React.FC<Props> = ({ onClick }) => (
  <button className="pg-add-btn" onClick={onClick} aria-label="Add new page">
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
);
