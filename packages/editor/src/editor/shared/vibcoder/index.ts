/**
 * Vibcoder primitive React wrappers (Buildrik-authored, vibcoder-fork 2026-05-06).
 * Each export renders a className from CSS in src/themes/components/.
 * Wrappers are thin: prop → className mapping only. No business logic, no
 * state, no engine coupling.
 *
 * Architecture reference: docs/architecture/vibcoder-spec/ (untracked).
 * @license BSD-3-Clause
 */
export { Button } from "./Button";
export { Tag } from "./Tag";
export type { TagVariant, TagSize, TagProps } from "./Tag";
export { Input } from "./Input";
export type { InputProps } from "./Input";
export { Select } from "./Select";
export type { SelectSize, SelectProps } from "./Select";
export { Textarea } from "./Textarea";
export type { TextareaSize, TextareaProps } from "./Textarea";
export { Checkbox } from "./Checkbox";
export type { CheckboxSize, CheckboxProps } from "./Checkbox";
export { Radio, RadioGroup } from "./Radio";
export type { RadioSize, RadioProps, RadioGroupProps } from "./Radio";
export { Switch } from "./Switch";
export type { SwitchProps } from "./Switch";
export { Icon } from "./Icon";
export type { IconName, IconSize, IconProps } from "./Icon";
export { Avatar } from "./Avatar";
export type { AvatarVariant, AvatarSize, AvatarPresence, AvatarProps } from "./Avatar";
export { Badge } from "./Badge";
export type { BadgeVariant, BadgeProps } from "./Badge";
export { Count } from "./Count";
export type { CountVariant, CountSize, CountProps } from "./Count";
export { Thumb } from "./Thumb";
export type { ThumbSize, ThumbRatio, ThumbKind, ThumbProps } from "./Thumb";
export { IconButton } from "./IconButton";
export type { IconButtonVariant, IconButtonSize, IconButtonProps } from "./IconButton";
export { Slider } from "./Slider";
export type { SliderProps } from "./Slider";
export { NumericStepper } from "./NumericStepper";
export type { NumericStepperProps } from "./NumericStepper";
export { Link } from "./Link";
export type { LinkTone, LinkProps } from "./Link";
export { Progress } from "./Progress";
export type { ProgressVariant, ProgressSize, ProgressProps } from "./Progress";
export { Skeleton } from "./Skeleton";
export type { SkeletonShape, SkeletonSize, SkeletonProps } from "./Skeleton";
export { Spinner, StatusDot } from "./Spinner";
export type { SpinnerSize, SpinnerProps, StatusDotProps } from "./Spinner";
export { HelperText } from "./HelperText";
export type { HelperTextTone, HelperTextProps } from "./HelperText";
export { Divider } from "./Divider";
export type { DividerOrientation, DividerStyle, DividerTone, DividerProps } from "./Divider";
export { Stack } from "./Stack";
export type { StackGap, StackProps } from "./Stack";
export { Cluster } from "./Cluster";
export type { ClusterGap, ClusterAlign, ClusterProps } from "./Cluster";
export { Center } from "./Center";
export type { CenterProps } from "./Center";
export { Grid } from "./Grid";
export type { GridProps, GridGap, GridCols } from "./Grid";
export { Frame } from "./Frame";
export type { FrameProps, FrameRatio } from "./Frame";
export { Switcher } from "./Switcher";
export type { SwitcherProps, SwitcherThreshold } from "./Switcher";
export { Grip } from "./Grip";
export type { GripOrientation, GripSize, GripProps } from "./Grip";
export { BreakpointSwitcher } from "./BreakpointSwitcher";
export type { Breakpoint, BreakpointSwitcherProps } from "./BreakpointSwitcher";
export { Label } from "./Label";
export type { LabelSize, LabelInfoProps, LabelProps } from "./Label";
export { Kbd, KbdSeq } from "./Kbd";
export type { KbdVariant, KbdSize, KbdProps, KbdSeqProps } from "./Kbd";
export { ListRow } from "./ListRow";
export type { ListRowProps, ListRowSize } from "./ListRow";
export {
  Card,
  CardHeader,
  CardHeaderMeta,
  CardBody,
  CardFooter,
  CardTitle,
  CardDesc,
} from "./Card";
export type {
  CardProps,
  CardHeaderProps,
  CardHeaderMetaProps,
  CardBodyProps,
  CardFooterProps,
  CardTitleProps,
  CardDescProps,
} from "./Card";
export { FormField } from "./FormField";
export type { FormFieldProps } from "./FormField";
export { SectionHead } from "./SectionHead";
export type {
  SectionHeadProps,
  SectionHeadSize,
  SectionHeadVariant,
} from "./SectionHead";
export { SurfaceHead } from "./SurfaceHead";
export type {
  SurfaceHeadProps,
  SurfaceHeadSize,
  SurfaceHeadVariant,
} from "./SurfaceHead";
export { ActionBar, ActionBarStatus, ActionBarActions } from "./ActionBar";
export type {
  ActionBarProps,
  ActionBarVariant,
  ActionBarStatusProps,
  ActionBarActionsProps,
} from "./ActionBar";
export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbIcon,
} from "./Breadcrumb";
export type {
  BreadcrumbProps,
  BreadcrumbSize,
  BreadcrumbVariant,
  BreadcrumbItemProps,
  BreadcrumbSeparatorProps,
  BreadcrumbIconProps,
} from "./Breadcrumb";
export { Chipbar, ChipbarAdd, ChipbarOverflow } from "./Chipbar";
export type {
  ChipbarProps,
  ChipbarAddProps,
  ChipbarAddSize,
  ChipbarOverflowProps,
  ChipbarOverflowSize,
} from "./Chipbar";
export { ColorTrigger } from "./ColorTrigger";
export type {
  ColorTriggerProps,
  ColorTriggerSize,
  ColorTriggerVariant,
} from "./ColorTrigger";
export { Tabs, Tab, PillGroup, PillButton } from "./Tabs";
export type {
  TabsProps,
  TabProps,
  PillGroupProps,
  PillButtonProps,
} from "./Tabs";
export {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverArrow,
} from "./Popover";
export type { PopoverProps, PopoverContentProps } from "./Popover";
export { Menu, MenuGroup, MenuLabel, MenuItem } from "./Menu";
export type {
  MenuProps,
  MenuGroupProps,
  MenuLabelProps,
  MenuItemProps,
} from "./Menu";
export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToast,
} from "./Toast";
export type {
  QueuedToast,
  ToastActionPayload,
  ToastActionProps,
  ToastCloseProps,
  ToastDescriptionProps,
  ToastInput,
  ToastProviderProps,
  ToastTitleProps,
  ToastTone,
  ToastViewportProps,
  UseToastReturn,
} from "./Toast";
export { ToggleRow } from "./ToggleRow";
export type { ToggleRowProps } from "./ToggleRow";
export { TileMeta } from "./TileMeta";
export type { TileMetaProps, TileMetaVariant } from "./TileMeta";
export { SearchInput } from "./SearchInput";
export type { SearchInputProps, SearchInputSize } from "./SearchInput";
export { Toolbar, ToolbarGroup, ToolbarLabel, ToolbarSpacer } from "./Toolbar";
export type {
  ToolbarProps,
  ToolbarSize,
  ToolbarVariant,
  ToolbarGroupProps,
  ToolbarLabelProps,
  ToolbarSpacerProps,
} from "./Toolbar";
export { Uploader } from "./Uploader";
export type {
  UploaderProps,
  UploaderSize,
  UploaderVariant,
} from "./Uploader";
export { OverlayMount, useOverlayContainer } from "./OverlayMount";
export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalClose,
  ModalTitle,
  ModalDescription,
  ModalHead,
  ModalBody,
  ModalFooter,
} from "./Modal";
export type {
  ModalProps,
  ModalSize,
  ModalTriggerProps,
  ModalContentProps,
  ModalCloseProps,
  ModalTitleProps,
  ModalDescriptionProps,
  ModalFooterProps,
} from "./Modal";
export {
  NotificationCenter,
  NotificationCenterMark,
  NotificationCenterTabs,
  NotificationCenterTab,
  NotificationCenterBody,
  NotificationCenterGroup,
  NotificationCenterFoot,
} from "./NotificationCenter";
export type {
  NotificationCenterProps,
  NotificationCenterMarkProps,
  NotificationCenterTabsProps,
  NotificationCenterTabProps,
  NotificationCenterBodyProps,
  NotificationCenterGroupProps,
  NotificationCenterFootProps,
} from "./NotificationCenter";
export {
  CommandPalette,
  CommandPaletteInput,
  CommandPaletteList,
  CommandPaletteItem,
  CommandPaletteSection,
  CommandPaletteEmpty,
} from "./CommandPalette";
export type {
  CommandPaletteProps,
  CommandPaletteInputProps,
  CommandPaletteListProps,
  CommandPaletteItemProps,
  CommandPaletteSectionProps,
  CommandPaletteEmptyProps,
} from "./CommandPalette";
export {
  ColorPicker,
  ColorPickerSwatch,
  ColorPickerInput,
} from "./ColorPicker";
export type {
  ColorPickerProps,
  ColorPickerSize,
  ColorPickerSwatchProps,
  ColorPickerInputProps,
} from "./ColorPicker";
export { Footer, FooterGroup, FooterChip, FooterDot } from "./Footer";
export type {
  FooterProps,
  FooterGroupProps,
  FooterChipProps,
  FooterDotProps,
} from "./Footer";
export {
  EmptyState,
  EmptyStateArt,
  EmptyStateSpot,
  EmptyStateTitle,
  EmptyStateDesc,
  EmptyStateActions,
  EmptyStateCode,
} from "./EmptyState";
export type {
  EmptyStateProps,
  EmptyStateSize,
  EmptyStateSpotTone,
  EmptyStateArtProps,
  EmptyStateSpotProps,
  EmptyStateTitleProps,
  EmptyStateDescProps,
  EmptyStateActionsProps,
  EmptyStateCodeProps,
} from "./EmptyState";
export {
  A11yOverlay,
  A11yOverlayTile,
  A11yOverlaySwatch,
  A11yOverlayRatio,
  A11yOverlayHit,
} from "./A11yOverlay";
export type {
  A11yOverlayProps,
  A11yOverlayTileProps,
  A11yOverlaySwatchProps,
  A11yOverlaySwatchTone,
  A11yOverlayRatioProps,
  A11yOverlayHitProps,
  A11yOverlayHitKind,
} from "./A11yOverlay";
