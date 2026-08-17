/**
 * useStudioHandlers.test.ts — quick-add + template select/save.
 * Composer + block registry + template actions are mocked; assertions
 * target transaction discipline and the per-branch element mutations.
 * (AI request/apply + copilot insert were removed with the AIAssistant
 * surface — AI is now the AITab, which owns its own edit apply path.)
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStudioHandlers, type UseStudioHandlersParams } from "../useStudioHandlers";
import { STORAGE_KEYS } from "../../../../shared/constants/config";
import type { BlockData } from "../../../../shared/types";

vi.mock("../../../../blocks/blockRegistry", () => ({
  getBlockDefinitions: vi.fn(() => [
    { id: "hero-1", elementType: "hero" },
    { id: "nav-1", elementType: "navbar" },
  ]),
  insertBlock: vi.fn(),
}));

vi.mock("../../../../shared/utils/nesting", () => ({
  canNestElement: vi.fn(() => true),
}));

vi.mock("../../../../services/templateSync", () => ({
  mirrorUserTemplate: vi.fn(() => Promise.resolve()),
}));

import { getBlockDefinitions, insertBlock } from "../../../../blocks/blockRegistry";
import { canNestElement } from "../../../../shared/utils/nesting";
import { mirrorUserTemplate } from "../../../../services/templateSync";

// ---------------------------------------------------------------------------
// Mock element / composer factories
// ---------------------------------------------------------------------------

interface MockElement {
  getId: ReturnType<typeof vi.fn>;
  getType: ReturnType<typeof vi.fn>;
  getTagName: ReturnType<typeof vi.fn>;
  getChildCount: ReturnType<typeof vi.fn>;
  getChildren: ReturnType<typeof vi.fn>;
  setContent: ReturnType<typeof vi.fn>;
  setAttribute: ReturnType<typeof vi.fn>;
  getAttribute: ReturnType<typeof vi.fn>;
  addChild: ReturnType<typeof vi.fn>;
}

function makeElement(overrides: Partial<Record<keyof MockElement, unknown>> = {}): MockElement {
  return {
    getId: vi.fn(() => "el-1"),
    getType: vi.fn(() => "container"),
    getTagName: vi.fn(() => "DIV"),
    getChildCount: vi.fn(() => 2),
    getChildren: vi.fn(() => []),
    setContent: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(() => undefined),
    addChild: vi.fn(),
    ...(overrides as Partial<MockElement>),
  };
}

function makeComposer(root: MockElement) {
  return {
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    exportHTML: vi.fn(() => ({ combined: "<html>x</html>" })),
    elements: {
      getActivePage: vi.fn(() => ({ root: { id: "root-1" } })),
      createPage: vi.fn(),
      getElement: vi.fn(() => root),
      removeElement: vi.fn(),
      insertHTMLToElement: vi.fn(),
      createElement: vi.fn(),
    },
    selection: { select: vi.fn() },
  };
}

function mount(overrides: Partial<UseStudioHandlersParams> = {}) {
  const root = makeElement({ getId: vi.fn(() => "root-1") });
  const composer = makeComposer(root);
  const addToast = vi.fn().mockReturnValue("toast-id");
  const params: UseStudioHandlersParams = {
    composer: composer as unknown as UseStudioHandlersParams["composer"],
    addToast,
    ...overrides,
  };
  const hook = renderHook(() => useStudioHandlers(params));
  return { hook, composer, root, addToast };
}

const BLOCK: BlockData = { id: "hero-1" } as unknown as BlockData;

describe("useStudioHandlers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(canNestElement).mockReturnValue(true);
    vi.mocked(getBlockDefinitions).mockReturnValue([
      { id: "hero-1", elementType: "hero" },
      { id: "nav-1", elementType: "navbar" },
    ] as unknown as ReturnType<typeof getBlockDefinitions>);
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // handleQuickAdd -------------------------------------------------------------
  describe("handleQuickAdd", () => {
    it("no-ops without composer", () => {
      const { hook } = mount({ composer: null });
      act(() => hook.result.current.handleQuickAdd(BLOCK));
      expect(insertBlock).not.toHaveBeenCalled();
    });

    it("inserts the block at the end of the page root inside a transaction", () => {
      const { hook, composer, root } = mount();
      act(() => hook.result.current.handleQuickAdd(BLOCK));
      expect(composer.beginTransaction).toHaveBeenCalledWith("Add Element");
      expect(insertBlock).toHaveBeenCalledWith(
        composer,
        expect.objectContaining({ id: "hero-1" }),
        "root-1",
        (root.getChildCount as () => number)(),
      );
      expect(composer.endTransaction).toHaveBeenCalledTimes(1);
    });

    it("skips insert when the block id is unknown — but still ends the transaction", () => {
      const { hook, composer } = mount();
      act(() =>
        hook.result.current.handleQuickAdd({ id: "nope" } as unknown as BlockData),
      );
      expect(insertBlock).not.toHaveBeenCalled();
      expect(composer.endTransaction).toHaveBeenCalledTimes(1);
    });

    it("skips insert when nesting is not allowed", () => {
      vi.mocked(canNestElement).mockReturnValue(false);
      const { hook, composer } = mount();
      act(() => hook.result.current.handleQuickAdd(BLOCK));
      expect(insertBlock).not.toHaveBeenCalled();
      expect(composer.endTransaction).toHaveBeenCalledTimes(1);
    });

    it("creates 'Page 1' when there is no active page", () => {
      const { hook, composer } = mount();
      composer.elements.getActivePage.mockReturnValue(null as never);
      composer.elements.createPage.mockReturnValue({ root: { id: "root-new" } } as never);
      act(() => hook.result.current.handleQuickAdd(BLOCK));
      expect(composer.elements.createPage).toHaveBeenCalledWith("Page 1");
    });
  });

  // handleSaveTemplate -------------------------------------------------------------
  describe("handleSaveTemplate — the saved page is portable", () => {
    /* Board 1169:4753 promises "Tokens are snapshotted — applying it later
       re-maps them to that site's brand". The APPLY half was always wired
       (TemplatesTab resolves placeholders against a live snapshot); the SAVE
       half was not — `inverseResolveTokens` was written, tested and imported
       by nothing, so a saved template carried this project's literal hexes and
       applying it elsewhere painted that site in these colours. */
    it("stores placeholders, not this project's literal token values", () => {
      const accent = "#1a56db";
      document.documentElement.style.setProperty("--buildrick-design-color-primary", accent);
      const { hook, composer } = mount();
      composer.exportHTML = vi.fn(() => ({
        combined: `<section style="color:${accent}">hi</section>`,
      })) as never;

      act(() =>
        hook.result.current.handleSaveTemplate({ name: "Portable", category: "Custom", description: "" }),
      );

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_TEMPLATES) || "[]");
      expect(stored[0].html).not.toContain(accent);
      expect(stored[0].html).toMatch(/\{\{token\./);
      document.documentElement.style.removeProperty("--buildrick-design-color-primary");
    });
  });

  describe("handleSaveTemplate", () => {
    const data = { name: "My hero", category: "heroes", description: "d" };

    it("unshifts the template into MY_TEMPLATES, mirrors to server, toasts", () => {
      localStorage.setItem(
        STORAGE_KEYS.MY_TEMPLATES,
        JSON.stringify([{ id: "old-1", name: "Old" }]),
      );
      const { hook, addToast } = mount();
      act(() => hook.result.current.handleSaveTemplate(data));

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_TEMPLATES)!);
      expect(saved).toHaveLength(2);
      expect(saved[0]).toMatchObject({
        name: "My hero",
        category: "heroes",
        description: "d",
        html: "<html>x</html>",
      });
      expect(saved[0].id).toMatch(/^user-/);
      expect(saved[1].id).toBe("old-1");
      expect(mirrorUserTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ name: "My hero" }),
      );
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Template saved", tone: "success" }),
      );
    });

    it("toasts an error when localStorage write fails", () => {
      const spy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("quota");
        });
      const { hook, addToast } = mount();
      act(() => hook.result.current.handleSaveTemplate(data));
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Save failed", tone: "error" }),
      );
      spy.mockRestore();
    });

    it("no-ops without composer", () => {
      const { hook, addToast } = mount({ composer: null });
      act(() => hook.result.current.handleSaveTemplate(data));
      expect(addToast).not.toHaveBeenCalled();
      expect(localStorage.getItem(STORAGE_KEYS.MY_TEMPLATES)).toBeNull();
    });
  });
});
