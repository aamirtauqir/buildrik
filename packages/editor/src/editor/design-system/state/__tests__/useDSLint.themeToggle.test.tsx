/**
 * useDSLint — a theme toggle on an Off site is hidden on publish (spec D12),
 * so Brand checks says so. Computed editor-side from settings + elements.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "@/engine";
import { LintState } from "@/engine/designSystem/LintState";
import { EVENTS } from "@/shared/constants/events";
import { useDSLint } from "../useDSLint";
import { TokenRegistryProvider } from "../TokenRegistryContext";

/* getStyles/getParent: an Auto site also runs the dark-pair check over its elements. */
const toggle = { getAttribute: (n: string) => (n === "data-bk-theme-toggle" ? "true" : undefined), getStyles: () => ({}), getParent: () => null };

function makeComposer(darkMode: "auto" | "off", elements: Array<typeof toggle>) {
  const handlers: Record<string, Array<() => void>> = {};
  const settings = { darkMode };
  return {
    composer: {
      dsLinter: { lint: vi.fn(() => []) },
      designSystem: { lintState: new LintState() },
      getProjectSettings: () => settings,
      elements: { getAllElements: () => elements },
      on: (e: string, h: () => void) => { (handlers[e] ??= []).push(h); },
      off: (e: string, h: () => void) => { handlers[e] = (handlers[e] ?? []).filter((x) => x !== h); },
    } as unknown as Composer,
    settings,
    fire: (e: string) => (handlers[e] ?? []).forEach((h) => h()),
  };
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TokenRegistryProvider composer={undefined}>{children}</TokenRegistryProvider>
);
const hidden = (issues: readonly { rule: string }[]) => issues.filter((i) => i.rule === "theme-toggle-hidden");

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useDSLint — theme-toggle-hidden", () => {
  it("Off site with a toggle → one site-level warning", () => {
    const { composer } = makeComposer("off", [toggle]);
    const { result } = renderHook(() => useDSLint(composer), { wrapper });
    act(() => void vi.advanceTimersByTime(600));
    expect(hidden(result.current)).toEqual([
      expect.objectContaining({ rule: "theme-toggle-hidden", tokenId: "site", severity: "warning" }),
    ]);
  });

  it("Auto site with a toggle → none", () => {
    const { composer } = makeComposer("auto", [toggle]);
    const { result } = renderHook(() => useDSLint(composer), { wrapper });
    act(() => void vi.advanceTimersByTime(600));
    expect(hidden(result.current)).toEqual([]);
  });

  it("Off site without a toggle → none", () => {
    const { composer } = makeComposer("off", []);
    const { result } = renderHook(() => useDSLint(composer), { wrapper });
    act(() => void vi.advanceTimersByTime(600));
    expect(hidden(result.current)).toEqual([]);
  });

  it("re-lints when Dark mode changes", () => {
    const stub = makeComposer("off", [toggle]);
    const { result } = renderHook(() => useDSLint(stub.composer), { wrapper });
    act(() => void vi.advanceTimersByTime(600));
    expect(hidden(result.current)).toHaveLength(1);
    stub.settings.darkMode = "auto";
    act(() => stub.fire(EVENTS.SETTINGS_CHANGE));
    act(() => void vi.advanceTimersByTime(600));
    expect(hidden(result.current)).toEqual([]);
  });
});
