// @vitest-environment jsdom
/**
 * Brand Part 1a, Task 10: a kind's tokens are the PROJECT's tokens. Every
 * edit is one `composer.designSystem.setTokens` write — no local copy, no
 * per-token undo stack, nothing staged (spec §4). Exercised through the
 * registries the provider hands Brand — the LOGGED commit (useSessionEdits),
 * so every successful write is also a Review-changes row.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { TokenRegistryProvider, useColorRegistry, useSpacingRegistry, useProjectTokenStore } from "../TokenRegistryContext";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { EVENTS } from "@/shared/constants/events";
import { emitTokenCss, resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@/engine/designSystem/types";
import { validateTokens } from "@buildrik/shared/schemas/design-tokens";

function fakeComposer(initial: DesignToken[] = DEFAULT_TOKENS, readOnly = false) {
  const listeners = new Map<string, Set<() => void>>();
  let settings = { designTokens: initial, designTokensSchemaVersion: 6 };
  /* Validates like the engine does, so a write that breaks the graph is refused. */
  const setTokens = vi.fn((next: DesignToken[]) => {
    if (composer.designSystem.readOnly || !validateTokens(next).ok) return false;
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


type Fake = ReturnType<typeof fakeComposer>;
/** The colour registry Brand reads, plus the store (its session log). */
function colorRegistry(composer: Fake | null) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TokenRegistryProvider composer={composer as never}>{children}</TokenRegistryProvider>
  );
  const { result } = renderHook(() => ({ ...useColorRegistry(), store: useProjectTokenStore() }), { wrapper });
  return { result };
}

describe("the colour registry (v6, composer-backed, logged)", () => {
  it("writes through composer.designSystem.setTokens and keeps no local undo", () => {
    const composer = fakeComposer();
    const { result } = colorRegistry(composer);
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
    // The write is a Review-changes row.
    expect(result.current.store.edits).toHaveLength(1);
  });

  it("shows the project's value right after the write — nothing staged", () => {
    const composer = fakeComposer();
    const { result } = colorRegistry(composer);
    act(() => {
      result.current.updateToken("color-primary", "#C2410C");
    });
    expect(resolveTokenLiteral(result.current.tokens, "color-primary", "light")).toBe("#C2410C");
  });

  it("follows a write it did not make (undo, update everywhere)", () => {
    const composer = fakeComposer();
    const { result } = colorRegistry(composer);
    act(() => composer.replace(setTokenLiteral(DEFAULT_TOKENS, "color-primary", "light", "#111111")));
    expect(resolveTokenLiteral(result.current.tokens, "color-primary", "light")).toBe("#111111");
  });

  it("only lists its own kind", () => {
    const composer = fakeComposer();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TokenRegistryProvider composer={composer as never}>{children}</TokenRegistryProvider>
    );
    const { result } = renderHook(() => useSpacingRegistry(), { wrapper });
    expect(result.current.tokens.length).toBeGreaterThan(0);
    expect(result.current.tokens.every((t) => t.kind === "spacing")).toBe(true);
  });

  it("a dark edit writes the dark mode", () => {
    const composer = fakeComposer();
    const { result } = colorRegistry(composer);
    act(() => {
      result.current.updateToken("color-primary", "#222222", "dark");
    });
    const [written] = composer.designSystem.setTokens.mock.calls[0];
    expect(resolveTokenLiteral(written, "color-primary", "dark")).toBe("#222222");
  });

  it("rename is one write and bridges the old id to the new one (B1 replacedBy)", () => {
    const composer = fakeComposer();
    const { result } = colorRegistry(composer);
    act(() => {
      result.current.renameToken("color-accent", "color-highlight");
    });
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
    const renamed = result.current.tokens.find((t) => t.id === "color-highlight");
    expect(renamed?.cssVar).toBe("--buildrick-design-color-highlight");
    expect(result.current.tokens.find((t) => t.id === "color-accent")?.replacedBy).toBe("color-highlight");
  });

  it("after a rename, an edit reaches elements still bound to the old var (BR-1, real emitter)", () => {
    const composer = fakeComposer();
    const { result } = colorRegistry(composer);
    act(() => {
      result.current.renameToken("color-accent", "color-highlight");
    });
    act(() => {
      result.current.updateToken("color-highlight", "#FF0000");
    });
    const css = emitTokenCss(composer.getProjectSettings().designTokens, { darkMode: "off" });
    expect(css).toContain("--buildrick-design-color-accent:var(--buildrick-design-color-highlight)");
    expect(resolveTokenLiteral(composer.getProjectSettings().designTokens, "color-highlight", "light")).toBe("#FF0000");
  });

  it("rename onto a taken id writes nothing", () => {
    const composer = fakeComposer();
    const { result } = colorRegistry(composer);
    let ok = true;
    act(() => {
      ok = result.current.renameToken("color-accent", "color-primary");
    });
    expect(ok).toBe(false);
    expect(composer.designSystem.setTokens).not.toHaveBeenCalled();
  });

  it("writes nothing while read-only", () => {
    const composer = fakeComposer(DEFAULT_TOKENS, true);
    const { result } = colorRegistry(composer);
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
    const { result } = colorRegistry(null);
    expect(result.current.tokens.length).toBeGreaterThan(0);
    let ok = true;
    act(() => {
      ok = result.current.updateToken("color-primary", "#C2410C");
    });
    expect(ok).toBe(false);
  });
});

