/**
 * chrome-ui — the flowbite-react chrome layer (spec §4.3-4.4).
 *
 * Barrel exports only — no logic here.
 *
 * @license BSD-3-Clause
 */
export { getOverlayRoot } from "./OverlayRoot";
export { Portal } from "./Portal";
export { useFocusTrap, isModalOpen } from "./focus";
export { TextField, type TextFieldProps } from "./TextField";
export { SkeletonListItem, StudioSkeleton, type SkeletonListItemProps } from "./Skeleton";
export { StatusDot, type StatusDotProps, type StatusDotState } from "./StatusDot";
export { SaveStatus, type SaveStatusProps, type SaveState } from "./SaveStatus";
export { IssueChip, formatIssueSummary, type IssueChipProps } from "./IssueChip";
export { Icon, IconButton, Kbd, Spinner, type IconProps, type IconButtonProps, type KbdProps, type SpinnerProps } from "./Icon";
export { CopyButton, type CopyButtonProps } from "./CopyButton";
export { SectionHeader, type SectionHeaderProps } from "./SectionHeader";
export { NavItem, type NavItemProps } from "./NavItem";
export {
  Row,
  type RowProps,
  type RowSize,
  ROW_LABEL_CLASS,
  ROW_META_CLASS,
  ROW_CHEVRON_CLASS,
  ROW_ICON_CLASS,
} from "./Row";
export { ListRow, type ListRowProps } from "./ListRow";
export { TreeRow, type TreeRowProps } from "./TreeRow";
export { VersionRow, type VersionRowProps } from "./VersionRow";
export { RecordRow, type RecordRowProps } from "./RecordRow";
export { FormatRow, type FormatRowProps } from "./FormatRow";
export { IntegrationRow, type IntegrationRowProps, type IntegrationStatus } from "./IntegrationRow";
export { CommentRow, type CommentRowProps } from "./CommentRow";
export {
  EmptyState,
  EmptyStateTitle,
  EmptyStateDesc,
  EmptyStateActions,
  type EmptyStateProps,
  type EmptyStateSize,
} from "./EmptyState";
export { MediaCard, type MediaCardProps } from "./MediaCard";
export { SiteCard, type SiteCardProps } from "./SiteCard";
export { UpgradeModal, type UpgradeModalProps } from "./UpgradeModal";
export {
  PanelHeader,
  PanelHeaderActions,
  type PanelHeaderProps,
  type PanelHeaderActionsProps,
} from "./PanelHeader";
export {
  PanelFrame,
  type PanelFrameProps,
  type PanelFrameHeaderProps,
  type PanelFrameBodyProps,
  type PanelWidth,
} from "./PanelFrame";
export { RightPanel, type RightPanelProps } from "./RightPanel";
export { EditorShell, type EditorShellProps } from "./EditorShell";
export { Footer, FooterSpacer, type FooterProps } from "./Footer";
export { Rail, RailItem, RailSpacer, type RailProps, type RailItemProps } from "./Rail";
export { FieldRow, type FieldRowProps } from "./FieldRow";
export { HelpTooltip, type HelpTooltipProps } from "./HelpTooltip";
export { Slider, type SliderProps } from "./Slider";
export { Tabs, type TabsProps, type Tab } from "./Tabs";
export { Drawer, type DrawerProps, type DrawerLayout } from "./Drawer";
export { OverlayMount, type OverlayMountProps } from "./OverlayMount";
export {
  Modal,
  type ModalProps,
  type ModalKind,
  MODAL_FRAME_BASE_CLASS,
  MODAL_HEAD_CLASS,
  MODAL_TITLE_CLASS,
  MODAL_SUBTITLE_CLASS,
  MODAL_BODY_CLASS,
  MODAL_FOOT_CLASS,
} from "./Modal";
export {
  ModalRoot,
  ModalContent,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
  type ModalContentProps,
  type ModalSize,
} from "./ModalParts";
export { ConfirmDialog, type ConfirmDialogProps } from "./ConfirmDialog";
export {
  ToastProvider,
  useToast,
  type ToastInput,
  type QueuedToast,
  type ToastTone,
  type ToastActionPayload,
  type UseToastReturn,
} from "./Toast";
export { CommandPalette, type CommandPaletteProps, type Command } from "./CommandPalette";
export { Popover, Menu, MenuItem, MenuGroup, MenuLabel, MenuSeparator, POPOVER_BASE_CLASS } from "./Popover";
export type { PopoverProps, PopoverPlacement, MenuProps, MenuItemProps } from "./Popover";
