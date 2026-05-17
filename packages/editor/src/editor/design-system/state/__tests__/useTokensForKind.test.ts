import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTokensForKind } from "../useTokensForKind";
import type { DesignToken } from "../../types";

const radiusToken: DesignToken = {
  id: "radius-md",
  name: "Medium radius",
  value: "8px",
  category: "layout",
  cssVar: "--bd-radius-md",
  type: "length",
  kind: "radius",
};

const colorToken: DesignToken = {
  id: "color-brand-500",
  name: "Brand 500",
  value: "#2D6DFF",
  category: "colors",
  cssVar: "--bd-color-brand-500",
  type: "color",
  kind: "color",
};

describe("useTokensForKind", () => {
  it("filters initial tokens by kind", () => {
    const { result } = renderHook(() =>
      useTokensForKind("radius", [radiusToken, colorToken])
    );
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0].id).toBe("radius-md");
  });

  it("starts with isDirty=false", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    expect(result.current.isDirty).toBe(false);
  });

  it("updateToken sets isDirty=true and adds to pendingDiff", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() => result.current.updateToken("radius-md", "12px"));
    expect(result.current.isDirty).toBe(true);
    expect(result.current.pendingDiff["radius-md"]).toBe("12px");
  });

  it("undoToken restores previous value", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() => result.current.updateToken("radius-md", "12px"));
    expect(result.current.canUndo("radius-md")).toBe(true);
    act(() => result.current.undoToken("radius-md"));
    expect(result.current.tokens[0].value).toBe("8px");
  });

  it("redoToken re-applies after undo", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() => result.current.updateToken("radius-md", "12px"));
    act(() => result.current.undoToken("radius-md"));
    expect(result.current.canRedo("radius-md")).toBe(true);
    act(() => result.current.redoToken("radius-md"));
    expect(result.current.tokens[0].value).toBe("12px");
  });

  it("markSaved clears dirty state and undo stack", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() => result.current.updateToken("radius-md", "12px"));
    act(() => result.current.markSaved());
    expect(result.current.isDirty).toBe(false);
    expect(result.current.canUndo("radius-md")).toBe(false);
  });

  it("discardAll resets tokens to savedTokens", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() => result.current.updateToken("radius-md", "12px"));
    act(() => result.current.discardAll());
    expect(result.current.tokens[0].value).toBe("8px");
    expect(result.current.isDirty).toBe(false);
  });

  it("filterTokens does case-insensitive substring match", () => {
    const { result } = renderHook(() =>
      useTokensForKind("radius", [
        radiusToken,
        { ...radiusToken, id: "radius-lg", name: "Large radius" },
      ])
    );
    expect(result.current.filterTokens("LARGE")).toHaveLength(1);
    expect(result.current.filterTokens("radius")).toHaveLength(2);
  });

  it("addToken extends list", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() =>
      result.current.addToken({ ...radiusToken, id: "radius-lg", name: "Large" })
    );
    expect(result.current.tokens).toHaveLength(2);
  });

  it("deleteToken removes by id (hard delete — back-compat)", () => {
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken]));
    act(() => result.current.deleteToken("radius-md"));
    expect(result.current.tokens).toHaveLength(0);
  });

  // B4 lock (2026-05-16): soft-delete via replaceWith uses B1 replacedBy bridge.
  // Token stays in registry; resolver redirects consumers to replacement.

  it("soft-deletes with { replaceWith } — keeps token + sets replacedBy", () => {
    const repl: DesignToken = { ...radiusToken, id: "radius-lg", name: "Large radius" };
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken, repl]));
    act(() => result.current.deleteToken("radius-md", { replaceWith: "radius-lg" }));
    expect(result.current.tokens).toHaveLength(2);
    const soft = result.current.tokens.find((t) => t.id === "radius-md");
    expect(soft).toBeDefined();
    expect(soft?.replacedBy).toBe("radius-lg");
  });

  it("soft-delete marks isDirty (registry changed)", () => {
    const repl: DesignToken = { ...radiusToken, id: "radius-lg" };
    const { result } = renderHook(() => useTokensForKind("radius", [radiusToken, repl]));
    act(() => result.current.deleteToken("radius-md", { replaceWith: "radius-lg" }));
    expect(result.current.isDirty).toBe(true);
  });
});
