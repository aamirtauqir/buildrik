/**
 * useDSLint — the linter runs here and nowhere else, so this is also the only
 * place lint findings can reach the engine store the rest of the editor reads.
 * That publish did not exist: nothing in the package called
 * `lintState.setIssues`, so the Issues panel and TokenDetailView's per-token
 * lint row were permanently empty while the DS banner showed findings.
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

const FOUND = [
  { rule: "banned-hue" as const, severity: "warning" as const, tokenId: "color-1", message: "violet" },
  { rule: "empty-value" as const, severity: "error" as const, tokenId: "color-1", message: "empty" },
  { rule: "pure-black" as const, severity: "warning" as const, tokenId: "color-2", message: "#000" },
];

function makeComposer(lintState: LintState, found = FOUND) {
  return {
    dsLinter: { lint: vi.fn(() => found) },
    designSystem: { lintState },
  } as unknown as Composer;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TokenRegistryProvider composer={undefined}>{children}</TokenRegistryProvider>
);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useDSLint — publishing to the engine store", () => {
  it("groups findings by token and writes them into lintState", () => {
    const lintState = new LintState();
    const composer = makeComposer(lintState);

    renderHook(() => useDSLint(composer), { wrapper });
    act(() => void vi.advanceTimersByTime(600));

    expect(lintState.getIssues("color-1")).toHaveLength(2);
    expect(lintState.getIssues("color-2")).toHaveLength(1);
    expect(lintState.getIssues("color-1")[0]).toMatchObject({
      type: "banned-hue",
      severity: "warning",
      message: "violet",
    });
  });

  it("drops a token's issues once it stops reporting", () => {
    const lintState = new LintState();
    lintState.setIssues("color-9", [
      { type: "pure-black", severity: "warning", message: "stale" },
    ]);
    const composer = makeComposer(lintState);

    renderHook(() => useDSLint(composer), { wrapper });
    act(() => void vi.advanceTimersByTime(600));

    expect(lintState.getIssues("color-9")).toHaveLength(0);
  });
});

describe("useDSLint — Run checks (7316:84555)", () => {
  it("brand:checks-run lints now, without waiting for the edit debounce", () => {
    const lintState = new LintState();
    const handlers: Record<string, () => void> = {};
    const composer = {
      ...makeComposer(lintState),
      on: vi.fn((e: string, h: () => void) => { handlers[e] = h; }),
      off: vi.fn(),
    } as unknown as Composer;
    renderHook(() => useDSLint(composer), { wrapper });
    act(() => void vi.advanceTimersByTime(600));
    const lint = (composer as unknown as { dsLinter: { lint: ReturnType<typeof vi.fn> } }).dsLinter.lint;
    const before = lint.mock.calls.length;
    act(() => handlers["brand:checks-run"]());
    act(() => void vi.advanceTimersByTime(1));
    expect(lint.mock.calls.length).toBe(before + 1);
  });
});
