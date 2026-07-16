/**
 * useTokenBase — shared token lifecycle used by useTypeTokens/useSpacingTokens.
 *
 * Divergences from useTokensForKind worth locking:
 *   - filters initialTokens by CATEGORY (not kind)
 *   - updateToken/undo/redo/discardAll/resetFromSaved write CSS vars straight
 *     to document.documentElement (useColorTokens leaves that to the
 *     TokenRegistryProvider effect)
 *   - undo/redo stacks live in React state Records (not refs/Maps)
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { DesignToken } from "../../types";
import { useTokenBase } from "../useTokenBase";

const typeToken: DesignToken = {
  id: "font-size-base",
  name: "Base size",
  value: "16px",
  category: "typography",
  cssVar: "--buildrick-design-font-size-base",
  type: "font-size",
};

const spacingToken: DesignToken = {
  id: "space-4",
  name: "Space 4",
  value: "16px",
  category: "spacing",
  cssVar: "--buildrick-design-space-4",
  type: "length",
};

const rootVar = (cssVar: string) =>
  document.documentElement.style.getPropertyValue(cssVar);

describe("useTokenBase — category filter", () => {
  it("keeps only tokens matching the category argument", () => {
    const { result } = renderHook(() =>
      useTokenBase([typeToken, spacingToken], "typography")
    );
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0].id).toBe("font-size-base");
    expect(result.current.savedTokens).toHaveLength(1);
  });
});

describe("useTokenBase — updateToken", () => {
  it("stages the value and writes the CSS var to :root for live preview", () => {
    const { result } = renderHook(() => useTokenBase([typeToken], "typography"));
    act(() => result.current.updateToken("font-size-base", "18px"));
    expect(result.current.tokens[0].value).toBe("18px");
    expect(rootVar(typeToken.cssVar)).toBe("18px");
    expect(result.current.isDirty).toBe(true);
  });

  it("is a no-op for an unknown id", () => {
    const { result } = renderHook(() => useTokenBase([typeToken], "typography"));
    act(() => result.current.updateToken("missing", "99px"));
    expect(result.current.tokens[0].value).toBe("16px");
    expect(result.current.isDirty).toBe(false);
  });

  it("same-value update does not push an undo entry", () => {
    const { result } = renderHook(() => useTokenBase([typeToken], "typography"));
    act(() => result.current.updateToken("font-size-base", "16px"));
    expect(result.current.canUndo("font-size-base")).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });
});

describe("useTokenBase — per-token undo/redo", () => {
  it("undo restores the previous value and enables redo", () => {
    const { result } = renderHook(() => useTokenBase([typeToken], "typography"));
    act(() => result.current.updateToken("font-size-base", "18px"));
    expect(result.current.canUndo("font-size-base")).toBe(true);
    act(() => result.current.undoToken("font-size-base"));
    expect(result.current.tokens[0].value).toBe("16px");
    expect(rootVar(typeToken.cssVar)).toBe("16px");
    expect(result.current.canRedo("font-size-base")).toBe(true);
  });

  it("redo re-applies the undone value (and the CSS var)", () => {
    const { result } = renderHook(() => useTokenBase([typeToken], "typography"));
    act(() => result.current.updateToken("font-size-base", "18px"));
    act(() => result.current.undoToken("font-size-base"));
    act(() => result.current.redoToken("font-size-base"));
    expect(result.current.tokens[0].value).toBe("18px");
    expect(rootVar(typeToken.cssVar)).toBe("18px");
    expect(result.current.canRedo("font-size-base")).toBe(false);
  });

  it("a fresh edit clears the redo stack for that token", () => {
    const { result } = renderHook(() => useTokenBase([typeToken], "typography"));
    act(() => result.current.updateToken("font-size-base", "18px"));
    act(() => result.current.undoToken("font-size-base"));
    expect(result.current.canRedo("font-size-base")).toBe(true);
    act(() => result.current.updateToken("font-size-base", "20px"));
    expect(result.current.canRedo("font-size-base")).toBe(false);
  });

  it("stacks are independent per token id", () => {
    const second: DesignToken = {
      ...typeToken,
      id: "font-size-lg",
      cssVar: "--buildrick-design-font-size-lg",
      value: "20px",
    };
    const { result } = renderHook(() =>
      useTokenBase([typeToken, second], "typography")
    );
    act(() => result.current.updateToken("font-size-base", "18px"));
    expect(result.current.canUndo("font-size-base")).toBe(true);
    expect(result.current.canUndo("font-size-lg")).toBe(false);
    act(() => result.current.undoToken("font-size-lg")); // empty stack — no-op
    expect(result.current.tokens.find((t) => t.id === "font-size-lg")?.value).toBe("20px");
  });

  it("undo with an empty stack is a no-op", () => {
    const { result } = renderHook(() => useTokenBase([typeToken], "typography"));
    act(() => result.current.undoToken("font-size-base"));
    expect(result.current.tokens[0].value).toBe("16px");
  });
});

describe("useTokenBase — markSaved / discardAll / resetFromSaved", () => {
  it("markSaved snapshots tokens into savedTokens and clears both stacks", () => {
    const { result } = renderHook(() => useTokenBase([typeToken], "typography"));
    act(() => result.current.updateToken("font-size-base", "18px"));
    act(() => result.current.markSaved());
    expect(result.current.isDirty).toBe(false);
    expect(result.current.savedTokens[0].value).toBe("18px");
    expect(result.current.canUndo("font-size-base")).toBe(false);
    expect(result.current.canRedo("font-size-base")).toBe(false);
  });

  it("discardAll reverts to savedTokens and restores CSS vars on :root", () => {
    const { result } = renderHook(() => useTokenBase([typeToken], "typography"));
    act(() => result.current.updateToken("font-size-base", "18px"));
    expect(rootVar(typeToken.cssVar)).toBe("18px");
    act(() => result.current.discardAll());
    expect(result.current.tokens[0].value).toBe("16px");
    expect(rootVar(typeToken.cssVar)).toBe("16px");
    expect(result.current.isDirty).toBe(false);
    expect(result.current.canUndo("font-size-base")).toBe(false);
  });

  it("resetFromSaved replaces tokens+saved, re-filters by category, applies CSS vars", () => {
    const { result } = renderHook(() => useTokenBase([typeToken], "typography"));
    const incoming: DesignToken[] = [
      { ...typeToken, value: "22px" },
      spacingToken, // wrong category — must be filtered out
    ];
    act(() => result.current.resetFromSaved(incoming));
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0].value).toBe("22px");
    expect(result.current.savedTokens[0].value).toBe("22px");
    expect(result.current.isDirty).toBe(false);
    expect(rootVar(typeToken.cssVar)).toBe("22px");
  });
});
