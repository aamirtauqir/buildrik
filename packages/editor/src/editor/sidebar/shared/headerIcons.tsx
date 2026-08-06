/**
 * Header Icons - Shared SVG icons for panel headers
 * Used by ViewSwitcher and DrillInHeader
 * @license BSD-3-Clause
 */

import * as React from "react";

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
    style={{ marginLeft: "auto", color: "var(--bk-accent)" }}
  >
    <path d="M3 7l3 3 5-5" />
  </svg>
);
