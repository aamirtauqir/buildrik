/**
 * Phase 4 T7 triage: keep-as-extension.
 *
 * Rationale: Cascades from Tooltip decision — composes the kept
 * Tooltip extension with a "?" icon trigger. No vibcoder primitive
 * covers this docs-link shape.
 *
 * Phase 5 disposition: when Tooltip ports (Radix.Tooltip-backed
 * vibcoder Tooltip), port HelpTooltip in the same commit. Two
 * consumers; trivial codemod.
 *
 * @license BSD-3-Clause
 */
/**
 * HelpTooltip Component
 * "What's this?" helper for complex properties
 * UX Audit 2026 - Task 9: Help tooltips for inspector
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  IconButton,
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
} from "@/editor/shared/vibcoder";

export interface HelpTooltipProps {
  /** Help text explaining the property */
  content: string;
  /** Optional link to documentation */
  docsLink?: string;
  /** Position of the tooltip */
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
  position = "top",
  size = "sm",
}) => {
  const iconSize = size === "sm" ? 14 : 16;

  const tooltipContent = (
    <div style={{ maxWidth: 220, whiteSpace: "normal", lineHeight: 1.4 }}>
      <span>{content}</span>
      {docsLink && (
        <a
          href={docsLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            marginTop: 4,
            color: "var(--buildrick-accent)",
            fontSize: 12,
            textDecoration: "none",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Learn more →
        </a>
      )}
    </div>
  );

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <IconButton
          variant="ghost"
          size="xs"
          type="button"
          aria-label="What's this?"
          style={buttonStyles}
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
        </IconButton>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent side={position}>{tooltipContent}</TooltipContent>
      </TooltipPortal>
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
  borderRadius: "var(--buildrick-radius-full)",
  color: "var(--buildrick-text-tertiary)",
  cursor: "help",
  transition: "color 0.15s, background 0.15s",
  verticalAlign: "middle",
};

export default HelpTooltip;
