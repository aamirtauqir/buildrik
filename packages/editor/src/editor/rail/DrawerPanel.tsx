/**
 * DrawerPanel - Sliding content panel for the new LayoutShell
 * Follows COMPONENT_SPECS.md specifications
 *
 * Width: 280px (or 0 when closed)
 * Background: Glassmorphic with backdrop blur
 * Animation: Slide from left with bounce easing
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./DrawerPanel.css";
import { IconButton } from "../../shared/ui";
import { SvgChevronLeft, SvgPin } from "../../shared/ui/Icons";

// ============================================
// Types
// ============================================

export interface DrawerPanelProps {
  /** Panel title displayed in header */
  title: string;
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose?: () => void;
  /** Whether the panel is pinned (stays open) */
  isPinned?: boolean;
  /** Callback to toggle pinned state */
  onPinToggle?: () => void;
  /** Panel content */
  children: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Custom class name */
  className?: string;
  /** Tab ID for aria attributes */
  tabId?: string;
}

// ============================================
// DrawerPanel Component
// ============================================

export const DrawerPanel: React.FC<DrawerPanelProps> = ({
  title,
  isOpen,
  onClose,
  isPinned = false,
  onPinToggle,
  children,
  footer,
  className = "",
  tabId = "default",
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Remember scroll position per title/tab
  const scrollPositions = React.useRef<Record<string, number>>({});

  // Save scroll position before close
  React.useEffect(() => {
    if (!isOpen && contentRef.current) {
      scrollPositions.current[tabId] = contentRef.current.scrollTop;
    }
  }, [isOpen, tabId]);

  // Restore scroll position on open
  React.useEffect(() => {
    if (isOpen && contentRef.current) {
      const savedPosition = scrollPositions.current[tabId] ?? 0;
      contentRef.current.scrollTop = savedPosition;
    }
  }, [isOpen, tabId]);

  // Handle close with animation cleanup
  const handleClose = React.useCallback(() => {
    if (contentRef.current) {
      scrollPositions.current[tabId] = contentRef.current.scrollTop;
    }
    onClose?.();
  }, [onClose, tabId]);

  // Handle keyboard shortcuts
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && !isPinned) {
        handleClose();
      }
    },
    [handleClose, isPinned]
  );

  const panelClass = [
    "drawer-panel",
    isOpen ? "drawer-panel--open" : "",
    isPinned ? "drawer-panel--pinned" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={panelClass}
      role="region"
      aria-label={title}
      aria-hidden={!isOpen}
      id={`drawer-panel-${tabId}`}
      onKeyDown={handleKeyDown}
    >
      {/* Header with title and controls */}
      <div className="drawer-panel__header">
        <h2 className="drawer-panel__title">{title}</h2>

        <div className="drawer-panel__controls">
          {/* Pin button - keeps panel open */}
          {onPinToggle && (
            <IconButton
              icon={<SvgPin />}
              tooltip={isPinned ? "Unpin panel" : "Pin panel"}
              ariaLabel={isPinned ? "Unpin panel" : "Pin panel"}
              size="sm"
              variant="ghost"
              active={isPinned}
              onClick={onPinToggle}
              className="drawer-panel__pin-btn"
            />
          )}

          {/* Close button */}
          {onClose && (
            <IconButton
              icon={<SvgChevronLeft />}
              tooltip="Close panel"
              ariaLabel="Close panel"
              size="sm"
              variant="ghost"
              onClick={handleClose}
              className="drawer-panel__close-btn"
            />
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="drawer-panel__content" ref={contentRef}>
        {children}
      </div>

      {/* Optional footer */}
      {footer && <div className="drawer-panel__footer">{footer}</div>}
    </div>
  );
};

export default DrawerPanel;
