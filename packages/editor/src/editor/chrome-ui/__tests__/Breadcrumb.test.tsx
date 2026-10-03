/**
 * Breadcrumb contract — a named nav landmark; ancestors are buttons that go
 * there; the current crumb is aria-current and not a button; a long path
 * collapses its middle to "…", which expands in place.
 *
 * @license BSD-3-Clause
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Breadcrumb } from "../index";

const path = (n: number, onSelect = vi.fn()) =>
  Array.from({ length: n }, (_, i) => ({ id: `c${i}`, label: `Crumb ${i}`, onSelect: i === n - 1 ? undefined : onSelect }));

describe("Breadcrumb", () => {
  it("is a nav landmark with an ordered list", () => {
    render(<Breadcrumb label="Element path" items={path(3)} />);
    const nav = screen.getByRole("navigation", { name: "Element path" });
    expect(nav.querySelector("ol")).not.toBeNull();
    expect(nav.querySelectorAll("li")).toHaveLength(3);
  });

  it("ancestors are buttons that select; the current crumb is not a button", () => {
    const onSelect = vi.fn();
    render(<Breadcrumb label="Element path" items={path(3, onSelect)} />);
    fireEvent.click(screen.getByRole("button", { name: "Crumb 1" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    const current = screen.getByText("Crumb 2");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("button", { name: "Crumb 2" })).toBeNull();
  });

  it("separators are hidden from assistive tech", () => {
    const { container } = render(<Breadcrumb label="Element path" items={path(3)} />);
    const seps = Array.from(container.querySelectorAll('[aria-hidden="true"]'));
    expect(seps.map((s) => s.textContent)).toEqual(["›", "›"]);
  });

  it("collapses the middle of a long path to '…', which expands it", () => {
    render(<Breadcrumb label="Element path" items={path(6)} maxItems={4} />);
    expect(screen.getByRole("button", { name: "Crumb 0" })).toBeInTheDocument();
    expect(screen.queryByText("Crumb 1")).toBeNull();
    expect(screen.getByText("Crumb 5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Show 3 more/ }));
    expect(screen.getByRole("button", { name: "Crumb 1" })).toBeInTheDocument();
  });

  it("never truncates the current crumb", () => {
    render(<Breadcrumb label="Element path" items={path(2)} />);
    expect(screen.getByText("Crumb 1").className).not.toMatch(/truncate/);
  });
});
