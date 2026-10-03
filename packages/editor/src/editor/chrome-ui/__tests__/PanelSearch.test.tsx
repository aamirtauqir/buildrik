/**
 * PanelSearch — a drawer's own search field (owner decision 2026-10-03: the
 * per-panel searches left the topbar). Contract: chrome-ui's TextInput with
 * its placeholder as the accessible name; Escape with text clears and stops,
 * Escape when empty passes through; ✕ clears; the keycap shows only while
 * empty; every input carries the panel-search marker.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PanelSearch, isPanelSearchInput } from "../PanelSearch";

function Harness({ shortcut, onOuterKey }: { shortcut?: string; onOuterKey?: (k: string) => void }) {
  const [v, setV] = React.useState("");
  return (
    <div onKeyDown={(e) => onOuterKey?.(e.key)}>
      <PanelSearch placeholder="Search things…" value={v} onChange={setV} shortcut={shortcut} />
    </div>
  );
}

describe("PanelSearch", () => {
  it("is a text input named by its placeholder and marked as a panel search", () => {
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Search things…" });
    expect(input.getAttribute("placeholder")).toBe("Search things…");
    expect(isPanelSearchInput(input)).toBe(true);
    expect(isPanelSearchInput(document.body)).toBe(false);
  });

  it("Escape with text clears it and stops; Escape when empty passes through", () => {
    const outer = vi.fn();
    render(<Harness onOuterKey={outer} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "hero" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input.value).toBe("");
    expect(outer).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(outer).toHaveBeenCalledWith("Escape");
  });

  it("shows the keycap while empty and the clear button once typed", () => {
    render(<Harness shortcut="⌘F" />);
    expect(screen.getByText("⌘F")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "x" } });
    expect(screen.queryByText("⌘F")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(input.value).toBe("");
  });

  it("draws no keycap when the panel binds no shortcut", () => {
    const { container } = render(<Harness />);
    expect(container.querySelector("kbd")).toBeNull();
  });
});
