/**
 * useStudioModals - Modal-state composer for AquibraStudio
 *
 * D4b Stage 1 (audit-remediation 2026-05-08): the 14 modals + their
 * contexts that previously lived inline in this hook now live in
 * three domain sub-hooks:
 *
 *   ./useGlobalModals.ts  — shortcuts, projectSettings, commandPalette
 *   ./useContentModals.ts — templates, exporter, ai, copilot, mediaLibrary,
 *                           imageEditor, iconPicker (8 with payloads)
 *   ./useDomainModals.ts  — collectionSetup, createComponent,
 *                           cmsCollectionSetup
 *
 * useStudioModals composes them and merges into the same flat
 * `UseStudioModalsReturn` shape consumers already use. Zero external
 * API change. Loading states (`previewLoading`, `exportLoading`)
 * stay here since they're not modal-specific. The orchestrator-level
 * `closeAll` fans out to each sub-hook's `resetAll`.
 *
 * @module Editor/hooks/useStudioModals
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../../shared/types/media";
import { useGlobalModals } from "./useGlobalModals";
import { useContentModals } from "./useContentModals";
import { useDomainModals } from "./useDomainModals";

// ============================================
// Context Types
// ============================================

/** AI assistant context for element-specific prompts */
export interface AIContext {
  elementId?: string;
  elementType?: string;
  prompt?: string;
}

/** Media library context for asset selection */
export interface MediaLibraryContext {
  onSelect: (asset: MediaAsset) => void;
  allowedTypes?: MediaAssetType[];
}

/** Image editor context for editing images */
export interface ImageEditorContext {
  imageSrc: string;
  /**
   * Audit-remediation PR1 [ModalSubmit]: accept sync OR async handler.
   * MediaTab's actual onSave is async (fetch → blob → upload). Pre-fix
   * the contract was sync `void`, so a thrown promise from the parent
   * escaped as an unhandled rejection.
   */
  onSave: (editedSrc: string) => void | Promise<void>;
}

/** Icon picker context for icon selection */
export interface IconPickerContext {
  onSelect: (icon: IconConfig) => void;
  currentIcon?: IconConfig;
}

/** Collection setup context for e-commerce */
export interface CollectionSetupContext {
  onConfirm: (includeSampleData: boolean) => Promise<void>;
}

/** Create component context */
export interface CreateComponentContext {
  elementId: string;
}

// ============================================
// Hook Return Type
// ============================================

export interface UseStudioModalsReturn {
  // Template modals
  showTemplates: boolean;
  setShowTemplates: React.Dispatch<React.SetStateAction<boolean>>;
  showSaveTemplate: boolean;
  setShowSaveTemplate: React.Dispatch<React.SetStateAction<boolean>>;
  openTemplates: () => void;
  closeTemplates: () => void;
  openSaveTemplate: () => void;
  closeSaveTemplate: () => void;

  // Export modal
  showExporter: boolean;
  setShowExporter: React.Dispatch<React.SetStateAction<boolean>>;
  openExporter: () => void;
  closeExporter: () => void;

  // AI modals
  showAI: boolean;
  setShowAI: React.Dispatch<React.SetStateAction<boolean>>;
  aiContext: AIContext | null;
  openAI: (context?: AIContext) => void;
  closeAI: () => void;
  showCopilot: boolean;
  setShowCopilot: React.Dispatch<React.SetStateAction<boolean>>;
  openCopilot: () => void;
  closeCopilot: () => void;

  // Shortcuts modal
  showShortcuts: boolean;
  setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>;
  toggleShortcuts: () => void;
  closeShortcuts: () => void;

  // Media Library modal
  showMediaLibrary: boolean;
  mediaLibraryContext: MediaLibraryContext | null;
  openMediaLibrary: (allowedTypes: MediaAssetType[], onSelect: (asset: MediaAsset) => void) => void;
  closeMediaLibrary: () => void;

  // Image Editor modal
  showImageEditor: boolean;
  imageEditorContext: ImageEditorContext | null;
  openImageEditor: (
    imageSrc: string,
    onSave: (editedSrc: string) => void | Promise<void>,
  ) => void;
  closeImageEditor: () => void;

  // Icon Picker modal
  showIconPicker: boolean;
  iconPickerContext: IconPickerContext | null;
  openIconPicker: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  closeIconPicker: () => void;

  // Collection Setup modal (e-commerce)
  showCollectionSetup: boolean;
  collectionSetupContext: CollectionSetupContext | null;
  openCollectionSetup: (onConfirm: (includeSampleData: boolean) => Promise<void>) => void;
  closeCollectionSetup: () => void;

  // Create Component modal
  showCreateComponent: boolean;
  createComponentContext: CreateComponentContext | null;
  openCreateComponent: (elementId: string) => void;
  closeCreateComponent: () => void;

  // Project Settings modal
  showProjectSettings: boolean;
  openProjectSettings: () => void;
  closeProjectSettings: () => void;

  // CMS Collection Setup modal (WS-14a)
  showCMSCollectionSetup: boolean;
  openCMSCollectionSetup: () => void;
  closeCMSCollectionSetup: () => void;

  // Command Palette modal
  showCommandPalette: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  // Loading states
  previewLoading: boolean;
  setPreviewLoading: React.Dispatch<React.SetStateAction<boolean>>;
  exportLoading: boolean;
  setExportLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Utility
  closeAll: () => void;
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Hook for managing all modal states in AquibraStudio
 * Consolidates modal visibility, context, and handlers
 */
export function useStudioModals(): UseStudioModalsReturn {
  // Three domain sub-hooks own their state machinery; this composer
  // merges their flat returns into the public `UseStudioModalsReturn`.
  const globalModals = useGlobalModals();
  const contentModals = useContentModals();
  const domainModals = useDomainModals();

  // Destructure the reset fans-out so they don't leak into the public
  // spread (the public `UseStudioModalsReturn` does NOT declare
  // resetContentModals / resetDomainModals — they're internal hooks).
  const { resetContentModals, ...contentPublic } = contentModals;
  const { resetDomainModals, ...domainPublic } = domainModals;

  // Loading states are studio-wide, not modal-specific. Stay here.
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);

  // Cross-cutting: fan out closeAll to every sub-hook. Deps reference the
  // individual stable callbacks (each is `useCallback([], ...)` in its
  // sub-hook) rather than the unstable parent objects, so closeAll itself
  // stays referentially stable across parent renders.
  const { closeShortcuts, closeProjectSettings, closeCommandPalette } = globalModals;
  const closeAll = React.useCallback(() => {
    closeShortcuts();
    closeProjectSettings();
    closeCommandPalette();
    resetContentModals();
    resetDomainModals();
  }, [
    closeShortcuts,
    closeProjectSettings,
    closeCommandPalette,
    resetContentModals,
    resetDomainModals,
  ]);

  return {
    ...contentPublic,
    ...domainPublic,
    ...globalModals,
    previewLoading,
    setPreviewLoading,
    exportLoading,
    setExportLoading,
    closeAll,
  };
}

export default useStudioModals;
