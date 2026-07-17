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

describe("useColorTokens — per-token undo/redo stacks", () => {
  it("updateToken pushes an undo entry; undoToken restores the previous value", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.updateToken("color-primary", "#FF0000"));
    expect(result.current.tokens[0].value).toBe("#FF0000");
    expect(result.current.canUndo("color-primary")).toBe(true);
    act(() => result.current.undoToken("color-primary"));
    expect(result.current.tokens[0].value).toBe("#3B82F6");
    expect(result.current.canRedo("color-primary")).toBe(true);
  });

  it("redoToken re-applies the undone value and restores the undo entry", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.updateToken("color-primary", "#FF0000"));
    act(() => result.current.undoToken("color-primary"));
    act(() => result.current.redoToken("color-primary"));
    expect(result.current.tokens[0].value).toBe("#FF0000");
    expect(result.current.canUndo("color-primary")).toBe(true);
    expect(result.current.canRedo("color-primary")).toBe(false);
  });

  it("a fresh edit clears the redo stack for that token", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.updateToken("color-primary", "#FF0000"));
    act(() => result.current.undoToken("color-primary"));
    expect(result.current.canRedo("color-primary")).toBe(true);
    act(() => result.current.updateToken("color-primary", "#00FF00"));
    expect(result.current.canRedo("color-primary")).toBe(false);
  });

  it("same-value update does not push an undo entry (no-op guard)", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.updateToken("color-primary", "#3B82F6"));
    expect(result.current.canUndo("color-primary")).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it("stacks are per-token — editing one token leaves the other's stack empty", () => {
    const SECOND: DesignToken = { ...MOCK_TOKEN, id: "color-second", value: "#111111" };
    const { result } = renderHook(() => useColorTokens([MOCK_TOKEN, SECOND]));
    act(() => result.current.updateToken("color-primary", "#FF0000"));
    expect(result.current.canUndo("color-primary")).toBe(true);
    expect(result.current.canUndo("color-second")).toBe(false);
    // Undo on the untouched token is a no-op.
    act(() => result.current.undoToken("color-second"));
    expect(result.current.tokens.find((t) => t.id === "color-second")?.value).toBe("#111111");
  });

  it("multi-step undo walks back through the full history", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.updateToken("color-primary", "#111111"));
    act(() => result.current.updateToken("color-primary", "#222222"));
    act(() => result.current.undoToken("color-primary"));
    expect(result.current.tokens[0].value).toBe("#111111");
    act(() => result.current.undoToken("color-primary"));
    expect(result.current.tokens[0].value).toBe("#3B82F6");
    expect(result.current.canUndo("color-primary")).toBe(false);
  });
});

describe("useColorTokens — pendingDiff / markSaved / discardAll", () => {
  it("updateToken populates pendingDiff with previous/current values", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.updateToken("color-primary", "#FF0000"));
    expect(result.current.pendingDiff["color-primary"]).toEqual({
      tokenId: "color-primary",
      previousValue: "#3B82F6",
      currentValue: "#FF0000",
    });
    expect(result.current.isDirty).toBe(true);
  });

  it("markSaved snapshots tokens as saved and clears diff + stacks", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.updateToken("color-primary", "#FF0000"));
    act(() => result.current.markSaved());
    expect(result.current.pendingDiff).toEqual({});
    expect(result.current.isDirty).toBe(false);
    expect(result.current.savedTokens[0].value).toBe("#FF0000");
    expect(result.current.canUndo("color-primary")).toBe(false);
  });

  it("discardAll reverts edited values to savedTokens and clears stacks", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() => result.current.updateToken("color-primary", "#FF0000"));
    act(() => result.current.discardAll());
    expect(result.current.tokens[0].value).toBe("#3B82F6");
    expect(result.current.isDirty).toBe(false);
    expect(result.current.canUndo("color-primary")).toBe(false);
    expect(result.current.canRedo("color-primary")).toBe(false);
  });

  it("resetFromSaved replaces tokens+saved and keeps only category='colors'", () => {
    const { result } = renderHook(() => useColorTokens(INITIAL));
    act(() =>
      result.current.resetFromSaved([
        { ...MOCK_TOKEN, value: "#ABCDEF" },
        {
          id: "space-4",
          name: "Space 4",
          value: "16px",
          category: "spacing",
          cssVar: "--buildrick-design-space-4",
          type: "length",
        },
      ])
    );
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0].value).toBe("#ABCDEF");
    expect(result.current.savedTokens[0].value).toBe("#ABCDEF");
    expect(result.current.isDirty).toBe(false);
  });

  it("filterTokens matches name, value and description case-insensitively", () => {
    const withDesc: DesignToken = {
      ...MOCK_TOKEN,
      id: "color-cta",
      name: "CTA",
      value: "#FF6B00",
      description: "Call to action",
    };
    const { result } = renderHook(() => useColorTokens([MOCK_TOKEN, withDesc]));
    expect(result.current.filterTokens("primary").map((t) => t.id)).toEqual(["color-primary"]);
    expect(result.current.filterTokens("#ff6b").map((t) => t.id)).toEqual(["color-cta"]);
    expect(result.current.filterTokens("call to").map((t) => t.id)).toEqual(["color-cta"]);
    expect(result.current.filterTokens("   ")).toHaveLength(2); // blank → all
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// §2-B13 (FIXED) — pendingDiff and discardAll now match savedTokens BY ID,
// not by array index (mirrors useTokensForKind). Once addToken / hard
// deleteToken shifts the array, changes are no longer misattributed to the
// wrong token and discardAll cannot overwrite an untouched token with a
// different token's saved value.
// ─────────────────────────────────────────────────────────────────────────────
describe("useColorTokens — §2-B13 id-based diff/discard (fixed)", () => {
  it("hard-deleting the first token does NOT misattribute a diff to the untouched second token", () => {
    const SECOND: DesignToken = { ...MOCK_TOKEN, id: "color-second", value: "#111111" };
    const { result } = renderHook(() => useColorTokens([MOCK_TOKEN, SECOND]));
    act(() => result.current.deleteToken("color-primary")); // hard delete index 0
    // tokens = [color-second], savedTokens = [color-primary, color-second].
    // color-second was never edited → id lookup finds its own saved value.
    expect(result.current.pendingDiff["color-second"]).toBeUndefined();
    // The delete still marks the registry dirty (array length shrank).
    expect(result.current.isDirty).toBe(true);
  });

  it("discardAll after a hard delete restores savedTokens without corrupting the untouched token", () => {
    const SECOND: DesignToken = { ...MOCK_TOKEN, id: "color-second", value: "#111111" };
    const { result } = renderHook(() => useColorTokens([MOCK_TOKEN, SECOND]));
    act(() => result.current.deleteToken("color-primary"));
    act(() => result.current.discardAll());
    // Both tokens are back at their own saved values — no cross-token bleed.
    expect(result.current.tokens.find((t) => t.id === "color-second")?.value).toBe("#111111");
    expect(result.current.tokens.find((t) => t.id === "color-primary")?.value).toBe("#3B82F6");
    expect(result.current.isDirty).toBe(false);
  });
});
