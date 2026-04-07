/**
 * editor/rail — Navigation rail + layout shell (LeftRail, LayoutShell, DrawerPanel)
 * Integration: L2 — fully wired (LeftRail ↔ LayoutShell ↔ DrawerPanel + v16 config)
 * @license BSD-3-Clause
 */

// Main layout container (CSS Grid shell)
export { LayoutShell } from "./LayoutShell";
export type { LayoutShellProps } from "./LayoutShell";

// Left navigation rail (v16 3-zone structure)
export { LeftRail } from "./LeftRail";
export type { LeftRailProps } from "./LeftRail";

// Sliding drawer panel (glassmorphic sidebar)
export { DrawerPanel } from "./DrawerPanel";
export type { DrawerPanelProps } from "./DrawerPanel";

// Rail + tab configuration
export { GROUPED_TABS_CONFIG, getTabsByZone } from "./tabsConfig";
export type {
  GroupedTabId,
  GroupedTabConfig,
  TabPattern,
  TabSection,
  TabZone,
} from "./tabsConfig";
