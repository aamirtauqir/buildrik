/**
 * B-7 / A13-9: the dashboard ⌘K palette follows the ARIA combobox pattern.
 *
 * Verify pass 3 (live): with results listed, the input had no
 * role=combobox, aria-controls or aria-activedescendant; there were 0
 * role=option, no listbox and no dialog, and ArrowDown ×3 left
 * aria-activedescendant undefined — a screen reader heard a bare text field
 * and nothing about the highlighted result.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@lib/trpc/client", () => {
  const idle = { useQuery: () => ({ data: undefined }) };
  return { trpc: { features: { list: idle }, sites: { list: idle }, team: { list: idle }, help: { search: idle } } };
});

import { CommandPalette } from "../command-palette";

async function openWith(query: string) {
  render(<CommandPalette open onClose={vi.fn()} />);
  const input = screen.getByRole("combobox", { name: "Search Buildrick" });
  fireEvent.change(input, { target: { value: query } });
  await waitFor(() => expect(screen.getAllByRole("option").length).toBeGreaterThan(1));
  return input;
}

describe("dashboard command palette — ARIA combobox", () => {
  it("is a modal dialog whose input is a combobox controlling a listbox", async () => {
    const input = await openWith("se");
    expect(screen.getByRole("dialog", { name: "Search Buildrick" })).toHaveAttribute("aria-modal", "true");
    const listbox = screen.getByRole("listbox");
    expect(input).toHaveAttribute("aria-controls", listbox.id);
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
  });

  it("points aria-activedescendant at the highlighted option and moves it with the arrows", async () => {
    const input = await openWith("se");
    const options = screen.getAllByRole("option");
    expect(input).toHaveAttribute("aria-activedescendant", options[0].id);
    expect(options[0]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const now = screen.getAllByRole("option");
    expect(input).toHaveAttribute("aria-activedescendant", now[2].id);
    expect(now[2]).toHaveAttribute("aria-selected", "true");
    expect(now[0]).toHaveAttribute("aria-selected", "false");
  });

  it("names each result group", async () => {
    await openWith("se");
    expect(screen.getByRole("group", { name: "Settings" })).toBeInTheDocument();
  });
});
