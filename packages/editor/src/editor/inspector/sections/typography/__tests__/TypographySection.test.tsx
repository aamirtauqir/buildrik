/**
 * Typography section (boards 1, 4, 17, 21): Font first, then the face; More
 * settings behind its toggle; the Page panel shows Font + Text colour only;
 * "Text inside" summarises as the board prints it — token names, never a raw
 * `var(--…)`.
 *
 * @license BSD-3-Clause
 */

import { act, render, screen, fireEvent } from "@testing-library/react";
import { openSubview, useSubview } from "@/editor/inspector/tabs/subviewStore";
import { describe, it, expect, vi } from "vitest";
import { TypographySection } from "../index";
import { textSummary, TEXT_SECTIONS } from "@/editor/inspector/sections/registry/text";
import { colourTokenLabel } from "@/editor/inspector/shared/controls/ColorInput";

const labels = (c: HTMLElement) => Array.from(c.querySelectorAll(".bdi-lb")).map((l) => l.textContent?.trim());

describe("Typography section", () => {
  it("board 1's rows: Font, Font size, Line height, Weight, Colour, Align", () => {
    const { container } = render(<TypographySection styles={{}} onChange={vi.fn()} isOpen onAdvancedToggle={vi.fn()} />);
    expect(labels(container)).toEqual(["Font", "Font size", "Weight", "Line height", "Text color"]);
    expect(screen.getByRole("button", { name: /More settings/ })).toBeInTheDocument();
  });

  it("More settings opens the rest", () => {
    const { container } = render(<TypographySection styles={{}} onChange={vi.fn()} isOpen advancedExpanded onAdvancedToggle={vi.fn()} />);
    expect(labels(container)).toEqual(expect.arrayContaining(["Transform", "Decoration", "Letter spacing", "Word spacing", "Font style"]));
  });

  it("Text inside (247:23404): every row on the face, no More settings, the inheritance note", () => {
    const { container } = render(<TypographySection styles={{}} onChange={vi.fn()} isOpen inside onAdvancedToggle={vi.fn()} />);
    expect(labels(container)).toEqual(expect.arrayContaining(["Font", "Letter spacing", "Vertical align"]));
    expect(screen.queryByRole("button", { name: /More settings/ })).toBeNull();
    expect(screen.getByText("Inherited by descendants where applicable. Existing child overrides remain.")).toBeInTheDocument();
  });

  it("Page panel (board 21): Font and Text colour only, no More settings", () => {
    const { container } = render(<TypographySection styles={{}} onChange={vi.fn()} isOpen variant="page" onAdvancedToggle={vi.fn()} advancedExpanded />);
    expect(labels(container)).toEqual(["Font", "Text color"]);
    expect(screen.queryByRole("button", { name: /More settings/ })).toBeNull();
  });

  it("the Font field reads the family and its source, not its fallback stack", () => {
    render(<TypographySection styles={{ "font-family": "Inter, sans-serif" }} onChange={vi.fn()} isOpen />);
    /* 2L9 R01: the family, then where it comes from; the written stack below. */
    expect(screen.getByRole("button", { name: "Font family" }).textContent).toBe("Inter · Google Fonts");
    expect(screen.getByTestId("font-applied-stack")).toHaveTextContent("Applied stack: Inter, sans-serif");
  });

  it("the Font row opens Choose font (R02) for the section's element", () => {
    function Open() {
      const sub = useSubview();
      return <span data-testid="subview">{sub ? `${sub.kind}:${sub.elementId}` : "none"}</span>;
    }
    render(
      <>
        <TypographySection styles={{}} onChange={vi.fn()} isOpen elementId="el-typo" />
        <Open />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Font family" }));
    expect(screen.getByTestId("subview")).toHaveTextContent("font-picker:el-typo");
    act(() => openSubview(null));
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
    // A colour no seed token holds (#111827 became "Strong text" in Brand Part 1b).
    node.style.color = "rgb(18, 52, 86)";
    document.body.appendChild(node);
    const summary = TEXT_SECTIONS["text-inside"].summary!({ selectedElement: { id: "grid-1", type: "grid" }, styles: {} } as never);
    expect(summary).toBe("Inter · 16px · #123456");
    node.remove();
  });

  it("a rendered colour that equals a Brand colour token is named by the token (the site's saved value wins)", () => {
    const node = document.createElement("div");
    node.setAttribute("data-buildrick-id", "grid-2");
    node.style.fontFamily = "Inter, sans-serif";
    node.style.fontSize = "16px";
    node.style.color = "rgb(51, 65, 85)";
    document.body.appendChild(node);
    const summarise = (designTokens: unknown[]) =>
      TEXT_SECTIONS["text-inside"].summary!({
        selectedElement: { id: "grid-2", type: "grid" },
        styles: {},
        composer: { getProjectSettings: () => ({ designTokens }) },
      } as never);
    expect(summarise([])).toBe("Inter · 16px · Text");
    node.style.color = "rgb(17, 24, 39)";
    expect(summarise([{ id: "color-text", name: "Text", value: "#111827", category: "colors", cssVar: "--buildrick-design-color-text", type: "color" }])).toBe(
      "Inter · 16px · Text",
    );
    node.remove();
  });
});
