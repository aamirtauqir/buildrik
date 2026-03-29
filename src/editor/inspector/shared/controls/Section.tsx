/**
 * Section - Collapsible section wrapper for Pro Inspector
 * Supports both controlled and uncontrolled modes
 * @license BSD-3-Clause
 */

import { ChevronDown } from "lucide-react";
import * as React from "react";
import { Icon, type IconName } from "../../../../shared/ui";
import { baseStyles } from "./controlStyles";

// ============================================================================
// TYPES
// ============================================================================

export interface SectionProps {
  title: string;
  /** Icon - either an emoji string or a Lucide icon name */
  icon?: string | IconName;
  /** Initial open state for uncontrolled mode */
  defaultOpen?: boolean;
  /** Controlled open state - overrides defaultOpen when provided */
  isOpen?: boolean;
  /** Callback when section is toggled */
  onToggle?: (isOpen: boolean) => void;
  /** ID placed on root div — used by sub-nav scroll anchors */
  id?: string;
  /** Preview shown next to label when section is collapsed */
  preview?: React.ReactNode;
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
  children,
}) => {
  const [internalIsOpen, setInternalIsOpen] = React.useState(defaultOpen);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // Sync internal state when controlled prop changes
  // Note: L-03 — this sync may cause an extra render; tracked in backlog
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
    <div style={baseStyles.section} id={id}>
      <button
        style={baseStyles.sectionHeader(isOpen)}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        aria-label={`${title} section, ${isOpen ? "expanded" : "collapsed"}`}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && (
            <span style={{ display: "flex", alignItems: "center" }}>
              {typeof icon === "string" && /^[A-Z]/.test(icon) ? (
                <Icon name={icon as IconName} size="sm" color="inherit" />
              ) : (
                icon
              )}
            </span>
          )}
          {title}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!isOpen && preview && (
            <span aria-hidden="true" style={{ display: "flex", alignItems: "center" }}>
              {preview}
            </span>
          )}
          <ChevronDown
            size={12}
            aria-hidden={true}
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              color: "var(--aqb-text-tertiary)",
            }}
          />
        </span>
      </button>
      {isOpen && (
        <div id={contentId} style={baseStyles.sectionContent}>
          {children}
        </div>
      )}
    </div>
  );
};

export default Section;
