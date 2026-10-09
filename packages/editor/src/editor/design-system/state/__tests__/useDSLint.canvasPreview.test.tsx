/**
 * useDSLint — the theme-toggle block's canvas preview (BRP1-M12) is a view,
 * not the mode the site ships: Brand checks keep measuring contrast as they
 * did. Brand's own Light / Dark switch still moves an Auto site's verdict.
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

const contrast = vi.hoisted(() => vi.fn(() => []));
vi.mock("../../utils/contrastLint", async (orig) => ({
  ...(await orig<typeof import("../../utils/contrastLint")>()),
  buildContrastIssues: contrast,
}));

function makeComposer(preview: unknown) {
  return {
    dsLinter: { lint: vi.fn(() => []) },
    designSystem: { lintState: new LintState(), preview },
    getProjectSettings: () => ({ darkMode: "auto" }),
    elements: { getAllElements: () => [] },
    on: () => {},
    off: () => {},
  } as unknown as Composer;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TokenRegistryProvider composer={undefined}>{children}</TokenRegistryProvider>
);
const lastMode = () => (contrast.mock.calls.at(-1) as unknown[] | undefined)?.[1];

beforeEach(() => {
  vi.useFakeTimers();
  contrast.mockClear();
});
afterEach(() => vi.useRealTimers());

describe("useDSLint — contrast mode vs the canvas theme preview", () => {
  it("a canvas-toggle dark preview leaves an Auto site's contrast measured light", () => {
    renderHook(() => useDSLint(makeComposer({ tokens: [], darkMode: "auto", theme: "dark", source: "canvas" })), { wrapper });
    act(() => void vi.advanceTimersByTime(600));
    expect(lastMode()).toBe("light");
  });

  it("Brand's own dark preview still measures dark", () => {
    renderHook(() => useDSLint(makeComposer({ tokens: [], darkMode: "auto", theme: "dark" })), { wrapper });
    act(() => void vi.advanceTimersByTime(600));
    expect(lastMode()).toBe("dark");
  });
});
