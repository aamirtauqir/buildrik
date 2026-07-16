/**
 * SectionTemplates — type pills, filtering, insert callback, empty state.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SectionTemplates, type SectionTemplate } from "../SectionTemplates";

afterEach(cleanup);

describe("SectionTemplates", () => {
  it("renders the 8 type pills and all 11 section cards on 'All'", () => {
    render(<SectionTemplates onInsert={vi.fn()} />);
    for (const label of ["All", "Nav", "Hero", "Features", "Pricing", "Quotes", "CTA", "Footer"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    // 11 canned sections: 2 nav, 2 hero, 2 features, 1 pricing, 1 testimonials, 2 cta, 1 footer
    expect(screen.getByText("Simple Nav")).toBeInTheDocument();
    expect(screen.getByText("Centered Nav")).toBeInTheDocument();
    expect(screen.getByText("Centered Hero")).toBeInTheDocument();
    expect(screen.getByText("Split Hero")).toBeInTheDocument();
    expect(screen.getByText("3-Column Features")).toBeInTheDocument();
    expect(screen.getByText("Feature Cards")).toBeInTheDocument();
    expect(screen.getByText("3-Tier Pricing")).toBeInTheDocument();
    expect(screen.getByText("Testimonial Cards")).toBeInTheDocument();
    expect(screen.getByText("Gradient CTA")).toBeInTheDocument();
    expect(screen.getByText("Simple CTA")).toBeInTheDocument();
    expect(screen.getByText("4-Column Footer")).toBeInTheDocument();
  });

  it("clicking a type pill filters the grid to that section type", () => {
    render(<SectionTemplates onInsert={vi.fn()} />);
    fireEvent.click(screen.getByText("Hero"));
    expect(screen.getByText("Centered Hero")).toBeInTheDocument();
    expect(screen.getByText("Split Hero")).toBeInTheDocument();
    expect(screen.queryByText("Simple Nav")).not.toBeInTheDocument();
    expect(screen.queryByText("Gradient CTA")).not.toBeInTheDocument();
  });

  it("clicking a card calls onInsert with the full SectionTemplate (id/type/html)", () => {
    const onInsert = vi.fn();
    render(<SectionTemplates onInsert={onInsert} />);
    fireEvent.click(screen.getByText("Gradient CTA"));

    expect(onInsert).toHaveBeenCalledTimes(1);
    const arg = onInsert.mock.calls[0][0] as SectionTemplate;
    expect(arg.id).toBe("cta-gradient");
    expect(arg.type).toBe("cta");
    expect(arg.html).toMatch(/^<section/);
    expect(typeof arg.description).toBe("string");
  });

  it("respects the filter prop as the initial active type", () => {
    render(<SectionTemplates onInsert={vi.fn()} filter="footer" />);
    expect(screen.getByText("4-Column Footer")).toBeInTheDocument();
    expect(screen.queryByText("Centered Hero")).not.toBeInTheDocument();
  });

  it("shows the empty state for a type with no canned sections ('content')", () => {
    render(<SectionTemplates onInsert={vi.fn()} filter="content" />);
    expect(screen.getByText("No sections found for this category")).toBeInTheDocument();
  });
});
