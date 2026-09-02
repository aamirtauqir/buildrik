/**
 * useContentModals — D4b Stage 1 extraction (audit-remediation 2026-05-08).
 *
 * Lifted out of useStudioModals.ts. Holds the 8 modals that act on
 * project content (templates, AI assistance, media + icon pickers,
 * image editor, exporter). Each "with-context" modal pairs a boolean
 * visibility flag with a payload that names what the modal acts on
 * — e.g. `imageEditorContext` carries the `imageSrc` + `onSave`
 * callback for the open image.
 *
 * Returns the flat field shape useStudioModals already exposes — the
 * composer in useStudioModals merges it with the other two sub-hooks
 * and the `closeAll` utility, so consumers see no change.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../../shared/types/media";
import type {
  IconPickerContext,
  ImageEditorContext,
  MediaLibraryContext,
} from "./useStudioModals";

export interface UseContentModalsReturn {
  // Templates
  showSaveTemplate: boolean;
  setShowSaveTemplate: React.Dispatch<React.SetStateAction<boolean>>;
  openSaveTemplate: () => void;
  closeSaveTemplate: () => void;

  // Exporter
  showExporter: boolean;
  setShowExporter: React.Dispatch<React.SetStateAction<boolean>>;
  openExporter: () => void;
  closeExporter: () => void;

  // Media Library
  showMediaLibrary: boolean;
  mediaLibraryContext: MediaLibraryContext | null;
  openMediaLibrary: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void,
    forLabel?: string,
  ) => void;
  closeMediaLibrary: () => void;

  // Image Editor
  showImageEditor: boolean;
  imageEditorContext: ImageEditorContext | null;
  openImageEditor: (
    imageSrc: string,
    onSave: (editedSrc: string) => void | Promise<void>,
  ) => void;
  closeImageEditor: () => void;

  // Icon Picker
  showIconPicker: boolean;
  iconPickerContext: IconPickerContext | null;
  openIconPicker: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void,
  ) => void;
  closeIconPicker: () => void;

  /** Reset every modal in this hook (called by useStudioModals.closeAll). */
  resetContentModals: () => void;
}

export function useContentModals(): UseContentModalsReturn {
  const [showSaveTemplate, setShowSaveTemplate] = React.useState(false);
  const [showExporter, setShowExporter] = React.useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [mediaLibraryContext, setMediaLibraryContext] =
    React.useState<MediaLibraryContext | null>(null);
  const [showImageEditor, setShowImageEditor] = React.useState(false);
  const [imageEditorContext, setImageEditorContext] =
    React.useState<ImageEditorContext | null>(null);
  const [showIconPicker, setShowIconPicker] = React.useState(false);
  const [iconPickerContext, setIconPickerContext] = React.useState<IconPickerContext | null>(null);

  const openSaveTemplate = React.useCallback(() => setShowSaveTemplate(true), []);
  const closeSaveTemplate = React.useCallback(() => setShowSaveTemplate(false), []);

  const openExporter = React.useCallback(() => setShowExporter(true), []);
  const closeExporter = React.useCallback(() => setShowExporter(false), []);

  const openMediaLibrary = React.useCallback(
    (allowedTypes: MediaAssetType[], onSelect: (asset: MediaAsset) => void, forLabel?: string) => {
      setMediaLibraryContext({ allowedTypes, onSelect, forLabel });
      setShowMediaLibrary(true);
    },
    [],
  );
  const closeMediaLibrary = React.useCallback(() => {
    setShowMediaLibrary(false);
    setMediaLibraryContext(null);
  }, []);

  const openImageEditor = React.useCallback(
    (imageSrc: string, onSave: (editedSrc: string) => void | Promise<void>) => {
      setImageEditorContext({ imageSrc, onSave });
      setShowImageEditor(true);
    },
    [],
  );
  const closeImageEditor = React.useCallback(() => {
    setShowImageEditor(false);
    setImageEditorContext(null);
  }, []);

  const openIconPicker = React.useCallback(
    (currentIcon: IconConfig | undefined, onSelect: (icon: IconConfig) => void) => {
      setIconPickerContext({ onSelect, currentIcon });
      setShowIconPicker(true);
    },
    [],
  );
  const closeIconPicker = React.useCallback(() => {
    setShowIconPicker(false);
    setIconPickerContext(null);
  }, []);

  const resetContentModals = React.useCallback(() => {
    setShowSaveTemplate(false);
    setShowExporter(false);
    setShowMediaLibrary(false);
    setMediaLibraryContext(null);
    setShowImageEditor(false);
    setImageEditorContext(null);
    setShowIconPicker(false);
    setIconPickerContext(null);
  }, []);

  return {
    showSaveTemplate,
    setShowSaveTemplate,
    openSaveTemplate,
    closeSaveTemplate,
    showExporter,
    setShowExporter,
    openExporter,
    closeExporter,
    showMediaLibrary,
    mediaLibraryContext,
    openMediaLibrary,
    closeMediaLibrary,
    showImageEditor,
    imageEditorContext,
    openImageEditor,
    closeImageEditor,
    showIconPicker,
    iconPickerContext,
    openIconPicker,
    closeIconPicker,
    resetContentModals,
  };
}
