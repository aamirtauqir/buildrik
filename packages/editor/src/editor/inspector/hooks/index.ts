/**
 * ProInspector Hooks
 * @license BSD-3-Clause
 */

export { useInspectorState } from "./useInspectorState";
export type {
  SelectedElement,
  InspectorState,
} from "./useInspectorState";

export { useStyleHandlers } from "./useStyleHandlers";
export type { StyleHandlers } from "./useStyleHandlers";

export { useAdvancedSettings } from "./useAdvancedSettings";
export type { UseAdvancedSettingsOptions, UseAdvancedSettingsReturn } from "./useAdvancedSettings";

export { useInspectorSections, TOTAL_SECTIONS } from "./useInspectorSections";
export type {
  UseInspectorSectionsOptions,
  UseInspectorSectionsResult,
} from "./useInspectorSections";

export { useBatchStyleHandler } from "./useBatchStyleHandler";
export type { UseBatchStyleHandlerResult } from "./useBatchStyleHandler";
