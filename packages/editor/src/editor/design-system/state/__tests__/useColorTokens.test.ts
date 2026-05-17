import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { DesignToken } from "../../types";
import { useColorTokens } from "../useColorTokens";

const MOCK_TOKEN: DesignToken = {
  id: "color-primary",
  name: "Primary",
  value: "#3B82F6",
  category: "colors",
  cssVar: "--buildrick-design-color-primary",
  type: "color",
  group: "brand",
};

const INITIAL = [MOCK_TOKEN];

describe("useColorTokens — addToken", () => {
  it("appends the new token to the tokens array", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    const newToken: DesignToken = {
      id: "color-cta",
      name: "CTA",
      value: "#FF6B00",
      category: "colors",
      cssVar: "--buildrick-design-color-cta",
      type: "color",
      group: "brand",
    };
    act(() => result.current.addToken(newToken));
    expect(result.current.tokens).toHaveLength(2);
    expect(result.current.tokens[1].id).toBe("color-cta");
  });

  it("marks isDirty after addToken", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    const newToken: DesignToken = {
      id: "color-new",
      name: "New",
      value: "#AABBCC",
      category: "colors",
      cssVar: "--buildrick-design-color-new",
      type: "color",
      group: "brand",
    };
    act(() => result.current.addToken(newToken));
    expect(result.current.isDirty).toBe(true);
  });
});

describe("useColorTokens — deleteToken", () => {
  it("removes a token by id (hard delete — back-compat)", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.deleteToken("color-primary"));
    expect(result.current.tokens).toHaveLength(0);
  });

  it("marks isDirty after deleteToken", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.deleteToken("color-primary"));
    expect(result.current.isDirty).toBe(true);
  });

  // B4 lock (2026-05-16): soft-delete via replaceWith uses B1 replacedBy bridge.
  // Token stays in registry but resolver redirects to replacement.

  it("soft-deletes with { replaceWith } — keeps token + sets replacedBy", () => {
    const REPL: DesignToken = { ...MOCK_TOKEN, id: "color-replacement", name: "Replacement" };
    const { result } = renderHook(() => useColorTokens([MOCK_TOKEN, REPL]));
    act(() => result.current.deleteToken("color-primary", { replaceWith: "color-replacement" }));
    // Token NOT removed from array (soft-delete)
    expect(result.current.tokens).toHaveLength(2);
    const soft = result.current.tokens.find((t) => t.id === "color-primary");
    expect(soft).toBeDefined();
    expect(soft?.replacedBy).toBe("color-replacement");
  });

  it("soft-delete marks isDirty (registry changed)", () => {
    const REPL: DesignToken = { ...MOCK_TOKEN, id: "color-replacement" };
    const { result } = renderHook(() => useColorTokens([MOCK_TOKEN, REPL]));
    act(() => result.current.deleteToken("color-primary", { replaceWith: "color-replacement" }));
    expect(result.current.isDirty).toBe(true);
  });
});

// B1 follow-up (2026-05-17): renameToken creates a new canonical token with
// the requested id and leaves the old token in place with replacedBy set so
// the resolver can bridge consumers from the old id to the new one.
describe("useColorTokens — renameToken", () => {
  it("appends a new token with the requested id, copies fields, derives cssVar", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.renameToken("color-primary", "color-action-new"));
    expect(result.current.tokens).toHaveLength(2);
    const fresh = result.current.tokens.find((t) => t.id === "color-action-new");
    expect(fresh).toBeDefined();
    expect(fresh?.value).toBe(MOCK_TOKEN.value);
    expect(fresh?.category).toBe("colors");
    expect(fresh?.cssVar).toBe("--buildrick-design-color-action-new");
    expect(fresh?.replacedBy).toBeUndefined();
  });

  it("marks the old token with replacedBy pointing at the new id", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.renameToken("color-primary", "color-action-new"));
    const old = result.current.tokens.find((t) => t.id === "color-primary");
    expect(old).toBeDefined();
    expect(old?.replacedBy).toBe("color-action-new");
  });

  it("marks isDirty after rename", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.renameToken("color-primary", "color-action-new"));
    expect(result.current.isDirty).toBe(true);
  });

  it("is a no-op when oldId does not exist", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.renameToken("color-nonexistent", "color-other"));
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0].id).toBe("color-primary");
  });

  it("is a no-op when newId already exists (avoid collision)", () => {
    const REPL: DesignToken = { ...MOCK_TOKEN, id: "color-existing" };
    const { result } = renderHook(() => useColorTokens([MOCK_TOKEN, REPL]));
    act(() => result.current.renameToken("color-primary", "color-existing"));
    // Old token untouched (no replacedBy written), no third token created.
    expect(result.current.tokens).toHaveLength(2);
    const old = result.current.tokens.find((t) => t.id === "color-primary");
    expect(old?.replacedBy).toBeUndefined();
  });
});
