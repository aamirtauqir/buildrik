/**
 * DrillInHeader - "← Back to [Parent]" header for drill-in screens
 * Shows breadcrumb path and back button for nested navigation
 * @license BSD-3-Clause
 */

import * as React from "react";
import { BackArrowIcon } from "./headerIcons";
import { drillInHeaderContainerStyles } from "./headerStyles";
import { HeaderActions } from "./PanelHeader";

export interface DrillInHeaderProps {
  /** Current screen title (e.g., "Elements") */
  title: string;
  /** Parent screen name (e.g., "Build") */
  parentName: string;
  /** Breadcrumb path (e.g., ["Build", "Elements"]) */
  breadcrumb?: string[];
  /** Callback when back button is clicked (and no dirty state) */
  onBack: () => void;
  /** True if the current screen has unsaved changes */
  isDirty?: boolean;
  /** Fires instead of onBack when isDirty=true — use to show an unsaved-changes guard */
  onBackAttempt?: () => void;
  /** Whether the panel is pinned */
  isPinned?: boolean;
  /** Callback when pin button is clicked */
  onPinToggle?: () => void;
  /** Callback when help button is clicked */
  onHelpClick?: () => void;
  /** Callback when close button is clicked */
  onClose?: () => void;
}

export const DrillInHeader: React.FC<DrillInHeaderProps> = ({
  title,
  parentName,
  breadcrumb,
  onBack,
  isDirty,
  onBackAttempt,
  isPinned = false,
  onPinToggle,
  onHelpClick,
  onClose,
}) => {
  const handleBackClick = () => {
    if (isDirty && onBackAttempt) {
      onBackAttempt();
    } else {
      onBack();
    }
  };

  // Focus back button on mount for keyboard accessibility
  const backBtnRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    const timer = setTimeout(() => backBtnRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle keyboard navigation (Escape → go back, unless user is in an input)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        const target = e.target as HTMLElement;
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
          return; // Let the input handle Escape (blur/clear)
        }
        if (isDirty && onBackAttempt) {
          onBackAttempt();
        } else {
          onBack();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onBack, isDirty, onBackAttempt]);

  const breadcrumbPath = breadcrumb || [parentName, title];

  return (
    <header style={drillInHeaderContainerStyles}>
      {/* Back button + title area */}
      <div style={leftSectionStyles}>
        <button
          ref={backBtnRef}
          onClick={handleBackClick}
          className="aqb-back-btn"
          style={backButtonStyles}
          title={`Back to ${parentName}`}
          aria-label={`Back to ${parentName}`}
        >
          <BackArrowIcon />
          <span>Back to {parentName}</span>
        </button>

        {/* Breadcrumb (smaller, below back button) */}
        <nav style={breadcrumbStyles} aria-label="Breadcrumb">
          {breadcrumbPath.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span style={breadcrumbSeparatorStyles}>/</span>}
              <span
                style={{
                  ...breadcrumbItemStyles,
                  ...(index === breadcrumbPath.length - 1 ? breadcrumbCurrentStyles : {}),
                }}
              >
                {item}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Action buttons */}
      <HeaderActions
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
        style={{ marginTop: 2 }}
      />
    </header>
  );
};

// ============================================
// Local Styles (specific to DrillInHeader)
// ============================================

const leftSectionStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  flex: 1,
  minWidth: 0,
};

const backButtonStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 8px 4px 4px",
  margin: "-4px",
  background: "transparent",
  border: "none",
  borderRadius: "var(--aqb-radius-md)",
  color: "var(--aqb-text-secondary)",
  fontSize: "var(--aqb-text-base)",
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.15s ease, color 0.15s ease",
};

const breadcrumbStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  paddingLeft: 4,
};

const breadcrumbItemStyles: React.CSSProperties = {
  fontSize: "var(--aqb-text-sm)",
  fontWeight: 400,
  color: "var(--aqb-text-muted)",
};

const breadcrumbSeparatorStyles: React.CSSProperties = {
  fontSize: "var(--aqb-text-sm)",
  color: "var(--aqb-text-disabled)",
};

const breadcrumbCurrentStyles: React.CSSProperties = {
  color: "var(--aqb-text-secondary)",
  fontWeight: 500,
};

export default DrillInHeader;
