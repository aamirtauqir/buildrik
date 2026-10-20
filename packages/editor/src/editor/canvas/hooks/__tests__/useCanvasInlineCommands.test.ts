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

describe("useCanvasInlineCommands — Insert link wraps the selection the user made", () => {
  it("links the canvas selection even after focus moved to the URL field", () => {
    const canvasDiv = document.createElement("div");
    const p = document.createElement("p");
    p.setAttribute("data-buildrick-id", "el-2");
    p.textContent = "Lorem ipsum dolor";
    canvasDiv.appendChild(p);
    const urlField = document.createElement("input");
    urlField.value = "https://example.com";
    document.body.append(canvasDiv, urlField);
    const canvasRef = { current: canvasDiv } as React.RefObject<HTMLDivElement | null>;
    const { result } = renderHook(() => useCanvasInlineCommands({ canvasRef, editingId: "el-2" }));

    const text = p.firstChild as Text;
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(text, 6);
    range.setEnd(text, 11);
    sel.removeAllRanges();
    sel.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));

    /* Typing the URL moves the selection out of the paragraph. */
    urlField.focus();
    const away = document.createRange();
    away.selectNodeContents(document.body.lastChild as Node);
    sel.removeAllRanges();
    sel.addRange(away);
    document.dispatchEvent(new Event("selectionchange"));

    act(() => {
      result.current.handleInlineCommand("createLink", "https://example.com");
    });

    const anchor = p.querySelector("a");
    expect(anchor?.textContent).toBe("ipsum");
    expect(anchor?.getAttribute("href")).toBe("https://example.com");
    expect(p.textContent).toBe("Lorem ipsum dolor");
    canvasDiv.remove();
    urlField.remove();
  });
});

describe("useCanvasInlineCommands — Clear formatting", () => {
  it("removeFormat strips inline formatting from the selection and keeps the text and links", () => {
    const canvasDiv = document.createElement("div");
    const p = document.createElement("p");
    p.setAttribute("data-buildrick-id", "el-3");
    p.innerHTML = 'Hello <strong>bold <em>it</em></strong> <span style="color: red">red</span> <a href="https://x.dev">link</a>';
    canvasDiv.appendChild(p);
    document.body.appendChild(canvasDiv);
    const canvasRef = { current: canvasDiv } as React.RefObject<HTMLDivElement | null>;
    const { result } = renderHook(() => useCanvasInlineCommands({ canvasRef, editingId: "el-3" }));

    const range = document.createRange();
    range.selectNodeContents(p);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    act(() => {
      result.current.handleInlineCommand("removeFormat");
    });

    expect(p.innerHTML).toBe('Hello bold it red <a href="https://x.dev">link</a>');
    canvasDiv.remove();
  });
});
