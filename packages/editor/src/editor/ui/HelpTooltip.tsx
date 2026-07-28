/**
 * HelpTooltip Component
 * "What's this?" helper for complex properties
 * UX Audit 2026 - Task 9: Help tooltips for inspector
 *
 * Slice 3 rebuild: rides the ui Tooltip pattern (bk-tooltip surface, hover +
 * focus open, Escape closes) instead of the retired Radix compound. The open
 * state is managed here rather than through <Tooltip label> because the docs
 * link must render inside the tooltip, and label is a plain string.
 *
 * Slice 6B: moved here from src/shared/ui/ — it was already built on ui
 * primitives and had no reason to live outside the library.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "./Button";

export interface HelpTooltipProps {
  /** Help text explaining the property */
  content: string;
  /** Optional link to documentation */
  docsLink?: string;
  /** Accepted and ignored: the ui Tooltip has a single placement by design. */
  position?: "top" | "bottom" | "left" | "right";
  /** Size of the help icon */
  size?: "sm" | "md";
}

/**
 * HelpTooltip - "?" icon that shows explanation on hover
 *
 * Usage:
 * ```tsx
 * <Label>
 *   Display
 *   <HelpTooltip content="Controls how this element flows in the layout." />
 * </Label>
 * ```
 */
export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  docsLink,
  size = "sm",
}) => {
  const iconSize = size === "sm" ? 14 : 16;
  const [open, setOpen] = React.useState(false);
  const tipId = React.useId();

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <Button
        kind="ghost"
        size="sm"
        type="button"
        aria-label="What's this?"
        aria-describedby={open ? tipId : undefined}
        style={buttonStyles}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </Button>
      {open ? (
        <span
          role="tooltip"
          id={tipId}
          className="bk-tooltip"
          style={{ maxWidth: 220, whiteSpace: "normal", lineHeight: 1.4 }}
        >
          <span>{content}</span>
          {docsLink && (
            <a
              href={docsLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                marginTop: 4,
                color: "var(--bk-accent)",
                fontSize: 12,
                textDecoration: "none",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              Learn more →
            </a>
          )}
        </span>
      ) : null}
    </span>
  );
};

const buttonStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 18,
  height: 18,
  padding: 0,
  marginLeft: 4,
  background: "transparent",
  border: "none",
  borderRadius: "var(--bk-radius-full)",
  color: "var(--bk-ink-muted)",
  cursor: "help",
  transition: "color 0.15s, background 0.15s",
  verticalAlign: "middle",
};

export default HelpTooltip;
