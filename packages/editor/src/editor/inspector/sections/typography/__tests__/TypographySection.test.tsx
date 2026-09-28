/**
 * Typography section (boards 1, 4, 17, 21): Font first, then the face; More
 * settings behind its toggle; the Page panel shows Font + Text colour only;
 * "Text inside" summarises as the board prints it — token names, never a raw
 * `var(--…)`.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TypographySection } from "../index";
import { colourTokenLabel, textSummary, TEXT_SECTIONS } from "../../registry/text";

const labels = (c: HTMLElement) => Array.from(c.querySelectorAll(".bdi-lb")).map((l) => l.textContent?.trim());

describe("Typography section", () => {
  it("board 1's rows: Font, Font size, Line height, Weight, Colour, Align", () => {
    const { container } = render(<TypographySection styles={{}} onChange={vi.fn()} isOpen onAdvancedToggle={vi.fn()} />);
    expect(labels(container)).toEqual(["Font", "Font size", "Line height", "Weight", "Colour", "Align"]);
    expect(screen.getByRole("button", { name: /More settings/ })).toBeInTheDocument();
  });

  it("More settings opens the rest", () => {
    const { container } = render(<TypographySection styles={{}} onChange={vi.fn()} isOpen advancedExpanded onAdvancedToggle={vi.fn()} />);
    expect(labels(container)).toEqual(expect.arrayContaining(["Transform", "Decoration", "Letter", "Word", "Style"]));
  });

  it("Page panel (board 21): Font and Text colour only, no More settings", () => {
    const { container } = render(<TypographySection styles={{}} onChange={vi.fn()} isOpen variant="page" onAdvancedToggle={vi.fn()} advancedExpanded />);
    expect(labels(container)).toEqual(["Font", "Text colour"]);
    expect(screen.queryByRole("button", { name: /More settings/ })).toBeNull();
  });

  it("the Font field reads the family, not its fallback stack", () => {
    render(<TypographySection styles={{ "font-family": "Inter, sans-serif" }} onChange={vi.fn()} isOpen />);
    expect(screen.getByRole("button", { name: "Font family" }).textContent).toBe("Inter");
  });

  it("picking a font writes font-family", () => {
    const onChange = vi.fn();
    render(<TypographySection styles={{}} onChange={onChange} isOpen />);
    fireEvent.click(screen.getByRole("button", { name: "Font family" }));
    fireEvent.click(screen.getByRole("option", { name: /Georgia/ }));
    expect(onChange).toHaveBeenCalledWith("font-family", "Georgia, serif");
  });
});

describe("Text inside summary (board 17)", () => {
  it("names a colour token the way the board does", () => {
    expect(colourTokenLabel("color-text-primary")).toBe("Text / primary");
    expect(colourTokenLabel("color-primary")).toBe("Primary");
  });

  it("reads 'Inter · 16px · Text / primary' — no raw var()", () => {
    document.documentElement.style.setProperty("--buildrick-design-font-size-base", "16px");
    const summary = textSummary({
      "font-family": "Inter, sans-serif",
      "font-size": "var(--buildrick-design-font-size-base)",
      color: "var(--buildrick-design-color-text-primary)",
    });
    expect(summary).toBe("Inter · 16px · Text / primary");
    expect(summary).not.toMatch(/var\(/);
  });

  it("plain values print as they are; nothing set, no summary", () => {
    expect(textSummary({ "font-family": "'Playfair Display', serif", "font-size": "18px", color: "#111827" })).toBe(
      "Playfair Display · 18px · #111827",
    );
    expect(textSummary({})).toBeNull();
  });

  it("a container with no type of its own summarises what its text renders as", () => {
    const node = document.createElement("div");
    node.setAttribute("data-buildrick-id", "grid-1");
    node.style.fontFamily = "Inter, sans-serif";
    node.style.fontSize = "16px";
    node.style.color = "rgb(17, 24, 39)";
    document.body.appendChild(node);
    const summary = TEXT_SECTIONS["text-inside"].summary!({ selectedElement: { id: "grid-1", type: "grid" }, styles: {} } as never);
    expect(summary).toBe("Inter · 16px · #111827");
    node.remove();
  });
});
