/**
 * Editor Hooks Barrel Exports
 * @module Editor/hooks
 * @license BSD-3-Clause
 */

export {
  useStudioModals,
  type UseStudioModalsReturn,
  type AIContext,
  type MediaLibraryContext,
  type ImageEditorContext,
  type IconPickerContext,
} from "./useStudioModals";

export {
  useStudioState,
  type UseStudioStateReturn,
  type PanelState,
  type SelectedElementInfo,
  type SaveState,
  type OverlayState,
} from "./useStudioState";

export { useFormHandler, type UseFormHandlerResult } from "./useFormHandler";
export { useDataManager, type UseDataManagerResult } from "./useDataManager";
export { useTemplateManager, type UseTemplateManagerResult } from "./useTemplateManager";
export { useMediaManager, type UseMediaManagerResult } from "./useMediaManager";
export { useSyncStatus, type UseSyncStatusResult } from "./useSyncStatus";
