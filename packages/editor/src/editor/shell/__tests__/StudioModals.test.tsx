/**
 * StudioModals.test.tsx — mounting contract: each modal renders only when its
 * flag (and, where required, its context) is set. Heavy child modals are
 * mocked to marker divs; the test asserts presence/absence per flag.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// ── heavy children → marker divs ─────────────────────────────────────────────
// Convention: modals with an isOpen prop render their marker only when open —
// that mirrors the real components' contract (they render null when closed).

vi.mock("../../../templates/SaveTemplate", () => ({
  SaveTemplate: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="modal-save-template" /> : null,
}));
vi.mock("../../ecommerce", () => ({
  CollectionSetupModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="modal-collection-setup" /> : null,
}));
vi.mock("../../export", () => ({
  ExportModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="modal-export" /> : null,
}));
vi.mock("../../media", () => ({
  MediaLibraryPanel: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="modal-media-library" /> : null,
  ImageEditorModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="modal-image-editor" /> : null,
  IconPickerModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="modal-icon-picker" /> : null,
}));
vi.mock("../../panels/KeyboardShortcutsPanel", () => ({
  KeyboardShortcutsPanel: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="modal-shortcuts" /> : null,
}));
vi.mock("../modals/CMSCollectionSetupModal", () => ({
  CMSCollectionSetupModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="modal-cms-setup" /> : null,
}));
vi.mock("../modals/CMSRecordsModal", () => ({
  CMSRecordsModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="modal-cms-records" /> : null,
}));
// CommandPalette has no isOpen prop — StudioModals conditionally mounts it.
vi.mock("../modals/CommandPalette", () => ({
  CommandPalette: () => <div data-testid="modal-command-palette" />,
}));
vi.mock("../modals/CreateComponentModal", () => ({
  CreateComponentModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="modal-create-component" /> : null,
}));
// Save-as-Component (component-library variant) has no isOpen prop either.
vi.mock("../../sidebar/tabs/component-library/CreateComponentModal", () => ({
  CreateComponentModal: () => <div data-testid="modal-save-as-component" />,
}));
vi.mock("../modals/ProjectSettingsModal", () => ({
  ProjectSettingsModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="modal-project-settings" /> : null,
}));

import { StudioModals, type StudioModalsProps } from "../StudioModals";
import { ToastProvider } from "@/editor/ui";
import type { Composer } from "../../../engine";

function makeComposer() {
  return {
    exportHTML: vi.fn(() => ({ combined: "<html></html>" })),
    elements: { getElement: vi.fn() },
    selection: { select: vi.fn() },
    components: { createComponent: vi.fn().mockResolvedValue(undefined) },
  } as unknown as Composer;
}

function makeProps(over: Partial<StudioModalsProps> = {}): StudioModalsProps {
  return {
    composer: makeComposer(),
    showSaveTemplate: false,
    onCloseSaveTemplate: vi.fn(),
    onSaveTemplate: vi.fn(),
    showExporter: false,
    onCloseExporter: vi.fn(),
    showShortcuts: false,
    onCloseShortcuts: vi.fn(),
    showMediaLibrary: false,
    onCloseMediaLibrary: vi.fn(),
    onSelectMedia: vi.fn(),
    mediaLibraryContext: null,
    showImageEditor: false,
    onCloseImageEditor: vi.fn(),
    imageEditorContext: null,
    showIconPicker: false,
    onCloseIconPicker: vi.fn(),
    iconPickerContext: null,
    showCollectionSetup: false,
    onCloseCollectionSetup: vi.fn(),
    collectionSetupContext: null,
    showCreateComponent: false,
    onCloseCreateComponent: vi.fn(),
    createComponentContext: null,
    showSaveAsComponent: false,
    onCloseSaveAsComponent: vi.fn(),
    saveAsComponentContext: null,
    showProjectSettings: false,
    onCloseProjectSettings: vi.fn(),
    showCMSCollectionSetup: false,
    onCloseCMSCollectionSetup: vi.fn(),
    showCMSRecords: false,
    onCloseCMSRecords: vi.fn(),
    showCommandPalette: false,
    onCloseCommandPalette: vi.fn(),
    ...over,
  };
}

function renderModals(over: Partial<StudioModalsProps> = {}) {
  return render(
    <ToastProvider>
      <StudioModals {...makeProps(over)} />
    </ToastProvider>
  );
}

const ALL_MARKERS = [
  "modal-save-template",
  "modal-export",
  "modal-shortcuts",
  "modal-media-library",
  "modal-image-editor",
  "modal-icon-picker",
  "modal-collection-setup",
  "modal-create-component",
  "modal-save-as-component",
  "modal-project-settings",
  "modal-cms-setup",
  "modal-cms-records",
  "modal-command-palette",
];

describe("StudioModals — mounting contract", () => {
  afterEach(() => cleanup());

  it("renders NO modal when every flag is false", () => {
    renderModals();
    for (const id of ALL_MARKERS) {
      expect(screen.queryByTestId(id)).toBeNull();
    }
  });

  // Simple flag → modal pairs (no context required).
  it.each([
    ["showSaveTemplate", "modal-save-template"],
    ["showExporter", "modal-export"],
    ["showShortcuts", "modal-shortcuts"],
    ["showMediaLibrary", "modal-media-library"],
    ["showCollectionSetup", "modal-collection-setup"],
    ["showCreateComponent", "modal-create-component"],
    ["showProjectSettings", "modal-project-settings"],
    ["showCMSCollectionSetup", "modal-cms-setup"],
    ["showCMSRecords", "modal-cms-records"],
    ["showCommandPalette", "modal-command-palette"],
  ] as [keyof StudioModalsProps, string][])(
    "%s: true mounts only %s",
    (flag, marker) => {
      renderModals({ [flag]: true } as Partial<StudioModalsProps>);
      expect(screen.getByTestId(marker)).toBeInTheDocument();
      for (const other of ALL_MARKERS.filter((m) => m !== marker)) {
        expect(screen.queryByTestId(other)).toBeNull();
      }
    }
  );

  // Context-gated modals: flag alone is NOT enough.
  it("image editor needs flag AND context", () => {
    renderModals({ showImageEditor: true });
    expect(screen.queryByTestId("modal-image-editor")).toBeNull();
    cleanup();
    renderModals({
      showImageEditor: true,
      imageEditorContext: { imageSrc: "data:image/png;base64,x", onSave: vi.fn() },
    });
    expect(screen.getByTestId("modal-image-editor")).toBeInTheDocument();
  });

  it("icon picker needs flag AND context", () => {
    renderModals({ showIconPicker: true });
    expect(screen.queryByTestId("modal-icon-picker")).toBeNull();
    cleanup();
    renderModals({
      showIconPicker: true,
      iconPickerContext: { onSelect: vi.fn() },
    });
    expect(screen.getByTestId("modal-icon-picker")).toBeInTheDocument();
  });

  it("save-as-component needs flag AND context AND composer", () => {
    const ctx = { selectionIds: ["el-1"] as readonly string[], extractedBindings: new Map<string, string>() };
    renderModals({ showSaveAsComponent: true });
    expect(screen.queryByTestId("modal-save-as-component")).toBeNull();
    cleanup();
    renderModals({ showSaveAsComponent: true, saveAsComponentContext: ctx, composer: null });
    expect(screen.queryByTestId("modal-save-as-component")).toBeNull();
    cleanup();
    renderModals({ showSaveAsComponent: true, saveAsComponentContext: ctx });
    expect(screen.getByTestId("modal-save-as-component")).toBeInTheDocument();
  });

  it("multiple flags can be open at once (modals are independent)", () => {
    renderModals({ showSaveTemplate: true, showExporter: true, showCommandPalette: true });
    expect(screen.getByTestId("modal-save-template")).toBeInTheDocument();
    expect(screen.getByTestId("modal-export")).toBeInTheDocument();
    expect(screen.getByTestId("modal-command-palette")).toBeInTheDocument();
  });
});
