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

const addField = () => screen.getByLabelText("Add class") as HTMLInputElement;

describe("CSSClassesSection — add (board 2: Add class [Add a class…])", () => {
  it("Enter adds the class in an add-class transaction and clears the field", () => {
    const { el, composer } = setup();
    fireEvent.change(addField(), { target: { value: "hero" } });
    fireEvent.keyDown(addField(), { key: "Enter" });
    expect(el.addClass).toHaveBeenCalledWith("hero");
    expect(composer.beginTransaction).toHaveBeenCalledWith("add-class");
    expect(composer.endTransaction).toHaveBeenCalled();
    expect(addField()).toHaveValue("");
  });

  it("Enter with an empty value does not add", () => {
    const { el } = setup();
    fireEvent.keyDown(addField(), { key: "Enter" });
    expect(el.addClass).not.toHaveBeenCalled();
  });

  it("Escape cancels without writing", () => {
    const { el } = setup();
    fireEvent.change(addField(), { target: { value: "hero" } });
    fireEvent.keyDown(addField(), { key: "Escape" });
    expect(el.addClass).not.toHaveBeenCalled();
    expect(addField()).toHaveValue("");
  });

  it("several classes typed at once are added in ONE step, leading dots and duplicates dropped", () => {
    const { el, composer } = setup(["card"]);
    composer.beginTransaction.mockClear();
    fireEvent.change(addField(), { target: { value: "card, hero  .wide hero" } });
    fireEvent.keyDown(addField(), { key: "Enter" });
    expect(el.addClass.mock.calls.map((c: unknown[]) => c[0])).toEqual(["hero", "wide"]);
    expect(composer.beginTransaction).toHaveBeenCalledTimes(1);
  });

  it("pasting several classes adds them all at once (multi-class paste)", () => {
    const { el, composer } = setup();
    composer.beginTransaction.mockClear();
    fireEvent.paste(addField(), { clipboardData: { getData: () => "btn btn-primary\nwide" } });
    expect(el.addClass.mock.calls.map((c: unknown[]) => c[0])).toEqual(["btn", "btn-primary", "wide"]);
    expect(composer.beginTransaction).toHaveBeenCalledTimes(1);
  });

  it("pasting one class just fills the field", () => {
    const { el } = setup();
    fireEvent.paste(addField(), { clipboardData: { getData: () => "hero" } });
    expect(el.addClass).not.toHaveBeenCalled();
  });
});

describe("CSSClassesSection — remove", () => {
  it("a chip's ▾ › Remove class removes it in a remove-class transaction", () => {
    const { el, composer } = setup(["font-bold"]);
    fireEvent.click(screen.getByTestId("class-chip-font-bold"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Remove class" }));
    expect(el.removeClass).toHaveBeenCalledWith("font-bold");
    expect(composer.beginTransaction).toHaveBeenCalledWith("remove-class");
    expect(composer.endTransaction).toHaveBeenCalled();
  });
});
