// @vitest-environment jsdom
/**
 * Sidebar letter shortcuts: modal guard, ⇧A, disabled tabs.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSidebarKeyboard } from "../useSidebarKeyboard";

describe("useSidebarKeyboard — FB-6 modal guard", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("does not switch tabs while an aria-modal dialog is open", () => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    document.body.appendChild(dialog);

    const onTabChange = vi.fn();
    renderHook(() => useSidebarKeyboard(onTabChange));
    // "L" (Layers) hits a plain button inside the confirm dialog, not an
    // INPUT/TEXTAREA — the tagName guard alone lets it through.
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "l" }));
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it("still switches tabs once no modal is open", () => {
    const onTabChange = vi.fn();
    renderHook(() => useSidebarKeyboard(onTabChange));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "l" }));
    expect(onTabChange).toHaveBeenCalledWith("layers");
  });
});

describe("useSidebarKeyboard — SC-12 / owner Q4: Site settings has no letter", () => {
  it("S opens nothing (it opened full-page Site settings — REA 2026-10-20 #20)", () => {
    const onTabChange = vi.fn();
    renderHook(() => useSidebarKeyboard(onTabChange));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
    expect(onTabChange).not.toHaveBeenCalled();
  });
});

describe("useSidebarKeyboard — a letter typed into a field stays in the field", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it.each(["input", "textarea", "select"])("does not switch tabs from a focused <%s>", (tag) => {
    const field = document.createElement(tag);
    document.body.appendChild(field);
    const onTabChange = vi.fn();
    renderHook(() => useSidebarKeyboard(onTabChange));
    /* A native select's type-ahead takes letters: "L" picks "Large". */
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "l", bubbles: true }));
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it("does not switch tabs from inside a contenteditable", () => {
    const host = document.createElement("div");
    host.setAttribute("contenteditable", "true");
    const span = document.createElement("span");
    host.appendChild(span);
    document.body.appendChild(host);
    const onTabChange = vi.fn();
    renderHook(() => useSidebarKeyboard(onTabChange));
    span.dispatchEvent(new KeyboardEvent("keydown", { key: "l", bubbles: true }));
    expect(onTabChange).not.toHaveBeenCalled();
  });
});

describe("useSidebarKeyboard — FB-1 the one ⇧A listener", () => {
  it("opens components — useEditorShortcuts.ts no longer binds this chord", () => {
    const onTabChange = vi.fn();
    renderHook(() => useSidebarKeyboard(onTabChange));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "A", shiftKey: true }));
    expect(onTabChange).toHaveBeenCalledWith("components");
    expect(onTabChange).toHaveBeenCalledTimes(1);
  });
});

describe("useSidebarKeyboard — FB-4 disabledTabs", () => {
  it("does not bind a disabled tab's letter", () => {
    const onTabChange = vi.fn();
    renderHook(() => useSidebarKeyboard(onTabChange, new Set(["review"])));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    expect(onTabChange).not.toHaveBeenCalled();
  });
});
