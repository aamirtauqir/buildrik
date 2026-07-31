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
export { Slider, type SliderProps } from "./Slider";
/* ── Moved to chrome-ui (Task 6, flowbite big-bang) — bridge dies at Task 14 ─ */
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
export { FieldRow, type FieldRowProps } from "./FieldRow";
export { FormField, type FormFieldProps } from "./FormField";
export { NavItem, type NavItemProps } from "../chrome-ui/NavItem";
export { SectionHeader, type SectionHeaderProps } from "../chrome-ui/SectionHeader";
export { PanelHeader, type PanelHeaderProps } from "./PanelHeader";
export { EmptyState, EmptyStateTitle, EmptyStateDesc, EmptyStateActions, type EmptyStateProps, type EmptyStateSize } from "../chrome-ui/EmptyState";
export { MediaCard, type MediaCardProps } from "./MediaCard";
export { SiteCard, type SiteCardProps } from "./SiteCard";

/* ── Organisms ──────────────────────────────────────────────────────────── */
export { OverlayMount, type OverlayMountProps } from "./OverlayMount";
/* ── Moved to chrome-ui (Task 3, spec §4.3-4.4) — bridge dies at Task 14 ─── */
export { Portal } from "../chrome-ui/Portal";
export { useFocusTrap, isModalOpen } from "../chrome-ui/focus";
export { getOverlayRoot } from "../chrome-ui/OverlayRoot";
export { Modal, type ModalProps, type ModalKind } from "./Modal";
export { Drawer, type DrawerProps, type DrawerLayout } from "./Drawer";
export { RightPanel, type RightPanelProps } from "./RightPanel";
export { Rail, RailItem, RailSpacer, type RailProps, type RailItemProps } from "./Rail";
export { Footer, FooterSpacer, type FooterProps } from "./Footer";
export { CommandPalette, type CommandPaletteProps, type Command } from "./CommandPalette";

/* ── Shell ──────────────────────────────────────────────────────────────── */
export { EditorShell, type EditorShellProps } from "./EditorShell";

/* ── Layout + compositions ──────────────────────────────────────────────── */
export { PanelFrame, type PanelFrameProps, type PanelFrameHeaderProps, type PanelFrameBodyProps, type PanelWidth } from "./PanelFrame";
export { Tabs, type TabsProps, type Tab } from "./Tabs";
export { ConfirmDialog, type ConfirmDialogProps } from "./ConfirmDialog";
export {
  ToastProvider, useToast,
  type ToastInput, type QueuedToast, type ToastTone, type ToastActionPayload, type UseToastReturn,
} from "./Toast";

/* ── Compatibility surfaces for trees written against the old API ───────── */
export { Icon, IconButton, Kbd, Spinner, type IconProps, type IconButtonProps, type KbdProps, type SpinnerProps } from "../chrome-ui/Icon";
export {
  ModalRoot, ModalContent, ModalTitle, ModalDescription, ModalBody, ModalFooter, ModalClose,
  type ModalContentProps, type ModalSize,
} from "./ModalParts";
export { Popover, Menu, MenuItem, MenuGroup, MenuLabel, MenuSeparator } from "./Popover";
export type { PopoverProps, PopoverPlacement, MenuProps, MenuItemProps } from "./Popover";
export { SaveStatus, type SaveStatusProps, type SaveState } from "./SaveStatus";
export { Presence, toneFor, type PresenceProps, type PresenceUser, type ConnectionState } from "./Presence";
export { Topbar, SiteMenuIcon } from "./Topbar";
export type { TopbarProps, TopbarTools, PublishState, ReviewPill, ReviewTone } from "./Topbar";
export { IssueChip, formatIssueSummary } from "./IssueChip";
export type { IssueChipProps } from "./IssueChip";

/* ── BreakpointSwitcher · ported from vibcoder ──────────────────────────── */
export { BreakpointSwitcher, type Breakpoint, type BreakpointSwitcherProps } from "./BreakpointSwitcher";

/* ── HelpTooltip · moved from shared/ui (Slice 6B) ──────────────────────── */
export { HelpTooltip, type HelpTooltipProps } from "./HelpTooltip";

/* ── Extensions drain · ported from shared/extensions ───────────────────── */
export { PanelHeaderActions, type PanelHeaderActionsProps } from "./PanelHeader";
export { CopyButton, type CopyButtonProps } from "../chrome-ui/CopyButton";
export { UpgradeModal, type UpgradeModalProps } from "./UpgradeModal";
