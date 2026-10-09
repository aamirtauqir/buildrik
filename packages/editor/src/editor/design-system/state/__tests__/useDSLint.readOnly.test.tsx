/**
 * A read-only Brand (switch off, held, failed) shows the site's SAVED values
 * laid over the seed as literals — the v5-equivalent output, not a v6 graph.
 * Live 2026-10-09 (switch off, v5 site): every seed semantic whose value the
 * site had saved came up as "Semantic token needs an alias" — four false
 * errors in developer jargon the owner could not act on (editing is paused).
 * The rule is a v6 invariant, so a read-only set skips it; other checks stay.
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

const needsAlias = { rule: "semantic-needs-alias", severity: "error", tokenId: "color-action", message: "missing aliasOf" };
const depth = { rule: "alias-depth-exceeded", severity: "warning", tokenId: "color-text", message: "too deep" };

function makeComposer(readOnly: boolean) {
  return {
    dsLinter: { lint: vi.fn(() => [needsAlias, depth]) },
    designSystem: { lintState: new LintState(), readOnly },
    getProjectSettings: () => ({ darkMode: "off" }),
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

describe("useDSLint — a read-only set is not a v6 graph", () => {
  it("skips semantic-needs-alias while Brand is read-only, keeps the rest", () => {
    const { result } = renderHook(() => useDSLint(makeComposer(true)), { wrapper });
    act(() => void vi.advanceTimersByTime(600));
    expect(result.current.map((i) => i.rule)).toEqual(["alias-depth-exceeded"]);
  });

  it("an editable (v6) set still reports it", () => {
    const { result } = renderHook(() => useDSLint(makeComposer(false)), { wrapper });
    act(() => void vi.advanceTimersByTime(600));
    expect(result.current.map((i) => i.rule)).toContain("semantic-needs-alias");
  });
});
