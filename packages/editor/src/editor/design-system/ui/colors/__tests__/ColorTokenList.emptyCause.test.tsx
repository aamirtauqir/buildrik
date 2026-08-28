/**
 * The colour list has two ways to be empty and used to blame the wrong one.
 *
 * Apply a starter in Beginner mode: every colour it brings is a primitive, so
 * `filterTokensByMode` hides all of them and the list renders empty. It then
 * said `No colors match ""` — blaming a search the user never typed, one click
 * after warning them "Applying a starter overwrites your tokens." The tokens
 * were never gone; only the sentence was wrong, and it was wrong at the exact
 * moment the user was braced to lose work.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColorTokenList } from "../ColorTokenList";
import type { DesignToken } from "../../../types";

const base = {
  pendingDiff: {},
  onColorChange: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  canUndo: () => false,
  canRedo: () => false,
  onAddToken: vi.fn(),
};

const token = (id: string): DesignToken =>
  ({ id, name: id, value: "#171717", kind: "color" }) as unknown as DesignToken;

describe("ColorTokenList — which empty is it", () => {
  it("blames the mode when the mode is what emptied it", () => {
    render(<ColorTokenList {...base} tokens={[]} hiddenByModeCount={9} />);
    expect(screen.getByTestId("color-empty-mode")).toBeInTheDocument();
    expect(screen.getByText(/Beginner mode is hiding 9 colors/)).toBeInTheDocument();
    // And it says how to get out, not just what is wrong.
    expect(screen.getByText(/Switch to Pro/)).toBeInTheDocument();
    expect(screen.queryByText(/No colors match/)).toBeNull();
  });

  it("says color, singular, when it is hiding one", () => {
    render(<ColorTokenList {...base} tokens={[]} hiddenByModeCount={1} />);
    expect(screen.getByText(/hiding 1 color\./)).toBeInTheDocument();
  });

  // The search box is the component's own state, so the query is typed, not passed.
  it("still blames the search when a search is what emptied it", () => {
    render(<ColorTokenList {...base} tokens={[token("brand")]} hiddenByModeCount={9} />);
    const box = screen.getByRole("textbox");
    fireEvent.change(box, { target: { value: "zzz" } });
    expect(screen.getByText(/No colors match "zzz"/)).toBeInTheDocument();
    expect(screen.queryByTestId("color-empty-mode")).toBeNull();
  });

  it("says neither when the library is simply empty", () => {
    render(<ColorTokenList {...base} tokens={[]} hiddenByModeCount={0} />);
    expect(screen.getByText(/No colors yet\./)).toBeInTheDocument();
  });

  it("renders no empty state at all when there are tokens", () => {
    render(<ColorTokenList {...base} tokens={[token("brand")]} hiddenByModeCount={0} />);
    expect(screen.queryByTestId("color-empty")).toBeNull();
  });
});
