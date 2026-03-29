/**
 * StudioModals - Modal components container
 * Renders all modal dialogs used in the Aquibra Studio
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { AIAssistant } from "../../ai/AIAssistant";
import type { AIGenerationResult } from "../../ai/AIAssistant";
import { AICopilot } from "../../ai/AICopilot";
import type { Composer } from "../../engine";
import type { SyncManagerState } from "../../engine/sync/SyncManager";
import type { SyncConflict, ConflictResolution } from "../../services/CloudSyncService";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../shared/types/media";
import { SaveTemplate } from "../../templates/SaveTemplate";
import type { Template } from "../../templates/TemplateLibrary";
import { TemplateLibrary } from "../../templates/TemplateLibrary";
import { CollectionSetupModal } from "../ecommerce";
import { ExportModal } from "../export";
import { MediaLibraryPanel, ImageEditorModal, IconPickerModal } from "../media";
import { KeyboardShortcutsPanel } from "../panels/KeyboardShortcutsPanel";
import { ConflictModal } from "../sync/ConflictModal";
import { CreateComponentModal } from "./modals/CreateComponentModal";
import { ProjectSettingsModal } from "./modals/ProjectSettingsModal";

// ============================================================================
// TYPES
// ============================================================================

export interface StudioModalsProps {
  /** Composer instance */
  composer: Composer | null;
  /** Currently selected element */
  selectedElement: {
    id: string;
    type: string;
    tagName?: string;
  } | null;

  // Template modals
  showTemplates: boolean;
  onCloseTemplates: () => void;
  onSelectTemplate: (template: Template) => void;
  showSaveTemplate: boolean;
  onCloseSaveTemplate: () => void;
  onSaveTemplate: (data: { name: string; category: string; description: string }) => void;

  // Export modal
  showExporter: boolean;
  onCloseExporter: () => void;

  // AI modals
  showAI: boolean;
  onCloseAI: () => void;
  onAIGenerate: (result: AIGenerationResult) => void;
  aiContext: { elementId?: string; elementType?: string; prompt?: string } | null;
  showCopilot: boolean;
  onCloseCopilot: () => void;
  onCopilotInsert: (content: string, type: "text" | "html" | "image") => void;

  // Keyboard shortcuts
  showShortcuts: boolean;
  onCloseShortcuts: () => void;

  // Media modals
  showMediaLibrary: boolean;
  onCloseMediaLibrary: () => void;
  onSelectMedia: (asset: MediaAsset) => void;
  mediaLibraryContext: {
    onSelect: (asset: MediaAsset) => void;
    allowedTypes?: MediaAssetType[];
  } | null;
  showImageEditor: boolean;
  onCloseImageEditor: () => void;
  imageEditorContext: {
    imageSrc: string;
    onSave: (editedSrc: string) => void;
  } | null;
  showIconPicker: boolean;
  onCloseIconPicker: () => void;
  iconPickerContext: {
    onSelect: (icon: IconConfig) => void;
    currentIcon?: IconConfig;
  } | null;

  // Collection Setup (e-commerce)
  showCollectionSetup: boolean;
  onCloseCollectionSetup: () => void;
  collectionSetupContext: {
    onConfirm: (includeSampleData: boolean) => Promise<void>;
  } | null;

  // Create Component
  showCreateComponent: boolean;
  onCloseCreateComponent: () => void;
  createComponentContext: {
    elementId: string;
  } | null;
  // Project Settings
  showProjectSettings: boolean;
  onCloseProjectSettings: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const StudioModals: React.FC<StudioModalsProps> = ({
  composer,
  selectedElement,
  showTemplates,
  onCloseTemplates,
  onSelectTemplate,
  showSaveTemplate,
  onCloseSaveTemplate,
  onSaveTemplate,
  showExporter,
  onCloseExporter,
  showAI,
  onCloseAI,
  onAIGenerate,
  aiContext,
  showCopilot,
  onCloseCopilot,
  onCopilotInsert,
  showShortcuts,
  onCloseShortcuts,
  showMediaLibrary,
  onCloseMediaLibrary,
  onSelectMedia,
  mediaLibraryContext,
  showImageEditor,
  onCloseImageEditor,
  imageEditorContext,
  showIconPicker,
  onCloseIconPicker,
  iconPickerContext,
  showCollectionSetup,
  onCloseCollectionSetup,
  collectionSetupContext,
  showCreateComponent,
  onCloseCreateComponent,
  createComponentContext,
  showProjectSettings,
  onCloseProjectSettings,
}) => {
  // Handle element selection from AI assistant
  const handleSelectElement = React.useCallback(
    (elementId: string) => {
      if (composer) {
        const el = composer.elements.getElement(elementId);
        if (el) {
          composer.selection.select(el);
        }
      }
    },
    [composer]
  );

  // Track sync conflicts
  const [activeConflict, setActiveConflict] = React.useState<SyncConflict | null>(null);

  React.useEffect(() => {
    if (!composer?.sync) return;

    // Set initial state
    const state = composer.sync.getState();
    setActiveConflict(state.activeConflict);

    // Subscribe to state changes
    const unsubscribe = composer.sync.onStateChange((newState: SyncManagerState) => {
      setActiveConflict(newState.activeConflict);
    });

    return () => unsubscribe();
  }, [composer]);

  // Handle conflict resolution
  const handleResolveConflict = React.useCallback(
    (resolution: ConflictResolution) => {
      if (!composer?.sync || !activeConflict) return;
      composer.sync.resolveConflict(resolution);
      setActiveConflict(null);
    },
    [composer, activeConflict]
  );

  const handleCancelConflict = React.useCallback(() => {
    setActiveConflict(null);
  }, []);

  // Compute context label for AI assistant
  const contextLabel = React.useMemo(() => {
    if (aiContext?.elementType) {
      return `${aiContext.elementType} (${aiContext.elementId?.slice(-6)})`;
    }
    if (selectedElement?.type) {
      return `${selectedElement.type} (${selectedElement.id.slice(-6)})`;
    }
    return undefined;
  }, [aiContext, selectedElement]);

  return (
    <>
      {/* Template Library */}
      <TemplateLibrary
        isOpen={showTemplates}
        onClose={onCloseTemplates}
        onSelect={onSelectTemplate}
        composer={composer}
      />

      {/* Save Template */}
      <SaveTemplate
        isOpen={showSaveTemplate}
        onClose={onCloseSaveTemplate}
        html={composer?.exportHTML().combined}
        onSave={onSaveTemplate}
      />

      {/* Export Modal */}
      <ExportModal isOpen={showExporter} onClose={onCloseExporter} composer={composer} />

      {/* AI Assistant */}
      <AIAssistant
        isOpen={showAI}
        onClose={onCloseAI}
        onGenerate={onAIGenerate}
        contextLabel={contextLabel}
        composer={composer}
        onSelectElement={handleSelectElement}
      />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcutsPanel isOpen={showShortcuts} onClose={onCloseShortcuts} />

      {/* AI Copilot */}
      <AICopilot
        isOpen={showCopilot}
        onClose={onCloseCopilot}
        composer={composer}
        onInsert={onCopilotInsert}
      />

      {/* Media Library */}
      <MediaLibraryPanel
        isOpen={showMediaLibrary}
        onClose={onCloseMediaLibrary}
        onSelect={onSelectMedia}
        allowedTypes={mediaLibraryContext?.allowedTypes}
        composer={composer}
      />

      {/* Image Editor */}
      {showImageEditor && imageEditorContext && (
        <ImageEditorModal
          isOpen={showImageEditor}
          onClose={onCloseImageEditor}
          imageSrc={imageEditorContext.imageSrc}
          onSave={(editedSrc) => {
            imageEditorContext.onSave(editedSrc);
            onCloseImageEditor();
          }}
        />
      )}

      {/* Icon Picker */}
      {showIconPicker && iconPickerContext && (
        <IconPickerModal
          isOpen={showIconPicker}
          onClose={onCloseIconPicker}
          onSelect={(icon) => {
            iconPickerContext.onSelect(icon);
            onCloseIconPicker();
          }}
          currentIcon={iconPickerContext.currentIcon}
        />
      )}

      {/* Collection Setup (e-commerce) */}
      <CollectionSetupModal
        isOpen={showCollectionSetup}
        onClose={onCloseCollectionSetup}
        onConfirm={async (includeSampleData) => {
          if (collectionSetupContext?.onConfirm) {
            await collectionSetupContext.onConfirm(includeSampleData);
          }
          onCloseCollectionSetup();
        }}
        onSkip={onCloseCollectionSetup}
      />

      {/* Sync Conflict Modal */}
      {activeConflict && (
        <ConflictModal
          conflict={activeConflict}
          onResolve={handleResolveConflict}
          onCancel={handleCancelConflict}
        />
      )}

      {/* Create Component Modal */}
      <CreateComponentModal
        isOpen={showCreateComponent}
        onClose={onCloseCreateComponent}
        composer={composer}
        elementId={createComponentContext?.elementId || null}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        isOpen={showProjectSettings}
        onClose={onCloseProjectSettings}
        composer={composer}
      />
    </>
  );
};

export default StudioModals;
