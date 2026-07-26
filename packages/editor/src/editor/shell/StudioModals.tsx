/**
 * StudioModals - Modal components container
 * Renders all modal dialogs used in the Aquibra Studio
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../shared/types/media";
import { SaveTemplate } from "../../templates/SaveTemplate";
import { CollectionSetupModal } from "../ecommerce";
import { ExportModal } from "../export";
import { MediaLibraryPanel, ImageEditorModal, IconPickerModal } from "../media";
import { KeyboardShortcutsPanel } from "../panels/KeyboardShortcutsPanel";
import { useToast } from "@/editor/ui";
import { CMSCollectionSetupModal } from "./modals/CMSCollectionSetupModal";
import { CMSRecordsModal } from "./modals/CMSRecordsModal";
import { CommandPalette } from "./modals/CommandPalette";
import { CreateComponentModal } from "./modals/CreateComponentModal";
import { CreateComponentModal as SaveAsComponentModal } from "../sidebar/tabs/component-library/CreateComponentModal";
import { ProjectSettingsModal } from "./modals/ProjectSettingsModal";

// ============================================================================
// TYPES
// ============================================================================

export interface StudioModalsProps {
  /** Composer instance */
  composer: Composer | null;

  // Template modals
  showSaveTemplate: boolean;
  onCloseSaveTemplate: () => void;
  onSaveTemplate: (data: { name: string; category: string; description: string }) => void;

  // Export modal
  showExporter: boolean;
  onCloseExporter: () => void;

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
    /** Audit-remediation PR1 [ModalSubmit]: sync OR async accepted. */
    onSave: (editedSrc: string) => void | Promise<void>;
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

  // Save as Component (T12 — canvas right-click, binding-aware)
  showSaveAsComponent: boolean;
  onCloseSaveAsComponent: () => void;
  saveAsComponentContext: {
    selectionIds: readonly string[];
    extractedBindings: Map<string, string>;
  } | null;
  // Project Settings
  showProjectSettings: boolean;
  onCloseProjectSettings: () => void;

  // CMS Collection Setup modal (WS-14a)
  showCMSCollectionSetup: boolean;
  onCloseCMSCollectionSetup: () => void;
  showCMSRecords: boolean;
  onCloseCMSRecords: () => void;

  // Command Palette
  showCommandPalette: boolean;
  onCloseCommandPalette: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const StudioModals: React.FC<StudioModalsProps> = ({
  composer,
  showSaveTemplate,
  onCloseSaveTemplate,
  onSaveTemplate,
  showExporter,
  onCloseExporter,
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
  showSaveAsComponent,
  onCloseSaveAsComponent,
  saveAsComponentContext,
  showProjectSettings,
  onCloseProjectSettings,
  showCMSCollectionSetup,
  onCloseCMSCollectionSetup,
  showCMSRecords,
  onCloseCMSRecords,
  showCommandPalette,
  onCloseCommandPalette,
}) => {
  const { addToast } = useToast();

  // Modal-error handler factory. Each async modal gets a labeled error sink
  // that surfaces failures via toast — replaces silent catch-and-log pattern.
  const makeModalErrorHandler = React.useCallback(
    (label: string) =>
      (err: unknown) => {
        addToast({
          tone: "error",
          title: `${label} failed`,
          description: err instanceof Error ? err.message : String(err),
        });
      },
    [addToast]
  );

  return (
    <>
      {/* Save Template */}
      <SaveTemplate
        isOpen={showSaveTemplate}
        onClose={onCloseSaveTemplate}
        html={composer?.exportHTML().combined}
        onSave={onSaveTemplate}
      />

      {/* Export Modal */}
      <ExportModal isOpen={showExporter} onClose={onCloseExporter} composer={composer} />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcutsPanel isOpen={showShortcuts} onClose={onCloseShortcuts} />

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
          /*
           * Audit-remediation PR1 [ModalSubmit]: forward the promise.
           * Pre-fix the bridge wrapped a sync try/catch around an async
           * onSave call, which couldn't catch rejected promises from
           * MediaTab's actual handler (fetch → blob → upload). Now
           * ImageEditorModal's handleSave awaits this and routes any
           * thrown error through onError to the toast adapter, keeping
           * the modal open for retry.
           */
          onSave={imageEditorContext.onSave}
          onError={makeModalErrorHandler("Save edited image")}
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
        }}
        onError={makeModalErrorHandler("Collection setup")}
        onSkip={onCloseCollectionSetup}
      />

      {/* Create Component Modal — sidebar header + LeftSidebar "+" flow.
          Carries variants/description/tags UX. Single-elementId payload. */}
      <CreateComponentModal
        isOpen={showCreateComponent}
        onClose={onCloseCreateComponent}
        composer={composer}
        elementId={createComponentContext?.elementId || null}
      />

      {/* Save as Component Modal (T12) — canvas right-click flow.
          Uses the T11-extended component-library modal that renders the
          "Pre-fill bindings from DS" hint based on selectionContext. */}
      {showSaveAsComponent && saveAsComponentContext && composer && (
        <SaveAsComponentModal
          onClose={onCloseSaveAsComponent}
          onSubmit={(payload) => {
            // Component schema is keyed by a single masterTree → pass the
            // first selected id as the source element. Multi-select grouping
            // is a separate feature surface; for now the first id is the
            // canonical "master" the binding-aware modal extracted from.
            const elementId = saveAsComponentContext.selectionIds[0];
            if (!elementId) return;
            void composer.components.createComponent(payload.name, elementId, {
              category: payload.group ?? undefined,
              prefillFromDs: payload.prefillBindings,
            });
          }}
          selectionContext={{
            selectionIds: saveAsComponentContext.selectionIds,
            extractedBindings: saveAsComponentContext.extractedBindings,
          }}
        />
      )}

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        isOpen={showProjectSettings}
        onClose={onCloseProjectSettings}
        composer={composer}
      />

      {/* CMS Collection Setup Modal (WS-14a) */}
      <CMSCollectionSetupModal
        isOpen={showCMSCollectionSetup}
        onClose={onCloseCMSCollectionSetup}
        composer={composer}
      />

      {/* CMS Records management */}
      <CMSRecordsModal
        isOpen={showCMSRecords}
        onClose={onCloseCMSRecords}
        composer={composer}
      />

      {/* Command Palette */}
      {showCommandPalette && (
        <CommandPalette
          onClose={onCloseCommandPalette}
          composer={composer}
        />
      )}
    </>
  );
};

export default StudioModals;
