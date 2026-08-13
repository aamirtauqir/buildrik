import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

  it("does not create a javascript: link", () => {
    const { result } = renderHook(() =>
      useCanvasInlineCommands({ canvasRef, editingId: "el-1" })
    );

    selectAll(editableEl);
    act(() => {
      result.current.handleInlineCommand("createLink", "javascript:alert(1)");
    });

    expect(editableEl.querySelector("a")).toBeNull();
    expect(editableEl.innerHTML).not.toMatch(/javascript:/i);
  });

  it("creates a link for a safe https: url", () => {
    const { result } = renderHook(() =>
      useCanvasInlineCommands({ canvasRef, editingId: "el-1" })
    );

    selectAll(editableEl);
    act(() => {
      result.current.handleInlineCommand("createLink", "https://example.com");
    });

    const anchor = editableEl.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute("href")).toBe("https://example.com");
  });

  /* ELEVEN of the inline toolbar's eighteen controls used to fall past the
     switch into a devLog — they rendered, took the click, and did nothing,
     silently, because devLog is a no-op outside development. jsdom does not
     implement execCommand, so these assert the DISPATCH rather than the
     resulting markup: that is the boundary that was broken. */
  const DISPATCHED = [
    "insertUnorderedList",
    "insertOrderedList",
    "justifyLeft",
    "justifyCenter",
    "justifyRight",
    "justifyFull",
    "outdent",
    "indent",
    "fontSize",
  ] as const;

  it("reaches the document for every command the toolbar can emit", () => {
    const exec = vi.fn().mockReturnValue(true);
    (document as unknown as { execCommand: unknown }).execCommand = exec;
    const { result } = renderHook(() =>
      useCanvasInlineCommands({ canvasRef, editingId: "el-1" })
    );

    for (const command of DISPATCHED) {
      exec.mockClear();
      selectAll(editableEl);
      act(() => result.current.handleInlineCommand(command, "3"));
      expect(exec, `${command} never reached the document`).toHaveBeenCalledWith(command, false, "3");
    }
  });

  it("turns CSS mode on for colours, or Chrome ignores the highlight entirely", () => {
    const exec = vi.fn().mockReturnValue(true);
    (document as unknown as { execCommand: unknown }).execCommand = exec;
    const { result } = renderHook(() =>
      useCanvasInlineCommands({ canvasRef, editingId: "el-1" })
    );

    selectAll(editableEl);
    act(() => result.current.handleInlineCommand("hiliteColor", "#ff0"));

    const calls = exec.mock.calls.map((c) => c[0]);
    expect(calls[0]).toBe("styleWithCSS");
    expect(calls).toContain("hiliteColor");
    // and put it back, because styleWithCSS is per-document state
    expect(calls[calls.length - 1]).toBe("styleWithCSS");
  });
});
