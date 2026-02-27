/**
 * editor/shell — Editor shell (main studio component, header, panels, modals)
 * Integration: L2 — fully wired (UI → Composer → history → render)
 *
 * @license BSD-3-Clause
 */

// Main studio entry point
export { AquibraStudio } from "./AquibraStudio";
export type { AquibraStudioProps } from "./AquibraStudio";

// Top bar + header
export { Topbar } from "./Topbar";
export type { TopbarProps } from "./Topbar";

// Studio panels (3-column layout orchestrator)
export { StudioPanels } from "./StudioPanels";
export type { StudioPanelsProps } from "./StudioPanels";

// Modals container
export { StudioModals } from "./StudioModals";
export type { StudioModalsProps } from "./StudioModals";

// Hooks (available to external modules that need studio-level state)
export { useFormHandler, type UseFormHandlerResult } from "./hooks/useFormHandler";
export { useDataManager, type UseDataManagerResult } from "./hooks/useDataManager";
export { useTemplateManager, type UseTemplateManagerResult } from "./hooks/useTemplateManager";
export { useMediaManager, type UseMediaManagerResult } from "./hooks/useMediaManager";
export { useSyncStatus, type UseSyncStatusResult } from "./hooks/useSyncStatus";
