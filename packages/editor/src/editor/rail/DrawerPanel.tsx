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
import { ChevronLeft, Pin } from "lucide-react";
import { Button, Tooltip } from "@/editor/ui";

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

  // The tabId that is *currently displayed*. On a same-render close+switch
  // (both isOpen and tabId flip at once) the save effect below would otherwise
  // key the outgoing tab's scrollTop under the NEW tabId; using the previous
  // tabId keeps each tab's position under its own key.
  const displayedTabId = React.useRef(tabId);

  // Save scroll position before close — under the tab that was on screen.
  React.useEffect(() => {
    if (!isOpen && contentRef.current) {
      scrollPositions.current[displayedTabId.current] = contentRef.current.scrollTop;
    }
  }, [isOpen, tabId]);

  // Restore scroll position on open
  React.useEffect(() => {
    if (isOpen && contentRef.current) {
      const savedPosition = scrollPositions.current[tabId] ?? 0;
      contentRef.current.scrollTop = savedPosition;
    }
  }, [isOpen, tabId]);

  // Track the displayed tab AFTER the save/restore effects have run this render.
  React.useEffect(() => {
    displayedTabId.current = tabId;
  });

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
            <Tooltip label={isPinned ? "Unpin panel" : "Pin panel"}>
              <Button
                kind="ghost"
                size="sm"
                aria-pressed={isPinned}
                aria-label={isPinned ? "Unpin panel" : "Pin panel"}
                onClick={onPinToggle}
                className="drawer-panel__pin-btn"
              ><Pin size={16} strokeWidth={1.5} /></Button>
            </Tooltip>
          )}

          {/* Close button */}
          {onClose && (
            <Tooltip label="Close panel">
              <Button
                kind="ghost"
                size="sm"
                aria-label="Close panel"
                onClick={handleClose}
                className="drawer-panel__close-btn"
              ><ChevronLeft size={16} strokeWidth={1.5} /></Button>
            </Tooltip>
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
