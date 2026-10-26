/**
 * Type block — text family bodies (boards 1, 4, 5; Content tab, 2L9 page
 * 04): Edit text on canvas, and the Button block (Type segmented, Disabled with its label
 * beside the box). No Text style: that binding is Style › Typography's.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { TypeBlockSection } from "../TypeBlockSection";
import { makeMockComposer, makeMockElement } from "@/editor/inspector/__tests__/harness";
import type { MockElementOptions } from "@/editor/inspector/__tests__/harness";
import { installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

function renderBlock(composer: unknown, element: { id: string; type: string }, styles: Record<string, string> = {}, onChange = vi.fn()) {
  render(
    <TypeBlockSection
      element={element}
      targetIds={[element.id]}
      composer={composer as never}
      styles={styles}
      onChange={onChange}
      onBatchChange={() => {}}
      isOpen
      onToggle={() => {}}
    />,
  );
  return { onChange };
}

function mock(type: string, opts: Partial<MockElementOptions> = {}, styles: Record<string, string> = {}) {
  const el = makeMockElement({ id: "e1", type, ...opts });
  const composer = makeMockComposer({ element: el });
  return { el, composer, ...renderBlock(composer, { id: "e1", type }, styles) };
}

const rowLabels = () =>
  Array.from(document.querySelectorAll("#inspector-section-type .bdi-lb, #inspector-section-type label"))
    .map((l) => l.textContent?.trim())
    .filter((t, i, all) => t && all.indexOf(t) === i);

describe("Heading (board 1)", () => {
  it("only Edit text on canvas: the level is Content › Semantics' Tag (2L9 247:26594)", () => {
    mock("heading", { tagName: "h2" });
    expect(rowLabels()).toEqual([]);
    expect(screen.queryByTestId("inspector-field-level")).toBeNull();
    expect(screen.queryByLabelText("Text style")).toBeNull();
    expect(screen.getByRole("button", { name: "Edit text on canvas" })).toBeInTheDocument();
  });
});

describe("Text (board 4) and the other text types", () => {
  it.each(["text", "paragraph", "link", "label"])("%s: Edit text on canvas, no Level, no Text style", (type) => {
    mock(type);
    expect(rowLabels()).toEqual([]);
    expect(screen.getByRole("button", { name: "Edit text on canvas" })).toBeInTheDocument();
    expect(screen.queryByTestId("inspector-field-level")).toBeNull();
  });

  it.each(["heading", "text", "link", "button"])("%s has no content textarea, Open In, Rel or Title (R-DD-9)", (type) => {
    const { el } = mock(type);
    expect(el).toBeTruthy();
    expect(document.querySelector("textarea")).toBeNull();
    for (const label of [/open in/i, /^rel$/i, /^title$/i]) expect(screen.queryByText(label)).toBeNull();
  });

  it("Edit text on canvas starts the canvas's own inline edit", () => {
    const { composer } = mock("text");
    fireEvent.click(screen.getByRole("button", { name: "Edit text on canvas" }));
    expect(composer.emit).toHaveBeenCalledWith("ui:inline-edit-request", { elementId: "e1" });
  });
});

describe("Button (board 5)", () => {
  it("Edit text on canvas, Type, Disabled — in that order, no Text style", () => {
    mock("button");
    const block = document.getElementById("inspector-section-type")!;
    const text = block.textContent ?? "";
    expect(text.indexOf("Edit text on canvas")).toBeLessThan(text.indexOf("Type"));
    expect(text.indexOf("Type")).toBeLessThan(text.indexOf("Disabled"));
    expect(screen.queryByLabelText("Text style")).toBeNull();
  });

  it("Type is a segmented Button / Submit / Reset that writes the type attribute", () => {
    const { el } = mock("button", { attrs: { type: "button" } });
    const group = screen.getByTestId("inspector-field-type");
    expect(within(group).getAllByRole("radio").map((b) => b.textContent)).toEqual(["Button", "Submit", "Reset"]);
    expect(within(group).getByRole("radio", { name: "Button" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(within(group).getByRole("radio", { name: "Submit" }));
    expect(el.setAttribute).toHaveBeenCalledWith("type", "submit");
  });

  it("Disabled: the box first, its label beside it, and the label is the box's name", () => {
    const { el } = mock("button");
    const box = screen.getByRole("checkbox", { name: "Disabled" });
    const row = box.closest("[data-testid='inspector-row-disabled']") as HTMLElement;
    expect(row.firstElementChild?.contains(box) || row.firstElementChild === box).toBe(true);
    expect(row.textContent?.trim()).toBe("Disabled");
    fireEvent.click(screen.getByText("Disabled"));
    expect(el.setAttribute).toHaveBeenCalledWith("disabled", "true");
  });
});
