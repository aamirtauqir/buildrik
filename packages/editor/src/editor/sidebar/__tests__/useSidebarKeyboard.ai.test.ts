// @vitest-environment jsdom
/**
 * G2-127: AI has one home, the inspector column. "I" no longer opens a drawer
 * tab; it asks for the assistant.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSidebarKeyboard } from "../useSidebarKeyboard";

describe("useSidebarKeyboard — I opens the assistant", () => {
  it("calls onAssistant, not onTabChange", () => {
    const onTabChange = vi.fn();
    const onAssistant = vi.fn();
    renderHook(() => useSidebarKeyboard(onTabChange, onAssistant));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "i" }));
    expect(onAssistant).toHaveBeenCalledTimes(1);
    expect(onTabChange).not.toHaveBeenCalled();
  });
});

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
    // "S" (Settings) hits a plain button inside the confirm dialog, not an
    // INPUT/TEXTAREA — the tagName guard alone lets it through.
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it("still switches tabs once no modal is open", () => {
    const onTabChange = vi.fn();
    renderHook(() => useSidebarKeyboard(onTabChange));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
    expect(onTabChange).toHaveBeenCalledWith("settings");
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
    renderHook(() => useSidebarKeyboard(onTabChange, undefined, new Set(["review"])));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    expect(onTabChange).not.toHaveBeenCalled();
  });
});
