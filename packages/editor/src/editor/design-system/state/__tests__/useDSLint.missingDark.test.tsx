/**
 * "No dark variant" (missing-dark) asks for a dark value the site never
 * shows when Dark mode is Off — live 2026-10-08: eight of them on a light-only
 * site the moment the Brand preview went Dark. Off site: none. Auto: kept.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Composer } from "@/engine";
import { LintState } from "@/engine/designSystem/LintState";
import { useDSLint } from "../useDSLint";
import { TokenRegistryProvider } from "../TokenRegistryContext";

const missingDark = { rule: "missing-dark", severity: "warning", tokenId: "color-action", message: "No dark variant" };

function makeComposer(darkMode: "auto" | "off") {
  return {
    dsLinter: { lint: vi.fn(() => [missingDark]) },
    designSystem: { lintState: new LintState() },
    getProjectSettings: () => ({ darkMode }),
    elements: { getAllElements: () => [] },
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as Composer;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TokenRegistryProvider composer={undefined}>{children}</TokenRegistryProvider>
);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useDSLint — missing-dark follows the site's Dark mode", () => {
  it("a site with Dark mode Off gets no missing-dark finding", () => {
    const { result } = renderHook(() => useDSLint(makeComposer("off")), { wrapper });
    act(() => void vi.advanceTimersByTime(600));
    expect(result.current.filter((i) => i.rule === "missing-dark")).toEqual([]);
  });

  it("a site that ships dark keeps it", () => {
    const { result } = renderHook(() => useDSLint(makeComposer("auto")), { wrapper });
    act(() => void vi.advanceTimersByTime(600));
    expect(result.current.filter((i) => i.rule === "missing-dark")).toHaveLength(1);
  });
});
