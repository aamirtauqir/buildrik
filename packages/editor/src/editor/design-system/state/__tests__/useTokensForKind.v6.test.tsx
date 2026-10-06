// @vitest-environment jsdom
/**
 * Brand Part 1a, Task 10: a kind's tokens are the PROJECT's tokens. Every
 * edit is one `composer.designSystem.setTokens` write — no local copy, no
 * per-token undo stack, nothing staged (spec §4).
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useTokensForKind } from "../useTokensForKind";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { EVENTS } from "@/shared/constants/events";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@/engine/designSystem/types";

function fakeComposer(initial: DesignToken[] = DEFAULT_TOKENS, readOnly = false) {
  const listeners = new Map<string, Set<() => void>>();
  let settings = { designTokens: initial, designTokensSchemaVersion: 6 };
  const setTokens = vi.fn((next: DesignToken[]) => {
    if (composer.designSystem.readOnly) return false;
    settings = { designTokens: next, designTokensSchemaVersion: 6 };
    listeners.get(EVENTS.SETTINGS_CHANGE)?.forEach((l) => l());
    return true;
  });
  const composer = {
    getProjectSettings: () => settings,
    designSystem: { setTokens, readOnly },
    on: vi.fn((evt: string, l: () => void) => {
      if (!listeners.has(evt)) listeners.set(evt, new Set());
      listeners.get(evt)!.add(l);
    }),
    off: vi.fn((evt: string, l: () => void) => listeners.get(evt)?.delete(l)),
    /** Something else wrote the settings (undo, another write path). */
    replace(next: DesignToken[]) {
      settings = { designTokens: next, designTokensSchemaVersion: 6 };
      listeners.get(EVENTS.SETTINGS_CHANGE)?.forEach((l) => l());
    },
  };
  return composer;
}

describe("useTokensForKind (v6, composer-backed)", () => {
  it("writes through composer.designSystem.setTokens and keeps no local undo", () => {
    const composer = fakeComposer();
    const { result } = renderHook(() => useTokensForKind("color", composer as never));
    act(() => {
      result.current.updateToken("color-primary", "#C2410C");
    });
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
    const [written] = composer.designSystem.setTokens.mock.calls[0];
    expect(resolveTokenLiteral(written, "color-primary", "light")).toBe("#C2410C");
    expect(result.current).not.toHaveProperty("undoToken");
    expect(result.current).not.toHaveProperty("markSaved");
    expect(result.current).not.toHaveProperty("savedTokens");
    expect(result.current).not.toHaveProperty("pendingDiff");
    expect(result.current).not.toHaveProperty("isDirty");
  });

  it("shows the project's value right after the write — nothing staged", () => {
    const composer = fakeComposer();
    const { result } = renderHook(() => useTokensForKind("color", composer as never));
    act(() => {
      result.current.updateToken("color-primary", "#C2410C");
    });
    expect(resolveTokenLiteral(result.current.tokens, "color-primary", "light")).toBe("#C2410C");
  });

  it("follows a write it did not make (undo, update everywhere)", () => {
    const composer = fakeComposer();
    const { result } = renderHook(() => useTokensForKind("color", composer as never));
    act(() => composer.replace(setTokenLiteral(DEFAULT_TOKENS, "color-primary", "light", "#111111")));
    expect(resolveTokenLiteral(result.current.tokens, "color-primary", "light")).toBe("#111111");
  });

  it("only lists its own kind", () => {
    const composer = fakeComposer();
    const { result } = renderHook(() => useTokensForKind("spacing", composer as never));
    expect(result.current.tokens.length).toBeGreaterThan(0);
    expect(result.current.tokens.every((t) => t.kind === "spacing")).toBe(true);
  });

  it("a dark edit writes the dark mode", () => {
    const composer = fakeComposer();
    const { result } = renderHook(() => useTokensForKind("color", composer as never));
    act(() => {
      result.current.updateToken("color-primary", "#222222", "dark");
    });
    const [written] = composer.designSystem.setTokens.mock.calls[0];
    expect(resolveTokenLiteral(written, "color-primary", "dark")).toBe("#222222");
  });

  it("rename is one write and bridges the old id to the new one (B1 replacedBy)", () => {
    const composer = fakeComposer();
    const { result } = renderHook(() => useTokensForKind("color", composer as never));
    act(() => {
      result.current.renameToken("color-accent", "color-highlight");
    });
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
    const renamed = result.current.tokens.find((t) => t.id === "color-highlight");
    expect(renamed?.cssVar).toBe("--buildrick-design-color-highlight");
    expect(result.current.tokens.find((t) => t.id === "color-accent")?.replacedBy).toBe("color-highlight");
  });

  it("rename onto a taken id writes nothing", () => {
    const composer = fakeComposer();
    const { result } = renderHook(() => useTokensForKind("color", composer as never));
    let ok = true;
    act(() => {
      ok = result.current.renameToken("color-accent", "color-primary");
    });
    expect(ok).toBe(false);
    expect(composer.designSystem.setTokens).not.toHaveBeenCalled();
  });

  it("writes nothing while read-only", () => {
    const composer = fakeComposer(DEFAULT_TOKENS, true);
    const { result } = renderHook(() => useTokensForKind("color", composer as never));
    let ok = true;
    act(() => {
      ok = result.current.updateToken("color-primary", "#C2410C");
    });
    expect(ok).toBe(false);
    expect(resolveTokenLiteral(result.current.tokens, "color-primary", "light")).toBe(
      resolveTokenLiteral(DEFAULT_TOKENS, "color-primary", "light"),
    );
  });

  it("without a composer it reads the seed and writes nothing", () => {
    const { result } = renderHook(() => useTokensForKind("color", null));
    expect(result.current.tokens.length).toBeGreaterThan(0);
    let ok = true;
    act(() => {
      ok = result.current.updateToken("color-primary", "#C2410C");
    });
    expect(ok).toBe(false);
  });
});
