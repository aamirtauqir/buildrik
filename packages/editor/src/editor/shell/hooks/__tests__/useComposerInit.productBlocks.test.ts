/**
 * The Products-collection prompt fires on the event product blocks actually
 * send.
 *
 * It listened for ELEMENT_CREATED on an element typed `product-card` /
 * `product-grid` / `product-detail`. All three blocks are HTML-content blocks:
 * they insert through `insertHTMLToElement`, which emits nothing at all and
 * types each element from its TAG. Measured in the running editor, inserting
 * Product Card from the Insert panel produced a `container` and no event — so
 * the modal, `ProductCollectionService` and its sample-data flow could not be
 * reached from the only door that inserts these blocks.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EVENTS } from "@/shared/constants/events";
import { useComposerInit } from "../useComposerInit";

type EventHandler = (...args: unknown[]) => void;
const handlers: Record<string, EventHandler[]> = {};

const composer = {
  on: vi.fn((e: string, h: EventHandler) => {
    (handlers[e] ??= []).push(h);
  }),
  off: vi.fn((e: string, h: EventHandler) => {
    handlers[e] = (handlers[e] ?? []).filter((x) => x !== h);
  }),
  emit: vi.fn((e: string, ...args: unknown[]) => (handlers[e] ?? []).forEach((h) => h(...args))),
  saveProject: vi.fn(() => Promise.resolve()),
  loadProject: vi.fn(() => Promise.resolve(null)),
  importProject: vi.fn(),
  setProjectLoading: vi.fn(),
  isProjectLoading: vi.fn(() => false),
  exportProject: vi.fn(() => ({})),
  elements: { getAllPages: vi.fn(() => [{ id: "page-1" }]), createPage: vi.fn(), getElement: vi.fn() },
  history: { canUndo: vi.fn(() => false), canRedo: vi.fn(() => false) },
  cms: { collections: {} },
  cmsManager: {},
  migration: { run: vi.fn(({ project, currentVersion }) => ({ project, newVersion: currentVersion })) },
  aliasResolver: { validate: vi.fn(), resolve: vi.fn(), getChain: vi.fn() },
  destroy: vi.fn(),
};

vi.mock("../../../../engine", () => ({ createComposer: vi.fn(() => composer), Composer: class {} }));
/* A class, not `vi.fn(() => ({…}))`: the hook calls `new
   ProductCollectionService(...)`, and an arrow function is not constructible. */
vi.mock("../../../../engine/cms", () => ({
  ProductCollectionService: class {
    hasProductsCollection() {
      return Promise.resolve(false);
    }
    createProductsCollection() {
      return Promise.resolve();
    }
  },
}));
vi.mock("@/services/BuildrikSyncProvider", () => ({
  getSiteIdFromUrl: vi.fn(() => null),
  loadProject: vi.fn(() => Promise.resolve({})),
  loadServerMedia: vi.fn(() => Promise.resolve(null)),
  saveProject: vi.fn(() => Promise.resolve({ success: true, savedAt: new Date() })),
}));
vi.mock("@/services/AssetUploadService", () => ({ createRemoteAssetSync: vi.fn(() => ({})) }));

function mount(openCollectionSetup: ReturnType<typeof vi.fn>) {
  const div = document.createElement("div");
  return renderHook(() =>
    useComposerInit({
      containerRef: { current: div } as React.RefObject<HTMLDivElement | null>,
      addToast: vi.fn(),
      setCanUndo: vi.fn(),
      setCanRedo: vi.fn(),
      setDevice: vi.fn(),
      setZoom: vi.fn(),
      setShowExporter: vi.fn(),
      setShowComponentView: vi.fn(),
      setIsDirty: vi.fn(),
      setSaveState: vi.fn(),
      openCollectionSetup,
    }),
  );
}

describe("Products-collection prompt", () => {
  beforeEach(() => {
    Object.keys(handlers).forEach((k) => delete handlers[k]);
    vi.clearAllMocks();
    composer.on.mockImplementation((e: string, h: EventHandler) => {
      (handlers[e] ??= []).push(h);
    });
    composer.off.mockImplementation((e: string, h: EventHandler) => {
      handlers[e] = (handlers[e] ?? []).filter((x) => x !== h);
    });
    composer.emit.mockImplementation((e: string, ...args: unknown[]) =>
      (handlers[e] ?? []).forEach((h) => h(...args)),
    );
  });

  it("offers the collection when a product block is inserted", async () => {
    const open = vi.fn();
    mount(open);
    await act(async () => {
      composer.emit(EVENTS.ELEMENT_INSERTED, { elementId: "el-1", blockId: "product-card" });
    });
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("covers the grid and detail blocks too", async () => {
    for (const blockId of ["product-grid", "product-detail"]) {
      Object.keys(handlers).forEach((k) => delete handlers[k]);
      const open = vi.fn();
      mount(open);
      await act(async () => {
        composer.emit(EVENTS.ELEMENT_INSERTED, { elementId: "el-1", blockId });
      });
      expect(open, blockId).toHaveBeenCalledTimes(1);
    }
  });

  it("stays quiet for every other block", async () => {
    const open = vi.fn();
    mount(open);
    await act(async () => {
      composer.emit(EVENTS.ELEMENT_INSERTED, { elementId: "el-1", blockId: "hero" });
    });
    expect(open).not.toHaveBeenCalled();
  });

  it("asks once, not on every product block", async () => {
    const open = vi.fn();
    mount(open);
    await act(async () => {
      composer.emit(EVENTS.ELEMENT_INSERTED, { elementId: "el-1", blockId: "product-card" });
      composer.emit(EVENTS.ELEMENT_INSERTED, { elementId: "el-2", blockId: "product-grid" });
    });
    expect(open).toHaveBeenCalledTimes(1);
  });
});
