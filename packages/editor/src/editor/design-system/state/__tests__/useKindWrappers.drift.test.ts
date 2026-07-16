/**
 * useRadiusTokens / useShadowTokens / useMotionTokens — thin wrappers over
 * useTokensForKind. §inspector-audit flagged these as copy-paste siblings; this
 * pins that each one delegates to useTokensForKind with ITS OWN kind and
 * exposes the same registry surface, so a future divergence is caught.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { DesignToken, TokenKind } from "../../types";
import { useRadiusTokens } from "../useRadiusTokens";
import { useShadowTokens } from "../useShadowTokens";
import { useMotionTokens } from "../useMotionTokens";

const mk = (id: string, kind: TokenKind, value: string): DesignToken => ({
  id,
  name: id,
  value,
  category: kind === "radius" ? "layout" : "effects",
  cssVar: `--bd-${id}`,
  type: "string",
  kind,
});

// A mixed multi-kind seed — each wrapper must filter to only its own kind.
const SEED: DesignToken[] = [
  mk("radius-sm", "radius", "4px"),
  mk("radius-md", "radius", "8px"),
  mk("shadow-sm", "shadow", "0 1px 2px rgba(0,0,0,0.05)"),
  mk("motion-fast", "motion", "150ms ease-out"),
];

const CASES: Array<{
  name: string;
  hook: (t: DesignToken[]) => ReturnType<typeof useRadiusTokens>;
  kind: TokenKind;
  ownIds: string[];
}> = [
  { name: "useRadiusTokens", hook: useRadiusTokens, kind: "radius", ownIds: ["radius-sm", "radius-md"] },
  { name: "useShadowTokens", hook: useShadowTokens, kind: "shadow", ownIds: ["shadow-sm"] },
  { name: "useMotionTokens", hook: useMotionTokens, kind: "motion", ownIds: ["motion-fast"] },
];

describe("kind wrappers — no drift from useTokensForKind", () => {
  for (const c of CASES) {
    describe(c.name, () => {
      it(`seeds only kind='${c.kind}' tokens (filters the mixed set)`, () => {
        const { result } = renderHook(() => c.hook(SEED));
        expect(result.current.tokens.map((t) => t.id).sort()).toEqual([...c.ownIds].sort());
      });

      it("exposes the full useTokensForKind registry surface", () => {
        const { result } = renderHook(() => c.hook(SEED));
        for (const fn of [
          "updateToken", "undoToken", "redoToken", "canUndo", "canRedo",
          "markSaved", "discardAll", "hydrateFromExternal", "filterTokens",
          "addToken", "deleteToken", "renameToken",
        ]) {
          expect(typeof (result.current as unknown as Record<string, unknown>)[fn]).toBe("function");
        }
        expect(result.current.isDirty).toBe(false);
      });

      it("updateToken marks dirty + records the diff (shared lifecycle)", () => {
        const { result } = renderHook(() => c.hook(SEED));
        const targetId = c.ownIds[0];
        act(() => result.current.updateToken(targetId, "999px"));
        expect(result.current.isDirty).toBe(true);
        expect(result.current.pendingDiff[targetId]).toBe("999px");
      });
    });
  }
});
