/**
 * useStudioModals - Hook for managing all modal states in AquibraStudio
 * Extracts modal visibility, context state, and handlers from AquibraStudio.tsx
 *
 * @module Editor/hooks/useStudioModals
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../../shared/types/media";

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
  onSave: (editedSrc: string) => void;
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
  openImageEditor: (imageSrc: string, onSave: (editedSrc: string) => void) => void;
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
  // Template modals
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = React.useState(false);

  // Export modal
  const [showExporter, setShowExporter] = React.useState(false);

  // AI modals
  const [showAI, setShowAI] = React.useState(false);
  const [aiContext, setAIContext] = React.useState<AIContext | null>(null);
  const [showCopilot, setShowCopilot] = React.useState(false);

  // Shortcuts modal
  const [showShortcuts, setShowShortcuts] = React.useState(false);

  // Media modal states
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [mediaLibraryContext, setMediaLibraryContext] = React.useState<MediaLibraryContext | null>(
    null
  );
  const [showImageEditor, setShowImageEditor] = React.useState(false);
  const [imageEditorContext, setImageEditorContext] = React.useState<ImageEditorContext | null>(
    null
  );
  const [showIconPicker, setShowIconPicker] = React.useState(false);
  const [iconPickerContext, setIconPickerContext] = React.useState<IconPickerContext | null>(null);

  // Collection Setup modal state (e-commerce)
  const [showCollectionSetup, setShowCollectionSetup] = React.useState(false);
  const [collectionSetupContext, setCollectionSetupContext] =
    React.useState<CollectionSetupContext | null>(null);

  // Create Component modal state
  const [showCreateComponent, setShowCreateComponent] = React.useState(false);
  const [createComponentContext, setCreateComponentContext] =
    React.useState<CreateComponentContext | null>(null);

  // Project Settings modal state
  const [showProjectSettings, setShowProjectSettings] = React.useState(false);

  // Loading states
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);

  // Template handlers
  const openTemplates = React.useCallback(() => setShowTemplates(true), []);
  const closeTemplates = React.useCallback(() => setShowTemplates(false), []);
  const openSaveTemplate = React.useCallback(() => setShowSaveTemplate(true), []);
  const closeSaveTemplate = React.useCallback(() => setShowSaveTemplate(false), []);

  // Export handlers
  const openExporter = React.useCallback(() => setShowExporter(true), []);
  const closeExporter = React.useCallback(() => setShowExporter(false), []);

  // AI handlers
  const openAI = React.useCallback((context?: AIContext) => {
    setAIContext(context || null);
    setShowAI(true);
  }, []);

  const closeAI = React.useCallback(() => {
    setShowAI(false);
    setAIContext(null);
  }, []);

  const openCopilot = React.useCallback(() => setShowCopilot(true), []);
  const closeCopilot = React.useCallback(() => setShowCopilot(false), []);

  // Shortcuts handlers
  const toggleShortcuts = React.useCallback(() => {
    setShowShortcuts((prev) => !prev);
  }, []);
  const closeShortcuts = React.useCallback(() => setShowShortcuts(false), []);

  // Media Library handlers
  const openMediaLibrary = React.useCallback(
    (allowedTypes: MediaAssetType[], onSelect: (asset: MediaAsset) => void) => {
      setMediaLibraryContext({ allowedTypes, onSelect });
      setShowMediaLibrary(true);
    },
    []
  );

  const closeMediaLibrary = React.useCallback(() => {
    setShowMediaLibrary(false);
    setMediaLibraryContext(null);
  }, []);

  // Image Editor handlers
  const openImageEditor = React.useCallback(
    (imageSrc: string, onSave: (editedSrc: string) => void) => {
      setImageEditorContext({ imageSrc, onSave });
      setShowImageEditor(true);
    },
    []
  );

  const closeImageEditor = React.useCallback(() => {
    setShowImageEditor(false);
    setImageEditorContext(null);
  }, []);

  // Icon Picker handlers
  const openIconPicker = React.useCallback(
    (currentIcon: IconConfig | undefined, onSelect: (icon: IconConfig) => void) => {
      setIconPickerContext({ onSelect, currentIcon });
      setShowIconPicker(true);
    },
    []
  );

  const closeIconPicker = React.useCallback(() => {
    setShowIconPicker(false);
    setIconPickerContext(null);
  }, []);

  // Collection Setup handlers
  const openCollectionSetup = React.useCallback(
    (onConfirm: (includeSampleData: boolean) => Promise<void>) => {
      setCollectionSetupContext({ onConfirm });
      setShowCollectionSetup(true);
    },
    []
  );

  const closeCollectionSetup = React.useCallback(() => {
    setShowCollectionSetup(false);
    setCollectionSetupContext(null);
  }, []);

  // Create Component handlers
  const openCreateComponent = React.useCallback((elementId: string) => {
    setCreateComponentContext({ elementId });
    setShowCreateComponent(true);
  }, []);

  const closeCreateComponent = React.useCallback(() => {
    setShowCreateComponent(false);
    setCreateComponentContext(null);
  }, []);

  // Project Settings handlers
  const openProjectSettings = React.useCallback(() => setShowProjectSettings(true), []);
  const closeProjectSettings = React.useCallback(() => setShowProjectSettings(false), []);

  // Close all modals
  const closeAll = React.useCallback(() => {
    setShowTemplates(false);
    setShowSaveTemplate(false);
    setShowExporter(false);
    setShowAI(false);
    setAIContext(null);
    setShowCopilot(false);
    setShowShortcuts(false);
    setShowMediaLibrary(false);
    setMediaLibraryContext(null);
    setShowImageEditor(false);
    setImageEditorContext(null);
    setShowIconPicker(false);
    setIconPickerContext(null);
    setShowCollectionSetup(false);
    setCollectionSetupContext(null);
    setShowCreateComponent(false);
    setCreateComponentContext(null);
    setShowProjectSettings(false);
  }, []);

  return {
    // Template modals
    showTemplates,
    setShowTemplates,
    showSaveTemplate,
    setShowSaveTemplate,
    openTemplates,
    closeTemplates,
    openSaveTemplate,
    closeSaveTemplate,
    // Export modal
    showExporter,
    setShowExporter,
    openExporter,
    closeExporter,
    // AI modals
    showAI,
    setShowAI,
    aiContext,
    openAI,
    closeAI,
    showCopilot,
    setShowCopilot,
    openCopilot,
    closeCopilot,
    // Shortcuts modal
    showShortcuts,
    setShowShortcuts,
    toggleShortcuts,
    closeShortcuts,
    // Media Library
    showMediaLibrary,
    mediaLibraryContext,
    openMediaLibrary,
    closeMediaLibrary,
    // Image Editor
    showImageEditor,
    imageEditorContext,
    openImageEditor,
    closeImageEditor,
    // Icon Picker
    showIconPicker,
    iconPickerContext,
    openIconPicker,
    closeIconPicker,
    // Collection Setup (e-commerce)
    showCollectionSetup,
    collectionSetupContext,
    openCollectionSetup,
    closeCollectionSetup,
    // Create Component
    showCreateComponent,
    createComponentContext,
    openCreateComponent,
    closeCreateComponent,
    // Project Settings
    showProjectSettings,
    openProjectSettings,
    closeProjectSettings,
    // Loading states
    previewLoading,
    setPreviewLoading,
    exportLoading,
    setExportLoading,
    // Utility
    closeAll,
  };
}

export default useStudioModals;
