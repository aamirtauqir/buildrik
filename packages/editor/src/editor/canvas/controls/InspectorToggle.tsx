/**
 * Inspector Toggle Control
 * One-click toggle between minimal and detailed inspection modes
 *
 * Inspector OFF: Clean canvas, hover shows only dashed outline
 * Inspector ON: Element names visible, breadcrumb shown, full labels
 *
 * @module components/Canvas/controls/InspectorToggle
 * @license BSD-3-Clause
 */

import * as React from "react";
import { CanvasButton, SIZES } from "../shared";

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = "aqb-inspector-mode";

// =============================================================================
// TYPES
// =============================================================================

export interface InspectorToggleProps {
  /** Current inspector state */
  isEnabled: boolean;
  /** Callback when inspector state changes */
  onChange: (enabled: boolean) => void;
  /** Optional CSS class name */
  className?: string;
}

// =============================================================================
// HOOK: useInspectorMode
// =============================================================================

export interface UseInspectorModeResult {
  /** Whether inspector mode is enabled */
  isInspectorEnabled: boolean;
  /** Toggle inspector mode on/off */
  toggleInspector: () => void;
  /** Set inspector mode explicitly */
  setInspectorEnabled: (enabled: boolean) => void;
}

/**
 * Hook to manage inspector mode state with localStorage persistence
 */
export function useInspectorMode(): UseInspectorModeResult {
  const [isEnabled, setIsEnabled] = React.useState<boolean>(() => {
    // Initialize from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "true";
    }
    return false; // Default: minimal mode (OFF)
  });

  // Persist to localStorage when changed
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(isEnabled));
    }
  }, [isEnabled]);

  const toggleInspector = React.useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  const setInspectorEnabled = React.useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
  }, []);

  return {
    isInspectorEnabled: isEnabled,
    toggleInspector,
    setInspectorEnabled,
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Inspector toggle button for canvas header
 * Shows current mode and allows one-click toggle
 */
export const InspectorToggle: React.FC<InspectorToggleProps> = ({
  isEnabled,
  onChange,
  className,
}) => {
  const handleToggle = React.useCallback(() => {
    onChange(!isEnabled);
  }, [isEnabled, onChange]);

  // Keyboard shortcut: 'I' key toggles inspector
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // 'I' key toggles inspector mode
      if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        onChange(!isEnabled);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEnabled, onChange]);

  return (
    <div
      className={`aqb-inspector-toggle ${className || ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: SIZES.padding.xs,
      }}
    >
      <CanvasButton
        onClick={handleToggle}
        icon={isEnabled ? "👁" : "◯"}
        title={`Inspector: ${isEnabled ? "ON" : "OFF"} (Press I to toggle)`}
        variant={isEnabled ? "primary" : "ghost"}
        size="sm"
        active={isEnabled}
        style={{
          minWidth: 80,
          gap: 6,
          transition: "all 0.15s ease",
        }}
        label={isEnabled ? "Inspect" : "Minimal"}
      />
    </div>
  );
};

export default InspectorToggle;
