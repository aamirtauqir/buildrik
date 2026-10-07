/**
 * useImportTokens — routing rules, stats, and (Brand Part 1a Task 10) ONE
 * `setTokens` write per import, refused while the tokens are read-only.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { useImportTokens } from "../useImportTokens";
import { useColorRegistry, useRadiusRegistry, TokenRegistryProvider } from "../TokenRegistryContext";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "../../types";
import { v6Token, type V6TokenSpec } from "@/engine/__tests__/test-utils/v6Token";
import { makeFakeComposer } from "@/editor/design-system/ui/__tests__/brandWorkspaceHarness";

let composer = makeFakeComposer();
const wrap = ({ children }: { children: React.ReactNode }) => (
  <TokenRegistryProvider composer={composer}>{children}</TokenRegistryProvider>
);

const mkToken = (id: string, value: string, extra: Partial<V6TokenSpec> = {}): DesignToken =>
  v6Token({ id, value, ...extra });

const lightOf = (tokens: readonly DesignToken[], id: string) => resolveTokenLiteral(tokens, id, "light");

beforeEach(() => {
  localStorage.clear();
  composer = makeFakeComposer();
});

describe("useImportTokens", () => {
  it("modifies an existing color token via updateToken", () => {
    const useCombined = () => {
      const apply = useImportTokens();
      const color = useColorRegistry();
      return { apply, color };
    };
    const { result } = renderHook(useCombined, { wrapper: wrap });
    const targetId = "color-primary";
    const originalValue = lightOf(result.current.color.tokens, targetId);

    act(() => {
      result.current.apply([mkToken(targetId, "#FF0000")]);
    });

    expect(lightOf(result.current.color.tokens, targetId)).toBe("#FF0000");
    expect(originalValue).not.toBe("#FF0000");
  });

  it("adds a new color token via addToken", () => {
    const useCombined = () => {
      const apply = useImportTokens();
      const color = useColorRegistry();
      return { apply, color };
    };
    const { result } = renderHook(useCombined, { wrapper: wrap });
    const before = result.current.color.tokens.length;

    act(() => {
      result.current.apply([mkToken("color-imported-brand", "#00FF00", { kind: "color" })]);
    });

    expect(result.current.color.tokens).toHaveLength(before + 1);
    expect(lightOf(result.current.color.tokens, "color-imported-brand")).toBe("#00FF00");
  });

  it("adds a new radius token by routing on kind", () => {
    const useCombined = () => {
      const apply = useImportTokens();
      const radius = useRadiusRegistry();
      return { apply, radius };
    };
    const { result } = renderHook(useCombined, { wrapper: wrap });
    const before = result.current.radius.tokens.length;

    act(() => {
      result.current.apply([
        mkToken("radius-imported-xl", "20px", {
          kind: "radius",
          category: "effects",
          type: "length",
          cssVar: "--buildrick-design-radius-imported-xl",
        }),
      ]);
    });

    expect(result.current.radius.tokens).toHaveLength(before + 1);
  });

  it("returns stats with modified/added counts", () => {
    const useCombined = () => {
      const apply = useImportTokens();
      const color = useColorRegistry();
      return { apply, color };
    };
    const { result } = renderHook(useCombined, { wrapper: wrap });
    const targetId = result.current.color.tokens[0].id;

    let stats: ReturnType<typeof result.current.apply> | undefined;
    act(() => {
      stats = result.current.apply([
        mkToken(targetId, "#FF0000"),
        mkToken("color-new-1", "#00FF00", { kind: "color" }),
        mkToken("color-new-2", "#0000FF", { kind: "color" }),
      ]);
    });

    expect(stats?.modified).toBe(1);
    expect(stats?.added).toBe(2);
    expect(stats?.skipped).toHaveLength(0);
  });

  it("skips adds for tokens with no routable kind/category", () => {
    const useCombined = () => {
      const apply = useImportTokens();
      return { apply };
    };
    const { result } = renderHook(useCombined, { wrapper: wrap });

    let stats: ReturnType<typeof result.current.apply> | undefined;
    act(() => {
      stats = result.current.apply([
        mkToken("mystery-id", "value", { kind: undefined, category: "buttons" as never }),
      ]);
    });

    expect(stats?.added).toBe(0);
    expect(stats?.modified).toBe(0);
    expect(stats?.skipped).toContain("mystery-id");
  });

  it("legacy category fallback routes category='colors' without a kind hint", () => {
    const useCombined = () => {
      const apply = useImportTokens();
      const color = useColorRegistry();
      return { apply, color };
    };
    const { result } = renderHook(useCombined, { wrapper: wrap });
    const before = result.current.color.tokens.length;

    act(() => {
      result.current.apply([mkToken("color-legacy-routed", "#123456", { kind: undefined })]);
    });

    expect(result.current.color.tokens).toHaveLength(before + 1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // §2-B13 (FIXED) — the modification path now calls
  // `updateToken(t.id, t.value, t.darkValue)`, so an incoming token that
  // carries a darkValue for an EXISTING id lands its dark variant in the
  // registry. Re-importing a dark-mode-complete export no longer strips dark
  // variants on the modify path.
  // ───────────────────────────────────────────────────────────────────────────
  describe("§2-B13 darkValue carried on the modification path (fixed)", () => {
    it("importing an existing id with a darkValue updates value AND carries darkValue", () => {
      const useCombined = () => {
        const apply = useImportTokens();
        const color = useColorRegistry();
        return { apply, color };
      };
      const { result } = renderHook(useCombined, { wrapper: wrap });
      // A semantic token: only those carry a dark mode in v6.
      const targetId = "color-primary";

      act(() => {
        result.current.apply([mkToken(targetId, "#FF0000", { dark: "#220000" })]);
      });

      expect(lightOf(result.current.color.tokens, targetId)).toBe("#FF0000");
      // The dark value now reaches the registry on the modify path.
      expect(resolveTokenLiteral(result.current.color.tokens, targetId, "dark")).toBe("#220000");
    });
  });
});

describe("useImportTokens — one write, read-only refuses", () => {
  it("a mixed import (modify + add) is ONE setTokens write", () => {
    const { result } = renderHook(() => useImportTokens(), { wrapper: wrap });
    act(() => {
      result.current([mkToken("color-primary", "#FF0000"), mkToken("color-new-1", "#00FF00", { kind: "color" })]);
    });
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
  });

  it("while read-only nothing is written and the stats say refused", () => {
    composer = makeFakeComposer([], { readOnly: true });
    const { result } = renderHook(() => useImportTokens(), { wrapper: wrap });
    let stats: ReturnType<typeof result.current> | undefined;
    act(() => {
      stats = result.current([mkToken("color-primary", "#FF0000")]);
    });
    expect(stats?.refused).toBe(true);
    expect(composer.settings.designTokens).toEqual([]);
  });
});
