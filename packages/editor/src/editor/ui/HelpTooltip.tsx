/**
 * HelpTooltip Component
 * "What's this?" helper for complex properties
 * UX Audit 2026 - Task 9: Help tooltips for inspector
 *
 * Slice 3 rebuild: rides the ui Tooltip pattern (hover + focus open, Escape
 * closes) instead of the retired Radix compound.
 *
 * Slice 6B: moved here from src/shared/ui/ — it was already built on ui
 * primitives and had no reason to live outside the library.
 *
 * Flowbite swap (Task 5): rides flowbite-react's Tooltip directly. Hover,
 * focus and Escape-to-dismiss are all built in — @floating-ui/react's
 * useFocus is unconditionally wired regardless of `trigger`, verified live in
 * flowbite-parity.test.tsx — so the manual open-state/aria-describedby
 * bookkeeping this component used to do by hand is gone. flowbite's
 * `content` is a ReactNode slot, so the docs link composes directly instead
 * of needing a second controlled element.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Tooltip } from "flowbite-react";

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

  return (
    <Tooltip
      arrow={false}
      className="tw:max-w-[220px] tw:whitespace-normal tw:leading-[1.4]"
      content={
        <>
          {content}
          {docsLink && (
            <a
              href={docsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:mt-1 tw:block tw:text-[12px] tw:text-[#1A56DB] tw:no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              Learn more →
            </a>
          )}
        </>
      }
    >
      <Button
        color="light"
        size="xs"
        type="button"
        aria-label="What's this?"
        style={buttonStyles}
        className="tw:border-transparent tw:bg-transparent"
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
    </Tooltip>
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
