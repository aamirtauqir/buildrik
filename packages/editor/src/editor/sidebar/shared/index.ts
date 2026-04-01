/**
 * Shared Components for LeftSidebar
 * New panel design system components
 * @license BSD-3-Clause
 */

// Shared Icons (used by headers and other components)
export { PinIcon, HelpIcon, CloseIcon, BackArrowIcon, ChevronIcon, CheckIcon } from "./headerIcons";

// Shared Styles (used by headers and other components)
export {
  actionsContainerStyles,
  titleStyles,
  headerContainerStyles,
  drillInHeaderContainerStyles,
} from "./headerStyles";

// Panel Header + HeaderActions
export { PanelHeader, HeaderActions } from "./PanelHeader";
export type { PanelHeaderProps, HeaderActionsProps } from "./PanelHeader";

// View Switcher (for Navigator, History tabs)
export { ViewSwitcher } from "./ViewSwitcher";
export type { ViewSwitcherProps, ViewOption } from "./ViewSwitcher";

// Drill-In Header (for Build, Settings sub-screens)
export { DrillInHeader } from "./DrillInHeader";
export type { DrillInHeaderProps } from "./DrillInHeader";

// Feature Card (for Build, Settings home screens)
export { FeatureCard, FeatureCardGrid } from "./FeatureCard";
export type { FeatureCardProps, FeatureCardGridProps } from "./FeatureCard";

// Search Bar
export { SearchBar } from "./SearchBar";
export type { SearchBarProps } from "./SearchBar";

// Panel Navigation Hook
export { usePanelNavigation } from "./usePanelNavigation";
export type {
  NavigationScreen,
  UsePanelNavigationOptions,
  PanelNavigationState,
} from "./usePanelNavigation";

// Filter Chips
export { FilterChips } from "./FilterChips";
export type { FilterChipsProps, FilterChip } from "./FilterChips";

// Context Pill (ContextPill.tsx is not yet implemented — stub removed to avoid TS error)

// Sticky Footer (Save/Cancel)
export { StickyFooter } from "./StickyFooter";
export type { StickyFooterProps } from "./StickyFooter";
