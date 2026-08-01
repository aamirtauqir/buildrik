/**
 * chrome-ui — the single public chrome surface (chrome-ui-single-surface
 * spec §2). Every file under `packages/editor/src` outside `chrome-ui/`
 * itself imports flowbite-react-sourced symbols from HERE, never directly
 * from `flowbite-react` — enforced by `gate:chrome-ui-surface`
 * (`scripts/check-chrome-ui-surface.mjs`).
 *
 * Three kinds of export live in this barrel:
 *  (a) Pure `export { X } from "flowbite-react"` re-exports, unchanged —
 *      names chrome-ui does not already own (Button, Badge, Avatar,
 *      AvatarGroup, Checkbox, Radio, ToggleSwitch, Tooltip, Textarea,
 *      Label, HelperText, RangeSlider, Progress, Card). The gate's barrel-
 *      purity check requires these stay re-export syntax, never a component
 *      definition — see the gate script header for the anti-pattern this
 *      guards against (the deleted in-house library grew exactly this way).
 *  (b) The closed 2-wrapper set — `TextInput` and `Select` — each a
 *      `forwardRef` that applies its `BK_*_THEME` default and deep-merges
 *      (`mergeTheme.ts`) a caller-supplied `theme` on top. A third wrapper
 *      fails the gate until this list is deliberately amended.
 *  (c) The 45 editor-specific components already here (Topbar, IssueChip,
 *      Modal, Toast, etc.) — unchanged.
 *  (d) Non-component symbols: `CustomFlowbiteTheme` (type-only) and every
 *      `BK_*` theme/class constant, so deep `chrome-ui/<name>Theme` imports
 *      don't need to survive outside this file either.
 *
 * Barrel exports only — no logic here (mergeTheme.ts / textInputTheme.ts /
 * selectTheme.ts / labelTheme.ts hold the logic; this file re-exports their
 * public constants).
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
export { IssueChip, formatIssueSummary, plural, type IssueChipProps } from "./IssueChip";
export { Presence, toneFor, type PresenceProps, type PresenceUser, type ConnectionState } from "./Presence";
export { BreakpointSwitcher, type Breakpoint, type BreakpointSwitcherProps } from "./BreakpointSwitcher";
export { Topbar, SiteMenuIcon } from "./Topbar";
export type { TopbarProps, TopbarTools, PublishState, ReviewPill, ReviewTone } from "./Topbar";
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
export { FormField, type FormFieldProps } from "./FormField";
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

// ─────────────────────────────────────────────────────────────────────────
// (b) The closed 2-wrapper set — spec §2(b). Never add a 3rd here without
// amending the gate's WRAPPER_FILES list (scripts/check-chrome-ui-surface.mjs)
// in the same commit.
// ─────────────────────────────────────────────────────────────────────────
export { TextInput, type TextInputProps } from "./TextInput";
export { Select, type SelectProps } from "./Select";

// ─────────────────────────────────────────────────────────────────────────
// (a) Pure flowbite-react re-exports — spec §2(a). Names chrome-ui does NOT
// already own. Collision list (never re-export these from flowbite): Spinner,
// Kbd, Footer, Drawer, Popover, Menu*, Tabs, Slider, Modal*, Toast, TextField.
// ─────────────────────────────────────────────────────────────────────────
export { Button } from "flowbite-react";
export { Badge } from "flowbite-react";
export { Avatar, AvatarGroup } from "flowbite-react";
export { Checkbox } from "flowbite-react";
export { Radio } from "flowbite-react";
export { ToggleSwitch } from "flowbite-react";
export { Tooltip } from "flowbite-react";
export { Textarea } from "flowbite-react";
export { Label } from "flowbite-react";
export { HelperText } from "flowbite-react";
export { RangeSlider } from "flowbite-react";
export { Progress } from "flowbite-react";
export { Card } from "flowbite-react";

// ─────────────────────────────────────────────────────────────────────────
// (d) Non-component symbols — spec §2(d). `CustomFlowbiteTheme` only exists
// at the `flowbite-react/types` subpath (not re-exported from flowbite-react's
// root `.` entry point — verified against node_modules/flowbite-react's
// package.json `exports` map), so the barrel pulls from there directly; that
// stays re-export syntax (gate guard #2) and this file is inside chrome-ui/,
// so gate guard #1's outside-chrome-ui ban on subpath specifiers doesn't
// apply to it.
// ─────────────────────────────────────────────────────────────────────────
export type { CustomFlowbiteTheme } from "flowbite-react/types";
export { BK_TEXT_INPUT_THEME } from "./textInputTheme";
export { BK_SELECT_BASE_THEME, BK_SELECT_BARE_UNIT_THEME, BK_SELECT_BARE_VALUE_THEME } from "./selectTheme";
export { BK_LABEL_CLASS, BK_HELPER_CLASS, BK_HELPER_ERROR_CLASS } from "./labelTheme";
