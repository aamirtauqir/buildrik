/**
 * Section — collapsible section wrapper (ported to .bdi-sec)
 * Supports controlled + uncontrolled modes.
 * @license BSD-3-Clause
 */

import { ChevronDown } from "lucide-react";
import * as React from "react";

// ============================================================================
// TYPES
// ============================================================================

export type SectionTier = "primary" | "secondary" | "tertiary";

export interface SectionProps {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  id?: string;
  /** Pill shown on the right of the header when collapsed (indicator) */
  preview?: React.ReactNode;
  /** Optional "+" action in header (e.g., Add background, Add effect) */
  action?: React.ReactNode;
  /** Retained for backwards compat; new design treats all sections uniformly */
  tier?: SectionTier;
  children: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Section: React.FC<SectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  id,
  preview,
  action,
  children,
}) => {
  const [internalIsOpen, setInternalIsOpen] = React.useState(defaultOpen);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  React.useEffect(() => {
    if (isControlled) {
      setInternalIsOpen(controlledIsOpen);
    }
  }, [isControlled, controlledIsOpen]);

  const handleToggle = () => {
    const newState = !isOpen;
    if (!isControlled) {
      setInternalIsOpen(newState);
    }
    onToggle?.(newState);
  };

  const contentId = `section-content-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className={`bdi-sec${isOpen ? "" : " closed"}`} id={id}>
      {/* The header row is a container. The TOGGLE inside it carries the
          button role, and the action slot (e.g. BackgroundSection's bdi-plus,
          which is a real button) is its SIBLING — not its child.

          It was one div+role=button wrapping both, to keep <button> out of
          <button>; that trades a React DOM warning for a worse thing, a
          control with focusable descendants (axe nested-interactive, serious),
          where the action button sat inside the announced toggle. Siblings cost
          nothing and both are reachable. (A real <button> here would inherit
          flowbite's own height — measured, the header row grew by twenty
          points — and Gate 24 keeps raw <button> out of chrome, so the role
          stays on a span.) */}
      <div className="bdi-sec-h">
        <span
          role="button"
          tabIndex={0}
          className="tw:flex-1 tw:min-w-0 tw:flex tw:items-center tw:gap-1.5 tw:cursor-pointer tw:text-left"
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleToggle();
            }
          }}
          aria-expanded={isOpen}
          aria-controls={contentId}
          aria-label={`${title} section, ${isOpen ? "expanded" : "collapsed"}`}
        >
          <span className="bdi-sec-name">{title}</span>
          {/* A summary of what is inside is worth a line only while it is shut.
              Open, the rows say it better, and the boards' expanded headers
              (807:8342, 807:8567) carry nothing but their chevron. */}
          {!isOpen && preview && <span className="bdi-sec-preview tw:flex-[0_1_auto] tw:min-w-0 tw:overflow-hidden tw:whitespace-nowrap tw:text-ellipsis tw:text-[length:var(--bk-text-11)] tw:font-normal tw:[font-family:var(--bk-font-mono)] tw:text-[var(--bk-ink-muted)]">{preview}</span>}
          {/* Figma 32-2: chevron sits on the RIGHT of the uppercase section label. */}
          <span className="bdi-chev">
            <ChevronDown size={11} aria-hidden="true" />
          </span>
        </span>
        {action && <span className="tw:inline-flex tw:items-center tw:shrink-0">{action}</span>}
      </div>
      {isOpen && (
        <div id={contentId} className="bdi-sec-body">
          {children}
        </div>
      )}
    </div>
  );
};

export default Section;
