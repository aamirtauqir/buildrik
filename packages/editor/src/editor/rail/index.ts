/**
 * editor/rail — Layout shell + tab configuration
 * @license BSD-3-Clause
 */

// Main layout container (CSS Grid shell)
export { LayoutShell } from "./LayoutShell";
export type { LayoutShellProps } from "./LayoutShell";

// Rail + tab configuration
export { GROUPED_TABS_CONFIG, getTabsByZone } from "./tabsConfig";
export type {
  TabZone,
  GroupedTabId,
  GroupedTabConfig,
  TabPattern,
  TabSection,
} from "./tabsConfig";
