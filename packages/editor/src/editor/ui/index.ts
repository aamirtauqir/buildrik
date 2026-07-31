/**
 * Buildrick UI — the component library the editor is built from.
 *
 * Every component mirrors a Figma component set or component (node id is in the
 * file header) and styles itself only from generated tokens. Nothing in this
 * folder may contain a hex value, a magic number, or a legacy token.
 *
 * @license BSD-3-Clause
 */

/* ── Atoms ──────────────────────────────────────────────────────────────── */
/* ── Moved to chrome-ui (Task 6, flowbite big-bang) — bridge dies at Task 14 ─ */
export { Slider, type SliderProps } from "../chrome-ui/Slider";
export { StatusDot, type StatusDotProps, type StatusDotState } from "../chrome-ui/StatusDot";

/* ── Molecules ──────────────────────────────────────────────────────────── */
export {
  Row,
  type RowProps,
  type RowSize,
  ROW_LABEL_CLASS,
  ROW_META_CLASS,
  ROW_CHEVRON_CLASS,
  ROW_ICON_CLASS,
} from "../chrome-ui/Row";
export { ListRow, type ListRowProps } from "../chrome-ui/ListRow";
export { TreeRow, type TreeRowProps } from "../chrome-ui/TreeRow";
export { VersionRow, type VersionRowProps } from "../chrome-ui/VersionRow";
export { RecordRow, type RecordRowProps } from "../chrome-ui/RecordRow";
export { FormatRow, type FormatRowProps } from "../chrome-ui/FormatRow";
export { IntegrationRow, type IntegrationRowProps, type IntegrationStatus } from "../chrome-ui/IntegrationRow";
export { CommentRow, type CommentRowProps } from "../chrome-ui/CommentRow";
export { FieldRow, type FieldRowProps } from "../chrome-ui/FieldRow";
export { FormField, type FormFieldProps } from "./FormField";
export { NavItem, type NavItemProps } from "../chrome-ui/NavItem";
export { SectionHeader, type SectionHeaderProps } from "../chrome-ui/SectionHeader";
export { PanelHeader, type PanelHeaderProps } from "../chrome-ui/PanelHeader";
export { EmptyState, EmptyStateTitle, EmptyStateDesc, EmptyStateActions, type EmptyStateProps, type EmptyStateSize } from "../chrome-ui/EmptyState";
export { MediaCard, type MediaCardProps } from "../chrome-ui/MediaCard";
export { SiteCard, type SiteCardProps } from "../chrome-ui/SiteCard";

/* ── Organisms ──────────────────────────────────────────────────────────── */
export { OverlayMount, type OverlayMountProps } from "../chrome-ui/OverlayMount";
/* ── Moved to chrome-ui (Task 3, spec §4.3-4.4) — bridge dies at Task 14 ─── */
export { Portal } from "../chrome-ui/Portal";
export { useFocusTrap, isModalOpen } from "../chrome-ui/focus";
export { getOverlayRoot } from "../chrome-ui/OverlayRoot";
export { Modal, type ModalProps, type ModalKind } from "../chrome-ui/Modal";
export { Drawer, type DrawerProps, type DrawerLayout } from "../chrome-ui/Drawer";
export { RightPanel, type RightPanelProps } from "../chrome-ui/RightPanel";
export { Rail, RailItem, RailSpacer, type RailProps, type RailItemProps } from "../chrome-ui/Rail";
export { Footer, FooterSpacer, type FooterProps } from "../chrome-ui/Footer";
export { CommandPalette, type CommandPaletteProps, type Command } from "../chrome-ui/CommandPalette";

/* ── Shell ──────────────────────────────────────────────────────────────── */
export { EditorShell, type EditorShellProps } from "../chrome-ui/EditorShell";

/* ── Layout + compositions ──────────────────────────────────────────────── */
export { PanelFrame, type PanelFrameProps, type PanelFrameHeaderProps, type PanelFrameBodyProps, type PanelWidth } from "../chrome-ui/PanelFrame";
export { Tabs, type TabsProps, type Tab } from "../chrome-ui/Tabs";
export { ConfirmDialog, type ConfirmDialogProps } from "../chrome-ui/ConfirmDialog";
export {
  ToastProvider, useToast,
  type ToastInput, type QueuedToast, type ToastTone, type ToastActionPayload, type UseToastReturn,
} from "../chrome-ui/Toast";

/* ── Compatibility surfaces for trees written against the old API ───────── */
export { Icon, IconButton, Kbd, Spinner, type IconProps, type IconButtonProps, type KbdProps, type SpinnerProps } from "../chrome-ui/Icon";
export {
  ModalRoot, ModalContent, ModalTitle, ModalDescription, ModalBody, ModalFooter, ModalClose,
  type ModalContentProps, type ModalSize,
} from "../chrome-ui/ModalParts";
export { Popover, Menu, MenuItem, MenuGroup, MenuLabel, MenuSeparator, POPOVER_BASE_CLASS } from "../chrome-ui/Popover";
export type { PopoverProps, PopoverPlacement, MenuProps, MenuItemProps } from "../chrome-ui/Popover";
/* ── Moved to chrome-ui (Task 6, flowbite big-bang, Group B) — bridge dies at Task 14 ─ */
export { SaveStatus, type SaveStatusProps, type SaveState } from "../chrome-ui/SaveStatus";
export { Presence, toneFor, type PresenceProps, type PresenceUser, type ConnectionState } from "../chrome-ui/Presence";
export { Topbar, SiteMenuIcon } from "../chrome-ui/Topbar";
export type { TopbarProps, TopbarTools, PublishState, ReviewPill, ReviewTone } from "../chrome-ui/Topbar";
export { IssueChip, formatIssueSummary } from "../chrome-ui/IssueChip";
export type { IssueChipProps } from "../chrome-ui/IssueChip";

/* ── BreakpointSwitcher · moved to chrome-ui (Task 6, flowbite big-bang) ── */
export { BreakpointSwitcher, type Breakpoint, type BreakpointSwitcherProps } from "../chrome-ui/BreakpointSwitcher";

/* ── HelpTooltip · moved from shared/ui (Slice 6B) ──────────────────────── */
export { HelpTooltip, type HelpTooltipProps } from "../chrome-ui/HelpTooltip";

/* ── Extensions drain · ported from shared/extensions ───────────────────── */
export { PanelHeaderActions, type PanelHeaderActionsProps } from "../chrome-ui/PanelHeader";
export { CopyButton, type CopyButtonProps } from "../chrome-ui/CopyButton";
export { UpgradeModal, type UpgradeModalProps } from "../chrome-ui/UpgradeModal";
