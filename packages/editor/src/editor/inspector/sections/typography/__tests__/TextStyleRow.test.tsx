/**
 * Text style (owner answer 4): the Brand type styles are font-size tokens; the
 * row binds `font-size` to one, "Custom" unbinds to the size it stood for.
 * It heads Style › Typography on text types (2L9 page 04 moved the type
 * block, where it used to sit, to Content).
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TextStyleRow } from "../TextStyleRow";
import { TypographySection } from "../index";
import { TEXT_SECTIONS } from "@/editor/inspector/sections/registry/text";

afterEach(cleanup);

function mock(styles: Record<string, string> = {}) {
  const onChange = vi.fn();
  render(<TextStyleRow styles={styles} onChange={onChange} />);
  return { onChange };
}

describe("Text style (owner answer 4 — font-size bound to a Brand type-style token)", () => {
  const textStyle = () => screen.getByLabelText("Text style") as HTMLSelectElement;

  it("lists the Brand type styles by name, largest first", () => {
    mock();
    const names = Array.from(textStyle().options).map((o) => o.textContent);
    expect(names.slice(0, 4)).toEqual(["Custom", "Heading 1", "Heading 2", "Heading 3"]);
    expect(names).toContain("Body text");
  });

  it("picking a style binds font-size to the token's var()", () => {
    const { onChange } = mock();
    fireEvent.change(textStyle(), { target: { value: "font-size-2xl" } });
    expect(onChange).toHaveBeenCalledWith("font-size", "var(--buildrick-design-font-size-2xl)");
  });

  it("reads a bound font-size back as that style", () => {
    mock({ "font-size": "var(--buildrick-design-font-size-base)" });
    expect(textStyle().value).toBe("font-size-base");
  });

  it("an unbound size reads Custom; choosing Custom unbinds to the size it stood for", () => {
    const { onChange } = mock({ "font-size": "var(--buildrick-design-font-size-lg)" });
    document.documentElement.style.setProperty("--buildrick-design-font-size-lg", "18px");
    fireEvent.change(textStyle(), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith("font-size", "18px");
    cleanup();
    mock({ "font-size": "32px" });
    expect(textStyle().value).toBe("");
  });
});

describe("where it lives", () => {
  it("heads Typography's More settings when asked, and only then (2L9 161:8940)", () => {
    const { unmount } = render(<TypographySection styles={{}} onChange={vi.fn()} isOpen textStyle advancedExpanded onAdvancedToggle={vi.fn()} />);
    expect(screen.getByLabelText("Text style")).toBeInTheDocument();
    unmount();
    render(<TypographySection styles={{}} onChange={vi.fn()} isOpen />);
    expect(screen.queryByLabelText("Text style")).toBeNull();
  });

  it("the Typography entry asks for it on an element, the Text inside entry never does", () => {
    const ctx = { variant: "element", styles: {}, onChange: vi.fn(), selectedElement: { id: "e", type: "heading" } } as never;
    expect((TEXT_SECTIONS.typography.render(ctx) as { props: { textStyle?: boolean } }).props.textStyle).toBe(true);
    expect((TEXT_SECTIONS["text-inside"].render(ctx) as { props: { textStyle?: boolean } }).props.textStyle).toBeFalsy();
  });
});
