/**
 * PageCommandPalette — fuzzy filter + IRON RULE scheduled label regression.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageCommandPalette } from "../components/PageCommandPalette";
import type { PageItem } from "../types";

const pages: PageItem[] = [
  { id: "p1", name: "Home", slug: "/", isHome: true, status: "live" },
  { id: "p2", name: "Launch", slug: "/launch", status: "scheduled" },
  { id: "p3", name: "About", slug: "/about", status: "draft" },
];

describe("PageCommandPalette", () => {
  it("renders all pages by default", () => {
    const { container } = render(
      <PageCommandPalette pages={pages} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    const names = Array.from(
      container.querySelectorAll(".bd-pg-palette-item-name"),
    ).map((el) => el.textContent);
    expect(names).toEqual(["Home", "Launch", "About"]);
  });

  it("filters by name as user types", () => {
    render(<PageCommandPalette pages={pages} onSelect={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Lau" } });
    expect(screen.getByText("Launch")).toBeInTheDocument();
    expect(screen.queryByText("About")).toBeNull();
  });

  // IRON RULE: regression test for pre-existing bug where scheduled pages
  // rendered "Live" because the switch was missing case "scheduled".
  // Source: PageCommandPalette.tsx:20-29 (pre-fix).
  it("scheduled page renders 'Scheduled' label, NOT 'Live'", () => {
    const { container } = render(
      <PageCommandPalette pages={pages} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    // Stronger assertion: the Launch row's status text is NOT "Live"
    const launchRow = screen.getByText("Launch").closest("[role='option']");
    expect(launchRow).not.toBeNull();
    expect(launchRow?.textContent).toMatch(/Scheduled/);
    expect(launchRow?.textContent).not.toMatch(/\bLive\b/);
  });

  it("Enter on highlighted result invokes onSelect with page id", () => {
    const onSelect = vi.fn();
    render(<PageCommandPalette pages={pages} onSelect={onSelect} onClose={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("p1");
  });

  it("Escape invokes onClose", () => {
    const onClose = vi.fn();
    render(<PageCommandPalette pages={pages} onSelect={vi.fn()} onClose={onClose} />);
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("uses .bd-pg-palette* class namespace", () => {
    const { container } = render(
      <PageCommandPalette pages={pages} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    expect(container.querySelector(".bd-pg-palette")).not.toBeNull();
    expect(container.querySelector(".pg-palette")).toBeNull();
  });
});
