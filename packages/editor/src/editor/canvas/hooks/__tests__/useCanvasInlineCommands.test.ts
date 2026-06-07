import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "../../../../engine/Composer";
import { useCanvasInlineCommands } from "../useCanvasInlineCommands";

describe("useCanvasInlineCommands — createLink scheme validation (T4)", () => {
  let canvasDiv: HTMLDivElement;
  let editableEl: HTMLParagraphElement;
  let canvasRef: React.RefObject<HTMLDivElement | null>;

  beforeEach(() => {
    canvasDiv = document.createElement("div");
    editableEl = document.createElement("p");
    editableEl.setAttribute("data-buildrick-id", "el-1");
    editableEl.textContent = "click me";
    canvasDiv.appendChild(editableEl);
    document.body.appendChild(canvasDiv);
    canvasRef = { current: canvasDiv } as React.RefObject<HTMLDivElement | null>;
  });

  afterEach(() => {
    document.body.removeChild(canvasDiv);
    vi.clearAllMocks();
  });

  function selectAll(el: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  function makeComposer(setContent: ReturnType<typeof vi.fn>): Composer {
    return {
      elements: { getElement: vi.fn().mockReturnValue({ setContent }) },
    } as unknown as Composer;
  }

  it("does not create a javascript: link", () => {
    const setContent = vi.fn();
    const { result } = renderHook(() =>
      useCanvasInlineCommands({ composer: makeComposer(setContent), canvasRef, editingId: "el-1" })
    );

    selectAll(editableEl);
    act(() => {
      result.current.handleInlineCommand("createLink", "javascript:alert(1)");
    });

    expect(editableEl.querySelector("a")).toBeNull();
    expect(editableEl.innerHTML).not.toMatch(/javascript:/i);
  });

  it("creates a link for a safe https: url", () => {
    const setContent = vi.fn();
    const { result } = renderHook(() =>
      useCanvasInlineCommands({ composer: makeComposer(setContent), canvasRef, editingId: "el-1" })
    );

    selectAll(editableEl);
    act(() => {
      result.current.handleInlineCommand("createLink", "https://example.com");
    });

    const anchor = editableEl.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute("href")).toBe("https://example.com");
  });
});
