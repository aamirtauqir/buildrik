/**
 * L4-032: every token row was its own Tab stop — 40+ Tabs to get past the
 * Colours table. The table is ONE Tab stop (the selected row, or the first),
 * and the arrow keys move between rows.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import * as React from "react";
import { TokenTable, TokenTableRow } from "../TokenTable";

function table(selected: string | null) {
  return render(
    <TokenTable columns={["Name"]} template="52px 1fr" label="Colours">
      {["a", "b", "c"].map((id) => (
        <TokenTableRow key={id} tokenId={id} template="52px 1fr" selected={selected === id}>
          <span>{id}</span>
        </TokenTableRow>
      ))}
    </TokenTable>,
  );
}
const tabStops = () =>
  Array.from(document.querySelectorAll<HTMLElement>("[data-token-row]")).filter((r) => r.tabIndex === 0).map((r) => r.dataset.tokenRow);

describe("TokenTable — one Tab stop, arrows inside (L4-032)", () => {
  it("only the selected row is a Tab stop", () => {
    table("b");
    expect(tabStops()).toEqual(["b"]);
  });

  it("the first row is the Tab stop when nothing is selected", () => {
    table(null);
    expect(tabStops()).toEqual(["a"]);
  });

  it("ArrowDown / ArrowUp move focus between rows, Home / End to the ends", () => {
    table(null);
    const row = (id: string) => screen.getByTestId(`brand-token-row-${id}`);
    row("a").focus();
    fireEvent.keyDown(row("a"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(row("b"));
    fireEvent.keyDown(row("b"), { key: "End" });
    expect(document.activeElement).toBe(row("c"));
    fireEvent.keyDown(row("c"), { key: "ArrowUp" });
    expect(document.activeElement).toBe(row("b"));
    fireEvent.keyDown(row("b"), { key: "Home" });
    expect(document.activeElement).toBe(row("a"));
  });
});
