// @vitest-environment jsdom
/**
 * G2-127: AI has one home, the inspector column. "I" no longer opens a drawer
 * tab; it asks for the assistant.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
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
