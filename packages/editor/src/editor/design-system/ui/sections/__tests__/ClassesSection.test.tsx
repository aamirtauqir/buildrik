/**
 * ClassesSection — Brand › Classes, board 7316:83357 (C1 (ii)).
 *
 * @license BSD-3-Clause
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { ClassesSection } from "../ClassesSection";

const composerWith = (classLists: string[][]) =>
  ({
    on: vi.fn(),
    off: vi.fn(),
    elements: { getAllElements: () => classLists.map((c) => ({ getClasses: () => c })) },
  }) as never;

describe("Brand › Classes", () => {
  it("one card, a row per class, most-used first, `.name` over `used N×`", () => {
    render(<ClassesSection composer={composerWith([["card"], ["card", "btn-primary"], ["card"]])} />);
    const rows = [...screen.getByTestId("brand-classes").children];
    expect(rows.map((r) => r.getAttribute("data-testid"))).toEqual(["brand-class-card", "brand-class-btn-primary"]);
    expect(screen.getByTestId("brand-class-name-card").textContent).toBe(".card");
    expect(screen.getByTestId("brand-class-usage-card").textContent).toBe("used 3×");
  });

  it("does not list the engine's own buildrick- classes", () => {
    render(<ClassesSection composer={composerWith([["buildrick-page-root"], ["card"]])} />);
    expect(screen.queryByTestId("brand-class-buildrick-page-root")).toBeNull();
    expect(screen.getByTestId("brand-class-card")).toBeTruthy();
  });

  it("says how to add one when the site has none", () => {
    render(<ClassesSection composer={composerWith([["buildrick-page-root"]])} />);
    expect(screen.getByText(/No classes yet/)).toBeTruthy();
    expect(screen.queryByTestId("brand-classes")).toBeNull();
  });
});
