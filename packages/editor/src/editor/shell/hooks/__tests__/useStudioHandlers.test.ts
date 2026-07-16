/**
 * useStudioHandlers.test.ts — quick-add, AI request/apply, copilot
 * insert, template select/save. Composer + block registry + template
 * actions are mocked; assertions target transaction discipline and
 * the per-branch element mutations.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStudioHandlers, type UseStudioHandlersParams } from "../useStudioHandlers";
import { STORAGE_KEYS } from "../../../../shared/constants/config";
import type { BlockData } from "../../../../shared/types";
import type { Template } from "../../../../templates/TemplateLibrary";
import type { AIGenerationResult } from "../../../../ai/AIAssistant";

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

vi.mock("../../../../templates/templateActions", () => ({
  applyTemplate: vi.fn(),
}));

vi.mock("../../../../services/templateSync", () => ({
  mirrorUserTemplate: vi.fn(() => Promise.resolve()),
}));

import { getBlockDefinitions, insertBlock } from "../../../../blocks/blockRegistry";
import { canNestElement } from "../../../../shared/utils/nesting";
import { applyTemplate } from "../../../../templates/templateActions";
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
  const openAI = vi.fn();
  const closeTemplates = vi.fn();
  const params: UseStudioHandlersParams = {
    composer: composer as unknown as UseStudioHandlersParams["composer"],
    selectedElement: null,
    aiContext: null,
    addToast,
    openAI,
    closeTemplates,
    ...overrides,
  };
  const hook = renderHook(() => useStudioHandlers(params));
  return { hook, composer, root, addToast, openAI, closeTemplates };
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
    vi.mocked(applyTemplate).mockImplementation(() => undefined);
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

  // handleAIRequest ------------------------------------------------------------
  it("handleAIRequest opens AI with a suggestion prompt for the element type", () => {
    const { hook, openAI } = mount();
    act(() =>
      hook.result.current.handleAIRequest({ elementId: "el-9", elementType: "hero" }),
    );
    expect(openAI).toHaveBeenCalledWith({
      elementId: "el-9",
      elementType: "hero",
      prompt: "Suggest improvements for hero",
    });
  });

  it("handleAIRequest falls back to 'element' when type missing", () => {
    const { hook, openAI } = mount();
    act(() => hook.result.current.handleAIRequest({}));
    expect(openAI).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "Suggest improvements for element" }),
    );
  });

  // applyAIResult --------------------------------------------------------------
  describe("applyAIResult", () => {
    const textResult: AIGenerationResult = {
      type: "text",
      content: "new copy",
    } as AIGenerationResult;

    it("no-ops without composer or without a target element id", () => {
      const noComposer = mount({ composer: null });
      act(() => noComposer.hook.result.current.applyAIResult(textResult));

      const noTarget = mount(); // aiContext + selectedElement both null
      act(() => noTarget.hook.result.current.applyAIResult(textResult));
      expect(noTarget.composer.beginTransaction).not.toHaveBeenCalled();
    });

    it("text on an <img> sets alt instead of content", () => {
      const el = makeElement({ getTagName: vi.fn(() => "IMG") });
      const { hook, composer } = mount({ aiContext: { elementId: "el-1" } });
      composer.elements.getElement.mockReturnValue(el as never);
      act(() => hook.result.current.applyAIResult(textResult));
      expect(el.setAttribute).toHaveBeenCalledWith("alt", "new copy");
      expect(el.setContent).not.toHaveBeenCalled();
      expect(composer.selection.select).toHaveBeenCalledWith(el);
      expect(composer.endTransaction).toHaveBeenCalled();
    });

    it("text on a normal element removes children then sets content", () => {
      const child = makeElement({ getId: vi.fn(() => "child-1") });
      const el = makeElement({ getChildren: vi.fn(() => [child]) });
      const { hook, composer } = mount({ aiContext: { elementId: "el-1" } });
      composer.elements.getElement.mockReturnValue(el as never);
      act(() => hook.result.current.applyAIResult(textResult));
      expect(composer.elements.removeElement).toHaveBeenCalledWith("child-1");
      expect(el.setContent).toHaveBeenCalledWith("new copy");
    });

    it("html into a container type clears it and inserts the HTML", () => {
      const el = makeElement({ getType: vi.fn(() => "section") });
      const { hook, composer } = mount({ aiContext: { elementId: "el-1" } });
      composer.elements.getElement.mockReturnValue(el as never);
      act(() =>
        hook.result.current.applyAIResult({
          type: "html",
          content: "<div>ai</div>",
        } as AIGenerationResult),
      );
      expect(el.setContent).toHaveBeenCalledWith("");
      expect(composer.elements.insertHTMLToElement).toHaveBeenCalledWith(
        "el-1",
        "<div>ai</div>",
      );
    });

    it("html into a non-container type inserts nothing", () => {
      const el = makeElement({ getType: vi.fn(() => "text") });
      const { hook, composer } = mount({ aiContext: { elementId: "el-1" } });
      composer.elements.getElement.mockReturnValue(el as never);
      act(() =>
        hook.result.current.applyAIResult({
          type: "html",
          content: "<div>ai</div>",
        } as AIGenerationResult),
      );
      expect(composer.elements.insertHTMLToElement).not.toHaveBeenCalled();
      expect(composer.endTransaction).toHaveBeenCalled();
    });

    it("image sets src and defaults alt only when missing", () => {
      const el = makeElement({ getAttribute: vi.fn(() => undefined) });
      const { hook, composer } = mount({ aiContext: { elementId: "el-1" } });
      composer.elements.getElement.mockReturnValue(el as never);
      act(() =>
        hook.result.current.applyAIResult({
          type: "image",
          content: "https://img/ai.png",
        } as AIGenerationResult),
      );
      expect(el.setAttribute).toHaveBeenCalledWith("src", "https://img/ai.png");
      expect(el.setAttribute).toHaveBeenCalledWith("alt", "AI generated image");
    });

    it("image keeps an existing alt", () => {
      const el = makeElement({ getAttribute: vi.fn(() => "existing alt") });
      const { hook, composer } = mount({ aiContext: { elementId: "el-1" } });
      composer.elements.getElement.mockReturnValue(el as never);
      act(() =>
        hook.result.current.applyAIResult({
          type: "image",
          content: "https://img/ai.png",
        } as AIGenerationResult),
      );
      expect(el.setAttribute).toHaveBeenCalledTimes(1);
      expect(el.setAttribute).toHaveBeenCalledWith("src", "https://img/ai.png");
    });

    it("falls back to selectedElement.id when aiContext has no elementId", () => {
      const el = makeElement();
      const { hook, composer } = mount({
        aiContext: null,
        selectedElement: { id: "sel-1", type: "text" },
      });
      composer.elements.getElement.mockReturnValue(el as never);
      act(() => hook.result.current.applyAIResult(textResult));
      expect(composer.elements.getElement).toHaveBeenCalledWith("sel-1");
    });
  });

  // handleCopilotInsert ----------------------------------------------------------
  describe("handleCopilotInsert", () => {
    it("html → insertHTMLToElement on root + 'Layout Inserted' toast", () => {
      const { hook, composer, addToast } = mount();
      act(() => hook.result.current.handleCopilotInsert("<div>x</div>", "html"));
      expect(composer.elements.insertHTMLToElement).toHaveBeenCalledWith(
        "root-1",
        "<div>x</div>",
      );
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Layout Inserted", tone: "success" }),
      );
      expect(composer.endTransaction).toHaveBeenCalled();
    });

    it("text → creates a text element, sets content, selects it", () => {
      const textEl = makeElement();
      const { hook, composer, root, addToast } = mount();
      composer.elements.createElement.mockReturnValue(textEl as never);
      act(() => hook.result.current.handleCopilotInsert("hello", "text"));
      expect(composer.elements.createElement).toHaveBeenCalledWith("text");
      expect(textEl.setContent).toHaveBeenCalledWith("hello");
      expect(root.addChild).toHaveBeenCalledWith(textEl);
      expect(composer.selection.select).toHaveBeenCalledWith(textEl);
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Text Inserted" }),
      );
    });

    it("image → creates an image element with src + alt", () => {
      const imgEl = makeElement();
      const { hook, composer, addToast } = mount();
      composer.elements.createElement.mockReturnValue(imgEl as never);
      act(() => hook.result.current.handleCopilotInsert("https://x/i.png", "image"));
      expect(composer.elements.createElement).toHaveBeenCalledWith("image");
      expect(imgEl.setAttribute).toHaveBeenCalledWith("src", "https://x/i.png");
      expect(imgEl.setAttribute).toHaveBeenCalledWith("alt", "AI generated image");
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Image Inserted" }),
      );
    });

    it("no-ops without composer", () => {
      const { hook, addToast } = mount({ composer: null });
      act(() => hook.result.current.handleCopilotInsert("x", "html"));
      expect(addToast).not.toHaveBeenCalled();
    });
  });

  // handleSelectTemplate ---------------------------------------------------------
  describe("handleSelectTemplate", () => {
    const template = { id: "t1", name: "Portfolio" } as unknown as Template;

    it("applies the template, closes the modal and toasts success", () => {
      const { hook, composer, addToast, closeTemplates } = mount();
      act(() => hook.result.current.handleSelectTemplate(template));
      expect(applyTemplate).toHaveBeenCalledWith(composer, template);
      expect(closeTemplates).toHaveBeenCalledTimes(1);
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Template applied", tone: "success" }),
      );
    });

    it("toasts an error and does NOT close the modal when apply throws", () => {
      vi.mocked(applyTemplate).mockImplementation(() => {
        throw new Error("bad template");
      });
      const { hook, addToast, closeTemplates } = mount();
      act(() => hook.result.current.handleSelectTemplate(template));
      expect(closeTemplates).not.toHaveBeenCalled();
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Template failed", tone: "error" }),
      );
    });

    it("no-ops without composer", () => {
      const { hook, addToast } = mount({ composer: null });
      act(() => hook.result.current.handleSelectTemplate(template));
      expect(applyTemplate).not.toHaveBeenCalled();
      expect(addToast).not.toHaveBeenCalled();
    });
  });

  // handleSaveTemplate -------------------------------------------------------------
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
