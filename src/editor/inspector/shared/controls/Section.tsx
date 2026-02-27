/**
 * Section - Collapsible section wrapper for Pro Inspector
 * Supports both controlled and uncontrolled modes
 * @license BSD-3-Clause
 */

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
  children,
}) => {
  const [internalIsOpen, setInternalIsOpen] = React.useState(defaultOpen);

  // Use controlled state if provided, otherwise use internal state
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // Sync internal state when controlled prop changes
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

  return (
    <div style={baseStyles.section}>
      <button
        style={baseStyles.sectionHeader(isOpen)}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={`section-content-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && (
            <span style={{ display: "flex", alignItems: "center" }}>
              {/* Check if icon is a Lucide icon name (PascalCase) or emoji */}
              {typeof icon === "string" && /^[A-Z]/.test(icon) ? (
                <Icon name={icon as IconName} size="sm" color="inherit" />
              ) : (
                icon
              )}
            </span>
          )}
          {title}
        </span>
        <span
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
            fontSize: 10,
          }}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div
          id={`section-content-${title.toLowerCase().replace(/\s+/g, "-")}`}
          style={baseStyles.sectionContent}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Section;
