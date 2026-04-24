/**
 * Section — collapsible section wrapper (ported to .bdi-sec)
 * Supports controlled + uncontrolled modes.
 * @license BSD-3-Clause
 */

import { ChevronDown } from "lucide-react";
import * as React from "react";
import type { IconName } from "../../../../shared/ui";

// ============================================================================
// TYPES
// ============================================================================

export type SectionTier = "primary" | "secondary" | "tertiary";

export interface SectionProps {
  title: string;
  icon?: string | IconName;
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
      <button
        type="button"
        className="bdi-sec-h"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        aria-label={`${title} section, ${isOpen ? "expanded" : "collapsed"}`}
      >
        <span className="bdi-chev">
          <ChevronDown size={9} aria-hidden="true" />
        </span>
        <span className="bdi-sec-name">{title}</span>
        {preview && <span className="bdi-sec-preview">{preview}</span>}
        {action && (
          <span
            onClick={(e) => e.stopPropagation()}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            {action}
          </span>
        )}
      </button>
      {isOpen && (
        <div id={contentId} className="bdi-sec-body">
          {children}
        </div>
      )}
    </div>
  );
};

export default Section;
