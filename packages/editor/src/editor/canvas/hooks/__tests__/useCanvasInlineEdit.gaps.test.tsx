/**
 * useCanvasInlineEdit — gap coverage: tag whitelist, Enter/Escape handling,
 * sanitize-on-commit via the Enter path. (Non-left-click guard and paste
 * sanitize on click-outside live in useCanvasInlineEdit.test.ts.)
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "../../../../engine/Composer";
import { useCanvasInlineEdit } from "../useCanvasInlineEdit";

function makeMockComposer() {
  const setContent = vi.fn();
  const composer = {
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    /* The real composer is an emitter; a commit announces itself. */
    emit: vi.fn(),
    saveProject: vi.fn().mockResolvedValue(undefined),
    elements: {
      getElement: vi.fn().mockReturnValue({ setContent }),
    },
  } as unknown as Composer;
  return { composer, setContent };
}

describe("useCanvasInlineEdit — gaps", () => {
  let canvasDiv: HTMLDivElement;
  let canvasRef: React.RefObject<HTMLDivElement | null>;

  function addEl(tag: string, id: string, text = "Hello"): HTMLElement {
    const el = document.createElement(tag);
    el.setAttribute("data-buildrick-id", id);
    el.textContent = text;
    canvasDiv.appendChild(el);
    return el;
  }

  function dblClick(result: { current: { handleDoubleClick: (e: React.MouseEvent) => void } }, el: HTMLElement) {
    act(() => {
      result.current.handleDoubleClick({
        target: el,
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent);
    });
  }

  beforeEach(() => {
    canvasDiv = document.createElement("div");
    document.body.appendChild(canvasDiv);
    canvasRef = { current: canvasDiv };
  });

  afterEach(() => {
    canvasDiv.remove();
    vi.clearAllMocks();
  });

  describe("tag whitelist", () => {
    it.each(["p", "h1", "button", "td", "blockquote", "figcaption"])(
      "starts editing on double-click of a whitelisted <%s>",
      (tag) => {
        const { composer } = makeMockComposer();
        const el = addEl(tag, "el-1");
        const { result } = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));

        dblClick(result, el);

        expect(result.current.isEditing).toBe(true);
        expect(result.current.editing.id).toBe("el-1");
        expect(el.contentEditable).toBe("true");
      }
    );

    it.each(["div", "section", "img", "ul"])(
      "does NOT start editing on a non-whitelisted <%s>",
      (tag) => {
        const { composer } = makeMockComposer();
        const el = addEl(tag, "el-1");
        const { result } = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));

        dblClick(result, el);

        expect(result.current.isEditing).toBe(false);
        expect(result.current.editing.id).toBeNull();
      }
    );

    it("refuses to edit a whitelisted tag that contains nested canvas elements", () => {
      const { composer } = makeMockComposer();
      const el = addEl("p", "el-1");
      const nested = document.createElement("span");
      nested.setAttribute("data-buildrick-id", "el-child");
      el.appendChild(nested);
      const { result } = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));

      dblClick(result, el);

      expect(result.current.isEditing).toBe(false);
    });
  });

  describe("Enter / Escape", () => {
    it("Enter commits the edited HTML through a sanitize pass and an inline-edit transaction", () => {
      const { composer, setContent } = makeMockComposer();
      const el = addEl("p", "el-1", "Original");
      const { result } = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));

      dblClick(result, el);
      act(() => {
        // Simulate typed + pasted markup, including a hostile attribute
        el.innerHTML = 'Updated <img src="x" onerror="alert(1)">text';
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      });

      expect(composer.beginTransaction).toHaveBeenCalledWith("inline-edit");
      expect(composer.endTransaction).toHaveBeenCalled();
      expect(setContent).toHaveBeenCalledTimes(1);
      const persisted = setContent.mock.calls[0][0] as string;
      expect(persisted).toContain("Updated");
      expect(persisted).not.toContain("onerror"); // sanitized before persisting
      // Editing session torn down
      expect(result.current.isEditing).toBe(false);
      expect(el.contentEditable).not.toBe("true");
    });

    it("Enter without changes does not persist anything", () => {
      const { composer, setContent } = makeMockComposer();
      const el = addEl("p", "el-1", "Original");
      const { result } = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));

      dblClick(result, el);
      act(() => {
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      });

      expect(setContent).not.toHaveBeenCalled();
      expect(composer.beginTransaction).not.toHaveBeenCalled();
      expect(result.current.isEditing).toBe(false);
    });

    it("Escape cancels the edit, restores the original content and persists nothing", () => {
      const { composer, setContent } = makeMockComposer();
      const el = addEl("p", "el-1", "Original");
      const { result } = renderHook(() => useCanvasInlineEdit({ composer, canvasRef }));

      dblClick(result, el);
      act(() => {
        el.innerHTML = "Discarded edit";
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      });

      expect(el.innerHTML).toBe("Original");
      expect(setContent).not.toHaveBeenCalled();
      expect(result.current.isEditing).toBe(false);
      expect(el.contentEditable).not.toBe("true");
    });
  });
});
