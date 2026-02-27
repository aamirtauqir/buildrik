/**
 * Flexbox Direction Icons
 * Visual SVG icons for flex-direction options
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================================================
// DIRECTION ICONS - Visual representation of flex-direction
// ============================================================================

export const DirectionIcon: React.FC<{ direction: string }> = ({ direction }) => {
  switch (direction) {
    case "row":
      return (
        <svg width="20" height="14" viewBox="0 0 20 14">
          <rect x="1" y="4" width="4" height="6" rx="1" fill="currentColor" opacity="0.9" />
          <rect x="8" y="4" width="4" height="6" rx="1" fill="currentColor" opacity="0.6" />
          <rect x="15" y="4" width="4" height="6" rx="1" fill="currentColor" opacity="0.3" />
          <path
            d="M17 11L19 7L17 3"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case "column":
      return (
        <svg width="14" height="20" viewBox="0 0 14 20">
          <rect x="4" y="1" width="6" height="4" rx="1" fill="currentColor" opacity="0.9" />
          <rect x="4" y="8" width="6" height="4" rx="1" fill="currentColor" opacity="0.6" />
          <rect x="4" y="15" width="6" height="4" rx="1" fill="currentColor" opacity="0.3" />
          <path
            d="M3 17L7 19L11 17"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case "row-reverse":
      return (
        <svg width="20" height="14" viewBox="0 0 20 14">
          <rect x="15" y="4" width="4" height="6" rx="1" fill="currentColor" opacity="0.9" />
          <rect x="8" y="4" width="4" height="6" rx="1" fill="currentColor" opacity="0.6" />
          <rect x="1" y="4" width="4" height="6" rx="1" fill="currentColor" opacity="0.3" />
          <path
            d="M3 11L1 7L3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case "column-reverse":
      return (
        <svg width="14" height="20" viewBox="0 0 14 20">
          <rect x="4" y="15" width="6" height="4" rx="1" fill="currentColor" opacity="0.9" />
          <rect x="4" y="8" width="6" height="4" rx="1" fill="currentColor" opacity="0.6" />
          <rect x="4" y="1" width="6" height="4" rx="1" fill="currentColor" opacity="0.3" />
          <path
            d="M3 3L7 1L11 3"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
};

export default DirectionIcon;
