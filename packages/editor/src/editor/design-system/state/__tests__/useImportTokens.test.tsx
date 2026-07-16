import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { useImportTokens } from "../useImportTokens";
import { useColorRegistry, useRadiusRegistry, TokenRegistryProvider } from "../TokenRegistryContext";
import type { DesignToken } from "../../types";

const wrap = ({ children }: { children: React.ReactNode }) => (
  <TokenRegistryProvider projectId="import-test">{children}</TokenRegistryProvider>
);

const mkToken = (id: string, value: string, extra: Partial<DesignToken> = {}): DesignToken => ({
  id,
  name: id,
  value,
  category: "colors",
  cssVar: `--buildrick-design-${id}`,
  type: "color",
  ...extra,
});

beforeEach(() => {
  localStorage.clear();
});

describe("useImportTokens", () => {
  it("modifies an existing color token via updateToken", () => {
    const useCombined = () => {
      const apply = useImportTokens();
      const color = useColorRegistry();
      return { apply, color };
    };
    const { result } = renderHook(useCombined, { wrapper: wrap });
    const targetId = result.current.color.tokens[0].id;
    const originalValue = result.current.color.tokens[0].value;

    act(() => {
      result.current.apply([mkToken(targetId, "#FF0000")]);
    });

    const updated = result.current.color.tokens.find((t) => t.id === targetId);
    expect(updated?.value).toBe("#FF0000");
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
    expect(result.current.color.tokens.find((t) => t.id === "color-imported-brand")?.value).toBe("#00FF00");
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
  // BUG PIN §2-B13 — the modification path calls `updateToken(t.id, t.value)`,
  // a (id, value) narrow-band API. An incoming token that carries a darkValue
  // for an EXISTING id has its darkValue silently dropped: the registry token
  // keeps its old darkValue (or none), so re-importing a dark-mode-complete
  // export loses every dark variant on the modify path (adds keep theirs).
  // ───────────────────────────────────────────────────────────────────────────
  describe("§2-B13 darkValue drop on the modification path (pinned)", () => {
    it("documents the bug: importing an existing id with a darkValue updates value but drops darkValue", () => {
      const useCombined = () => {
        const apply = useImportTokens();
        const color = useColorRegistry();
        return { apply, color };
      };
      const { result } = renderHook(useCombined, { wrapper: wrap });
      const targetId = result.current.color.tokens[0].id;

      act(() => {
        result.current.apply([mkToken(targetId, "#FF0000", { darkValue: "#220000" })]);
      });

      const updated = result.current.color.tokens.find((t) => t.id === targetId);
      expect(updated?.value).toBe("#FF0000");
      // ← current behavior: darkValue never reaches the registry.
      expect(updated?.darkValue).not.toBe("#220000");
    });

    it.todo(
      "§2-B13 fix: modification path must carry darkValue (widen updateToken or add a patch API) — flip the documenting test above when fixed"
    );
  });
});