/** A colour primitive some other token aliases — deleting it would break the graph. */
const aliasedPrimitive = () =>
  DEFAULT_TOKENS.find(
    (p) => p.kind === "color" && p.layer === "primitive" &&
      DEFAULT_TOKENS.some((t) => "alias" in t.modes.light && t.modes.light.alias === p.id),
  )!;

describe("the colour registry — delete, add, filter through the logged commit", () => {
  const extra: DesignToken = {
    id: "color-extra", name: "Extra", kind: "color", layer: "primitive", category: "colors",
    cssVar: "--buildrick-design-color-extra", type: "color", modes: { light: { value: "#123456" } },
  };

  it("hard delete removes the token in one write", () => {
    const composer = fakeComposer([...DEFAULT_TOKENS, extra]);
    const { result } = colorRegistry(composer);
    let ok = false;
    act(() => {
      ok = result.current.deleteToken("color-extra");
    });
    expect(ok).toBe(true);
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
    expect(result.current.store.edits[0].label).toBe("Delete token");
    expect(result.current.tokens.some((t) => t.id === "color-extra")).toBe(false);
  });

  it("soft delete keeps the token and bridges it to the replacement", () => {
    const composer = fakeComposer([...DEFAULT_TOKENS, extra]);
    const { result } = colorRegistry(composer);
    act(() => {
      result.current.deleteToken("color-extra", { replaceWith: "color-primary" });
    });
    expect(result.current.tokens.find((t) => t.id === "color-extra")?.replacedBy).toBe("color-primary");
  });

  it("replace & delete re-points the deleted token's var at the replacement (BR-1, real emitter)", () => {
    const composer = fakeComposer([...DEFAULT_TOKENS, extra]);
    const { result } = colorRegistry(composer);
    act(() => {
      result.current.deleteToken("color-extra", { replaceWith: "color-primary" });
    });
    const css = emitTokenCss(composer.getProjectSettings().designTokens, { darkMode: "off" });
    expect(css).toContain("--buildrick-design-color-extra:var(--buildrick-design-color-primary)");
    expect(css).not.toContain("--buildrick-design-color-extra:#123456");
  });

  it("deleting a token another token aliases is refused — nothing written", () => {
    const composer = fakeComposer();
    const target = aliasedPrimitive();
    const { result } = colorRegistry(composer);
    let ok = true;
    act(() => {
      ok = result.current.deleteToken(target.id);
    });
    expect(ok).toBe(false);
    expect(result.current.store.edits).toHaveLength(0);
    expect(composer.getProjectSettings().designTokens).toBe(DEFAULT_TOKENS);
    expect(result.current.tokens.some((t) => t.id === target.id)).toBe(true);
  });

  it("adding a token whose id is taken is refused before any write", () => {
    const composer = fakeComposer();
    const { result } = colorRegistry(composer);
    let ok = true;
    act(() => {
      ok = result.current.addToken({ ...extra, id: "color-primary" });
    });
    expect(ok).toBe(false);
    expect(composer.designSystem.setTokens).not.toHaveBeenCalled();
  });

  it("adding a new token is one write", () => {
    const composer = fakeComposer();
    const { result } = colorRegistry(composer);
    act(() => {
      result.current.addToken(extra);
    });
    expect(result.current.tokens.some((t) => t.id === "color-extra")).toBe(true);
  });

  it("filterTokens matches name or id, case-insensitively; blank returns all", () => {
    const composer = fakeComposer([...DEFAULT_TOKENS, extra]);
    const { result } = colorRegistry(composer);
    expect(result.current.filterTokens("EXTRA").map((t) => t.id)).toEqual(["color-extra"]);
    expect(result.current.filterTokens("color-extra").map((t) => t.id)).toEqual(["color-extra"]);
    expect(result.current.filterTokens("  ")).toHaveLength(result.current.tokens.length);
    expect(result.current.filterTokens("zzz-nothing")).toEqual([]);
  });
});
