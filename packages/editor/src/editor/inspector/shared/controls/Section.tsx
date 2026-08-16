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
      {/* Rendered as div+role=button rather than <button> so sibling action
          slots (e.g. BackgroundSection's bdi-plus) can contain their own
          <button> without nesting <button> inside <button> — React DOM
          validation flagged this at runtime on Container selection. */}
      <div
        role="button"
        tabIndex={0}
        className="bdi-sec-h"
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
        {!isOpen && preview && <span className="bdi-sec-preview tw:flex-[0_1_auto] tw:min-w-0 tw:overflow-hidden tw:whitespace-nowrap tw:text-ellipsis tw:text-[10.5px] tw:font-normal tw:[font-family:var(--bk-font-mono)] tw:text-[var(--bk-ink-muted)]">{preview}</span>}
        {action && (
          <span
            onClick={(e) => e.stopPropagation()}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            {action}
          </span>
        )}
        {/* Figma 32-2: chevron sits on the RIGHT of the uppercase section label. */}
        <span className="bdi-chev">
          <ChevronDown size={11} aria-hidden="true" />
        </span>
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
