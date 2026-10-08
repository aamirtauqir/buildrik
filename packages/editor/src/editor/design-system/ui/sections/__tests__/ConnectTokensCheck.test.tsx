/**
 * BRP1-M7 Connect to tokens (8224:234362 suggestions · 8224:234982
 * choose-token · 8224:235608 preview · 8224:236236 applied · 8224:236852
 * nothing-to-connect), driven by a fake `connectSuggestions` / `applyConnect`.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import type { Composer } from "@/engine/Composer";
import type { ConnectSuggestion } from "@/engine/designSystem/connectTokens";
import type { DesignToken } from "@/editor/design-system/types";
import { v6Token } from "@/engine/__tests__/test-utils/v6Token";
import { ConnectTokensCheck } from "../ConnectTokensCheck";

const tok = (id: string, name: string, value: string): DesignToken =>
  ({ ...v6Token({ id, name, value, category: "colors", cssVar: `--buildrick-design-${id}`, type: "color", kind: "color" }), layer: "semantic" }) as DesignToken;
const TOKENS = [tok("color-primary", "Primary", "#1A56DB"), tok("color-action", "Action", "#1A56DB"), tok("color-text", "Text", "#111827")];

const sug = (over: Partial<ConnectSuggestion>): ConnectSuggestion => ({
  key: "color|#1a56db",
  value: "#1A56DB",
  kind: "color",
  refs: [{ elementId: "a", prop: "color" }, { elementId: "b", prop: "background-color" }],
  elementCount: 2,
  candidates: ["color-action", "color-primary"],
  target: "color-primary",
  ...over,
});
const PRIMARY = sug({});
const TEXT = sug({ key: "color|#111827", value: "#111827", refs: [{ elementId: "c", prop: "color" }], elementCount: 1, candidates: ["color-text"], target: "color-text" });
const TIE = sug({ key: "color|#71717a", value: "#71717A", refs: [{ elementId: "d", prop: "color" }], elementCount: 1, candidates: ["color-action", "color-text"], target: null });

function setup(suggestions: ConnectSuggestion[], applyResult = 3) {
  const connectSuggestions = vi.fn(() => suggestions);
  const applyConnect = vi.fn(() => applyResult);
  const composer = { designSystem: { connectSuggestions, applyConnect, readOnly: false } } as unknown as Composer;
  const onPreview = vi.fn();
  const onBack = vi.fn();
  const onApplied = vi.fn();
  const utils = render(<ConnectTokensCheck composer={composer} tokens={TOKENS} onPreview={onPreview} onBack={onBack} onApplied={onApplied} />);
  return { ...utils, connectSuggestions, applyConnect, onPreview, onBack, onApplied };
}

describe("ConnectTokensCheck (BRP1-M7)", () => {
  it("lists each suggestion as `value · N elements → token`", () => {
    setup([PRIMARY, TEXT]);
    expect(screen.getByText("Connect exact matches")).toBeTruthy();
    const rows = screen.getAllByTestId(/^brand-connect-row-/).map((r) => r.querySelector("p")?.textContent);
    expect(rows).toEqual(["#1A56DB · 2 elements → Primary", "#111827 · 1 element → Text"]);
  });

  it("a tie has no target until the user picks one; Preview waits for the pick", () => {
    setup([TIE]);
    expect(screen.getByTestId("brand-connect-row-color|#71717a").textContent).toContain("→ Choose a token");
    expect(screen.getByText("Two tokens match #71717A. Choose one.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Preview on canvas" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Text · #111827" }));
    expect(screen.getByTestId("brand-connect-row-color|#71717a").textContent).toContain("→ Text");
    expect((screen.getByRole("button", { name: "Preview on canvas" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("Change opens the chooser for that row and a pick replaces the target", () => {
    const { applyConnect } = setup([PRIMARY]);
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    expect(screen.getByText("Two tokens match #1A56DB. Choose one.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Action · #1A56DB" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview on canvas" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(applyConnect).toHaveBeenCalledWith([{ key: "color|#1a56db", tokenId: "color-action" }]);
  });

  it("Preview highlights exactly the affected elements; Cancel clears it and applies nothing", () => {
    const { onPreview, applyConnect } = setup([PRIMARY, TEXT]);
    fireEvent.click(screen.getByRole("button", { name: "Preview on canvas" }));
    expect(onPreview).toHaveBeenLastCalledWith(["a", "b", "c"]);
    expect(screen.getByTestId("brand-connect-preview-notice").textContent).toBe(
      "Preview only · Your colours are unchanged. Confirm to connect 3 elements.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onPreview).toHaveBeenLastCalledWith(null);
    expect(applyConnect).not.toHaveBeenCalled();
  });

  it("the preview highlight is cleared on unmount", () => {
    const { onPreview, unmount } = setup([PRIMARY]);
    fireEvent.click(screen.getByRole("button", { name: "Preview on canvas" }));
    unmount();
    expect(onPreview).toHaveBeenLastCalledWith(null);
  });

  it("Apply calls applyConnect once with the picks, even on a double click, then reports the result", () => {
    const { applyConnect, onPreview, onApplied } = setup([PRIMARY, TEXT], 3);
    fireEvent.click(screen.getByRole("button", { name: "Preview on canvas" }));
    const apply = screen.getByRole("button", { name: "Apply" });
    act(() => {
      fireEvent.click(apply);
      fireEvent.click(apply);
    });
    expect(applyConnect).toHaveBeenCalledTimes(1);
    expect(applyConnect).toHaveBeenCalledWith([
      { key: "color|#1a56db", tokenId: "color-primary" },
      { key: "color|#111827", tokenId: "color-text" },
    ]);
    expect(onPreview).toHaveBeenLastCalledWith(null);
    expect(screen.getByTestId("brand-connect-applied-notice").textContent).toBe("Connected 3 elements. Your site looks the same.");
    expect(onApplied).toHaveBeenCalledWith(3);
  });

  it("names no restore point: Apply is one ⌘Z step (owner, OQ-4)", () => {
    setup([PRIMARY]);
    expect(screen.getByTestId("brand-connect-note").textContent).toBe("Apply is one ⌘Z step.");
    expect(document.body.textContent).not.toMatch(/restore point/i);
  });

  it("nothing to connect: the board's empty state with Back to colours", () => {
    const { onBack } = setup([]);
    expect(screen.getByText("Nothing to connect")).toBeTruthy();
    expect(screen.getByText("No unconnected values match your tokens.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to colours" }));
    expect(onBack).toHaveBeenCalled();
  });
});
