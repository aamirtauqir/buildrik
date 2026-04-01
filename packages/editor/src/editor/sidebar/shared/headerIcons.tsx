/**
 * Header Icons - Shared SVG icons for panel headers
 * Used by PanelHeader and DrillInHeader components
 * @license BSD-3-Clause
 */

import * as React from "react";

/** Pin/unpin icon - rotated pushpin matching design */
export const PinIcon: React.FC<{ isPinned: boolean }> = ({ isPinned }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill={isPinned ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={isPinned ? "aqb-pin-icon--pinned" : "aqb-pin-icon"}
  >
    <path d="M3 6l3-3 4 4-1 3 4 4-1 1-4-4-3 1-4-4 2-2z" />
    <path d="M5 11l-2 2" />
  </svg>
);

/** Help/question mark icon */
export const HelpIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="8" r="6" />
    <path d="M6 6.5a2 2 0 1 1 2 2v1" />
    <circle cx="8" cy="12" r="0.5" fill="currentColor" />
  </svg>
);

/** Close/X icon */
export const CloseIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

/** Back arrow icon (chevron left) */
export const BackArrowIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 12L6 8l4-4" />
  </svg>
);

/** Chevron down icon with rotation support */
export const ChevronIcon: React.FC<{ isOpen?: boolean }> = ({ isOpen = false }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: "transform 0.15s ease",
      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
    }}
  >
    <path d="M3 4.5l3 3 3-3" />
  </svg>
);

/** Checkmark icon */
export const CheckIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginLeft: "auto", color: "var(--aqb-primary)" }}
  >
    <path d="M3 7l3 3 5-5" />
  </svg>
);
