/**
 * useSidebarState — State management + localStorage persistence for LeftSidebar
 * Supports both controlled (props) and uncontrolled (internal) modes.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { GroupedTabId } from "../../shared/constants/tabs";
import { trackSidebar } from "../../shared/utils/sidebarAnalytics";

const SIDEBAR_STORAGE_KEY = "aqb-sidebar-state";

interface SidebarStateOptions {
  controlledPrimaryTab?: GroupedTabId;
  onPrimaryTabChange?: (tab: GroupedTabId) => void;
  controlledExpanded?: boolean;
  onPanelExpandedChange?: (expanded: boolean) => void;
  controlledPinned?: boolean;
  onPanelPinnedChange?: (pinned: boolean) => void;
}

interface SidebarState {
  activePrimaryTab: GroupedTabId;
  isPanelExpanded: boolean;
  isPanelPinned: boolean;
  handlePrimaryTabChange: (tab: GroupedTabId) => void;
  handlePanelToggle: () => void;
  handlePinToggle: () => void;
  handlePanelClose: () => void;
  /** Ref for focus management on panel expand */
  panelContentRef: React.RefObject<HTMLDivElement>;
  /** Error boundary reset key */
  errorKey: number;
  resetError: () => void;
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed[key] ?? fallback;
    }
  } catch {
    // Ignore parse errors
  }
  return fallback;
}

export function useSidebarState(options: SidebarStateOptions): SidebarState {
  const {
    controlledPrimaryTab,
    onPrimaryTabChange,
    controlledExpanded,
    onPanelExpandedChange,
    controlledPinned,
    onPanelPinnedChange,
  } = options;

  // Internal state (uncontrolled mode)
  const [internalPrimaryTab, setInternalPrimaryTab] = React.useState<GroupedTabId>(
    () => readStorage("activeTab", "add") as GroupedTabId
  );
  const [internalExpanded, setInternalExpanded] = React.useState(() =>
    readStorage("expanded", true)
  );
  const [internalPinned, setInternalPinned] = React.useState(() => readStorage("pinned", false));
  const [errorKey, setErrorKey] = React.useState(0);

  // Resolved values
  const activePrimaryTab = controlledPrimaryTab ?? internalPrimaryTab;
  const isPanelExpanded = controlledExpanded ?? internalExpanded;
  const isPanelPinned = controlledPinned ?? internalPinned;

  // Refs
  const panelContentRef = React.useRef<HTMLDivElement>(null);
  const prevExpandedRef = React.useRef(isPanelExpanded);

  // Persist to localStorage (uncontrolled mode only)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (controlledExpanded === undefined && controlledPinned === undefined) {
      try {
        localStorage.setItem(
          SIDEBAR_STORAGE_KEY,
          JSON.stringify({
            expanded: internalExpanded,
            pinned: internalPinned,
            activeTab: internalPrimaryTab,
          })
        );
      } catch {
        // Ignore storage errors
      }
    }
  }, [internalExpanded, internalPinned, internalPrimaryTab, controlledExpanded, controlledPinned]);

  // Focus management: move focus into panel when it expands
  React.useEffect(() => {
    if (isPanelExpanded && !prevExpandedRef.current) {
      const timer = setTimeout(() => {
        if (panelContentRef.current) {
          const focusableSelectors = [
            "input:not([disabled])",
            "button:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            "a[href]",
            '[tabindex]:not([tabindex="-1"])',
          ].join(", ");
          const firstFocusable =
            panelContentRef.current.querySelector<HTMLElement>(focusableSelectors);
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            panelContentRef.current.focus();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    prevExpandedRef.current = isPanelExpanded;
  }, [isPanelExpanded]);

  // Handlers
  const handlePanelToggle = React.useCallback(() => {
    const next = !isPanelExpanded;
    onPanelExpandedChange ? onPanelExpandedChange(next) : setInternalExpanded(next);
  }, [isPanelExpanded, onPanelExpandedChange]);

  const handlePinToggle = React.useCallback(() => {
    const next = !isPanelPinned;
    onPanelPinnedChange ? onPanelPinnedChange(next) : setInternalPinned(next);
  }, [isPanelPinned, onPanelPinnedChange]);

  const handlePanelClose = React.useCallback(() => {
    onPanelExpandedChange ? onPanelExpandedChange(false) : setInternalExpanded(false);
  }, [onPanelExpandedChange]);

  const handlePrimaryTabChange = React.useCallback(
    (tab: GroupedTabId) => {
      trackSidebar("tab_switch", { from: activePrimaryTab, to: tab, trigger: "click" });
      if (!isPanelExpanded) {
        onPanelExpandedChange ? onPanelExpandedChange(true) : setInternalExpanded(true);
      }
      onPrimaryTabChange ? onPrimaryTabChange(tab) : setInternalPrimaryTab(tab);
    },
    [onPrimaryTabChange, isPanelExpanded, onPanelExpandedChange, activePrimaryTab]
  );

  return {
    activePrimaryTab,
    isPanelExpanded,
    isPanelPinned,
    handlePrimaryTabChange,
    handlePanelToggle,
    handlePinToggle,
    handlePanelClose,
    panelContentRef,
    errorKey,
    resetError: () => setErrorKey((k) => k + 1),
  };
}
