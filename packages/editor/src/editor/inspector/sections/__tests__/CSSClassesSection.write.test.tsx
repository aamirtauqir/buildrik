/**
 * CSSClassesSection — add (Enter) + remove writes through the transaction
 * wrapper. List rendering + Tab-key + no-Tailwind are covered by
 * inspector/__tests__/CSSClassesSection.test.tsx.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CSSClassesSection } from "../CSSClassesSection";
import { makeMockElement, makeMockComposer } from "@/editor/inspector/__tests__/harness";

function setup(classes: string[] = []) {
  const el = makeMockElement({ id: "e1", type: "text", classes });
  const composer = makeMockComposer({ element: el });
  const utils = render(
    <CSSClassesSection
      selectedElement={{ id: "e1", type: "text" }}
      composer={composer as never}
      isOpen={true}
    />
  );
  return { el, composer, ...utils };
}

describe("CSSClassesSection — add", () => {
  it("Enter in the inline input adds the class in an add-class transaction", () => {
    const { el, composer } = setup();
    fireEvent.click(screen.getByRole("button", { name: /add class/i }));
    const input = screen.getByPlaceholderText("class-name");
    fireEvent.change(input, { target: { value: "hero" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(el.addClass).toHaveBeenCalledWith("hero");
    expect(composer.beginTransaction).toHaveBeenCalledWith("add-class");
    expect(composer.endTransaction).toHaveBeenCalled();
  });

  it("Enter with an empty value does not add", () => {
    const { el } = setup();
    fireEvent.click(screen.getByRole("button", { name: /add class/i }));
    const input = screen.getByPlaceholderText("class-name");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(el.addClass).not.toHaveBeenCalled();
  });

  it("Escape cancels the inline add without writing", () => {
    const { el } = setup();
    fireEvent.click(screen.getByRole("button", { name: /add class/i }));
    const input = screen.getByPlaceholderText("class-name");
    fireEvent.change(input, { target: { value: "hero" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(el.addClass).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText("class-name")).not.toBeInTheDocument();
  });
});

describe("CSSClassesSection — remove", () => {
  it("clicking a chip's × removes the class in a remove-class transaction", () => {
    const { el, composer } = setup(["font-bold"]);
    fireEvent.click(screen.getByRole("button", { name: "Remove class font-bold" }));
    expect(el.removeClass).toHaveBeenCalledWith("font-bold");
    expect(composer.beginTransaction).toHaveBeenCalledWith("remove-class");
    expect(composer.endTransaction).toHaveBeenCalled();
  });
});
