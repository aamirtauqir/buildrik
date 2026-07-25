/**
 * useStudioModals.test.ts — the D4b composed modal surface: every
 * open/close pair, payload contexts for the with-context modals,
 * loading flags, the closeAll fan-out, and the internal-reset
 * encapsulation (resetContentModals/resetDomainModals must not leak).
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useStudioModals } from "../useStudioModals";
import type { MediaAsset, IconConfig } from "../../../../shared/types/media";

describe("useStudioModals", () => {
  it("starts with every modal closed and no contexts", () => {
    const { result } = renderHook(() => useStudioModals());
    const m = result.current;
    expect(m.showSaveTemplate).toBe(false);
    expect(m.showExporter).toBe(false);
    expect(m.showShortcuts).toBe(false);
    expect(m.showMediaLibrary).toBe(false);
    expect(m.showImageEditor).toBe(false);
    expect(m.showIconPicker).toBe(false);
    expect(m.showCollectionSetup).toBe(false);
    expect(m.showCreateComponent).toBe(false);
    expect(m.showSaveAsComponent).toBe(false);
    expect(m.showProjectSettings).toBe(false);
    expect(m.showCMSCollectionSetup).toBe(false);
    expect(m.showCMSRecords).toBe(false);
    expect(m.showCommandPalette).toBe(false);
    expect(m.mediaLibraryContext).toBeNull();
    expect(m.imageEditorContext).toBeNull();
    expect(m.iconPickerContext).toBeNull();
    expect(m.collectionSetupContext).toBeNull();
    expect(m.createComponentContext).toBeNull();
    expect(m.saveAsComponentContext).toBeNull();
    expect(m.previewLoading).toBe(false);
    expect(m.exportLoading).toBe(false);
  });

  // Simple boolean modals -------------------------------------------------------
  it.each([
    ["saveTemplate", "openSaveTemplate", "closeSaveTemplate", "showSaveTemplate"],
    ["exporter", "openExporter", "closeExporter", "showExporter"],
    ["projectSettings", "openProjectSettings", "closeProjectSettings", "showProjectSettings"],
    ["cmsCollectionSetup", "openCMSCollectionSetup", "closeCMSCollectionSetup", "showCMSCollectionSetup"],
    ["cmsRecords", "openCMSRecords", "closeCMSRecords", "showCMSRecords"],
    ["commandPalette", "openCommandPalette", "closeCommandPalette", "showCommandPalette"],
  ] as const)("%s: open sets flag, close clears it", (_name, open, close, flag) => {
    const { result } = renderHook(() => useStudioModals());
    act(() => (result.current[open] as () => void)());
    expect(result.current[flag]).toBe(true);
    act(() => (result.current[close] as () => void)());
    expect(result.current[flag]).toBe(false);
  });

  it("toggleShortcuts flips; closeShortcuts always closes", () => {
    const { result } = renderHook(() => useStudioModals());
    act(() => result.current.toggleShortcuts());
    expect(result.current.showShortcuts).toBe(true);
    act(() => result.current.toggleShortcuts());
    expect(result.current.showShortcuts).toBe(false);
    act(() => result.current.setShowShortcuts(true));
    act(() => result.current.closeShortcuts());
    expect(result.current.showShortcuts).toBe(false);
  });

  // Context-carrying modals -----------------------------------------------------
  it("openMediaLibrary stores allowedTypes + onSelect; close clears context", () => {
    const { result } = renderHook(() => useStudioModals());
    const onSelect = vi.fn();
    act(() => result.current.openMediaLibrary(["image"], onSelect));
    expect(result.current.showMediaLibrary).toBe(true);
    expect(result.current.mediaLibraryContext?.allowedTypes).toEqual(["image"]);
    // the stored callback is the exact function the caller handed in
    result.current.mediaLibraryContext?.onSelect({ id: "a" } as unknown as MediaAsset);
    expect(onSelect).toHaveBeenCalledWith({ id: "a" });
    act(() => result.current.closeMediaLibrary());
    expect(result.current.mediaLibraryContext).toBeNull();
  });

  it("openImageEditor stores imageSrc + onSave; close clears context", () => {
    const { result } = renderHook(() => useStudioModals());
    const onSave = vi.fn();
    act(() => result.current.openImageEditor("https://img/x.png", onSave));
    expect(result.current.showImageEditor).toBe(true);
    expect(result.current.imageEditorContext?.imageSrc).toBe("https://img/x.png");
    result.current.imageEditorContext?.onSave("edited.png");
    expect(onSave).toHaveBeenCalledWith("edited.png");
    act(() => result.current.closeImageEditor());
    expect(result.current.imageEditorContext).toBeNull();
  });

  it("openIconPicker stores currentIcon + onSelect", () => {
    const { result } = renderHook(() => useStudioModals());
    const onSelect = vi.fn();
    const icon = { name: "star" } as unknown as IconConfig;
    act(() => result.current.openIconPicker(icon, onSelect));
    expect(result.current.showIconPicker).toBe(true);
    expect(result.current.iconPickerContext?.currentIcon).toBe(icon);
    act(() => result.current.closeIconPicker());
    expect(result.current.iconPickerContext).toBeNull();
  });

  it("openCollectionSetup stores onConfirm", () => {
    const { result } = renderHook(() => useStudioModals());
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    act(() => result.current.openCollectionSetup(onConfirm));
    expect(result.current.showCollectionSetup).toBe(true);
    expect(result.current.collectionSetupContext?.onConfirm).toBe(onConfirm);
    act(() => result.current.closeCollectionSetup());
    expect(result.current.collectionSetupContext).toBeNull();
  });

  it("openCreateComponent stores elementId", () => {
    const { result } = renderHook(() => useStudioModals());
    act(() => result.current.openCreateComponent("el-42"));
    expect(result.current.showCreateComponent).toBe(true);
    expect(result.current.createComponentContext).toEqual({ elementId: "el-42" });
    act(() => result.current.closeCreateComponent());
    expect(result.current.createComponentContext).toBeNull();
  });

  it("openSaveAsComponent stores selectionIds + extractedBindings", () => {
    const { result } = renderHook(() => useStudioModals());
    const ctx = {
      selectionIds: ["a", "b"] as readonly string[],
      extractedBindings: new Map([["color", "brand.500"]]),
    };
    act(() => result.current.openSaveAsComponent(ctx));
    expect(result.current.showSaveAsComponent).toBe(true);
    expect(result.current.saveAsComponentContext).toBe(ctx);
    act(() => result.current.closeSaveAsComponent());
    expect(result.current.saveAsComponentContext).toBeNull();
  });

  // Loading flags ---------------------------------------------------------------
  it("previewLoading / exportLoading setters work", () => {
    const { result } = renderHook(() => useStudioModals());
    act(() => {
      result.current.setPreviewLoading(true);
      result.current.setExportLoading(true);
    });
    expect(result.current.previewLoading).toBe(true);
    expect(result.current.exportLoading).toBe(true);
  });

  // closeAll ----------------------------------------------------------------
  it("closeAll closes every modal and clears every context", () => {
    const { result } = renderHook(() => useStudioModals());
    act(() => {
      result.current.openSaveTemplate();
      result.current.openExporter();
      result.current.setShowShortcuts(true);
      result.current.openMediaLibrary(["image"], vi.fn());
      result.current.openImageEditor("src.png", vi.fn());
      result.current.openIconPicker(undefined, vi.fn());
      result.current.openCollectionSetup(vi.fn().mockResolvedValue(undefined));
      result.current.openCreateComponent("el-1");
      result.current.openSaveAsComponent({
        selectionIds: ["a"],
        extractedBindings: new Map(),
      });
      result.current.openProjectSettings();
      result.current.openCMSCollectionSetup();
      result.current.openCMSRecords();
      result.current.openCommandPalette();
    });
    act(() => result.current.closeAll());
    const m = result.current;
    expect(m.showSaveTemplate).toBe(false);
    expect(m.showExporter).toBe(false);
    expect(m.showShortcuts).toBe(false);
    expect(m.showMediaLibrary).toBe(false);
    expect(m.showImageEditor).toBe(false);
    expect(m.showIconPicker).toBe(false);
    expect(m.showCollectionSetup).toBe(false);
    expect(m.showCreateComponent).toBe(false);
    expect(m.showSaveAsComponent).toBe(false);
    expect(m.showProjectSettings).toBe(false);
    expect(m.showCMSCollectionSetup).toBe(false);
    expect(m.showCMSRecords).toBe(false);
    expect(m.showCommandPalette).toBe(false);
    expect(m.mediaLibraryContext).toBeNull();
    expect(m.imageEditorContext).toBeNull();
    expect(m.iconPickerContext).toBeNull();
    expect(m.collectionSetupContext).toBeNull();
    expect(m.createComponentContext).toBeNull();
    expect(m.saveAsComponentContext).toBeNull();
  });

  it("closeAll does NOT reset the loading flags (they are not modal state)", () => {
    const { result } = renderHook(() => useStudioModals());
    act(() => {
      result.current.setPreviewLoading(true);
      result.current.setExportLoading(true);
    });
    act(() => result.current.closeAll());
    expect(result.current.previewLoading).toBe(true);
    expect(result.current.exportLoading).toBe(true);
  });

  // Encapsulation ---------------------------------------------------------------
  it("does not leak the internal sub-hook reset functions", () => {
    const { result } = renderHook(() => useStudioModals());
    const asRecord = result.current as unknown as Record<string, unknown>;
    expect(asRecord.resetContentModals).toBeUndefined();
    expect(asRecord.resetDomainModals).toBeUndefined();
  });
});
