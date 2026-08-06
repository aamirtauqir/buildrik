/**
 * DrillInHeader - "← Back to [Parent]" header for drill-in screens
 * Shows breadcrumb path and back button for nested navigation
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelHeaderActions, Button } from "@/editor/chrome-ui";
import { BackArrowIcon } from "./headerIcons";
import { drillInHeaderContainerStyles } from "./headerStyles";

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
  isExpanded?: boolean;
  /** Callback when pin button is clicked */
  onExpandToggle?: () => void;
  /** Callback when help button is clicked */
  onHelpClick?: () => void;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /**
   * Where to send focus on mount.
   * "back" (default) preserves current behavior.
   * "breadcrumb-current" focuses the breadcrumb's current-page span as a
   *   heading-like landmark — used by settings v2 for screen-reader
   *   announcement of "section, group" combined.
   */
  focusTarget?: "back" | "breadcrumb-current";
  /**
   * When false, DrillInHeader skips its document-level Escape listener.
   * Settings v2 passes false so the parent SettingsTab can handle Escape
   * with knowledge of modal state (guardOpen / isRoot / transitioning).
   * Default true for backwards-compat with ComponentDetailScreen.
   */
  enableDocumentEscape?: boolean;
}

export const DrillInHeader: React.FC<DrillInHeaderProps> = ({
  title,
  parentName,
  breadcrumb,
  onBack,
  isDirty,
  onBackAttempt,
  isExpanded = false,
  onExpandToggle,
  onHelpClick,
  onClose,
  focusTarget = "back",
  enableDocumentEscape = true,
}) => {
  const handleBackClick = () => {
    if (isDirty && onBackAttempt) {
      onBackAttempt();
    } else {
      onBack();
    }
  };

  // Focus target on mount + on title change for keyboard accessibility.
  // Codex pass-2 P1 (new): include `title` in deps so section→section
  // navigation (which keeps DrillInHeader mounted) re-focuses the
  // breadcrumb-current span when the title flips. Without this, focus
  // stays on the prior section's heading and screen readers do not
  // re-announce the new section.
  const backBtnRef = React.useRef<HTMLButtonElement>(null);
  const breadcrumbCurrentRef = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (focusTarget === "breadcrumb-current") {
        breadcrumbCurrentRef.current?.focus();
      } else {
        backBtnRef.current?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [focusTarget, title]);

  // Handle keyboard navigation (Escape → go back, unless user is in an input).
  // Opt-out via enableDocumentEscape=false; settings v2 owns Escape at parent
  // because it must consult guardOpen / isRoot / transitioning.
  React.useEffect(() => {
    if (!enableDocumentEscape) return;
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
  }, [onBack, isDirty, onBackAttempt, enableDocumentEscape]);

  const breadcrumbPath = breadcrumb || [parentName, title];
  const groupLabel = breadcrumbPath[0];
  const headingAriaLabel =
    focusTarget === "breadcrumb-current" && groupLabel
      ? `${title}, ${groupLabel}`
      : undefined;

  return (
    <header style={drillInHeaderContainerStyles}>
      {/* Back button + title area */}
      <div style={leftSectionStyles}>
        <Button
          ref={backBtnRef}
          onClick={handleBackClick}
          style={backButtonStyles}
          title={`Back to ${parentName}`}
          aria-label={`Back to ${parentName}`}
        >
          <BackArrowIcon />
          <span>Back to {parentName}</span>
        </Button>

        {/* Breadcrumb (smaller, below back button) */}
        <nav style={breadcrumbStyles} aria-label="Breadcrumb">
          {breadcrumbPath.map((item, index) => {
            const isCurrent = index === breadcrumbPath.length - 1;
            const isFocusableCurrent =
              isCurrent && focusTarget === "breadcrumb-current";
            return (
              <React.Fragment key={index}>
                {index > 0 && <span style={breadcrumbSeparatorStyles}>/</span>}
                {isFocusableCurrent ? (
                  <span
                    ref={breadcrumbCurrentRef}
                    role="heading"
                    aria-level={2}
                    aria-label={headingAriaLabel}
                    tabIndex={-1}
                    style={{ ...breadcrumbItemStyles, ...breadcrumbCurrentStyles }}
                  >
                    {item}
                  </span>
                ) : (
                  <span
                    style={{
                      ...breadcrumbItemStyles,
                      ...(isCurrent ? breadcrumbCurrentStyles : {}),
                    }}
                  >
                    {item}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
      {/* Action buttons */}
      <PanelHeaderActions
        label="panel"
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
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
  borderRadius: "var(--bk-radius-lg)",
  color: "var(--bk-ink-soft)",
  fontSize: "var(--bk-text-13)",
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
  fontSize: "var(--bk-text-12)",
  fontWeight: 400,
  color: "var(--bk-ink-muted)",
};

const breadcrumbSeparatorStyles: React.CSSProperties = {
  fontSize: "var(--bk-text-12)",
  color: "var(--bk-ink-disabled)",
};

const breadcrumbCurrentStyles: React.CSSProperties = {
  color: "var(--bk-ink-soft)",
  fontWeight: 500,
};

export default DrillInHeader;
