/**
 * ProInspector Components
 *
 * Phase 6 restructure removed `ElementSettingsFooter` (its children — Link,
 * CSSClasses, ElementProperties, AllCSS — now render as individual sections
 * via the registry + Element tab profile) and `InspectorSubNav` (redundant
 * once sections show inline previews + profile-driven order).
 *
 * @license BSD-3-Clause
 */

export { DeleteConfirmModal } from "./DeleteConfirmModal";
export type { DeleteConfirmModalProps } from "./DeleteConfirmModal";
export { BindingPopover } from "./BindingPopover";
export type { BindingPopoverProps } from "./BindingPopover";
