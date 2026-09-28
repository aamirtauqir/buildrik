/**
 * Type block — text family bodies (boards 1, 4, 5): Heading's Level
 * segmented (writes the tag, one Undo), the Text style row (binds font-size
 * to a Brand type-style token, owner answer 4), Edit text on canvas, and the
 * Button block (Type segmented, Disabled with its label beside the box).
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { TypeBlockSection } from "../TypeBlockSection";
import { makeMockComposer, makeMockElement } from "@/editor/inspector/__tests__/harness";
import type { MockElementOptions } from "@/editor/inspector/__tests__/harness";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import type { Composer } from "@/engine/Composer";

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
  it("Level is a segmented H1–H6, not a select; the current level is pressed", () => {
    mock("heading", { tagName: "h3" });
    const group = screen.getByTestId("inspector-field-level");
    expect(within(group).getAllByRole("button").map((b) => b.textContent)).toEqual(["H1", "H2", "H3", "H4", "H5", "H6"]);
    expect(within(group).getByRole("button", { name: "H3" })).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector("select option[value='h1']")).toBeNull();
  });

  it("rows in board order: Level, Text style, then Edit text on canvas", () => {
    mock("heading", { tagName: "h2" });
    expect(rowLabels()).toEqual(["Level", "Text style"]);
    expect(screen.getByRole("button", { name: "Edit text on canvas" })).toBeInTheDocument();
  });

  it("choosing a level writes the tag, and ONE Undo restores it", () => {
    const c: Composer = createTestComposer();
    const root = c.elements.createPage("Home").root.id;
    const h = c.elements.createElement("heading" as never, { tagName: "h2", content: "Hi" } as never);
    c.elements.addElement(h, root);
    c.history.flushPending();
    renderBlock(c, { id: h.getId(), type: "heading" });
    fireEvent.click(screen.getByRole("button", { name: "H4" }));
    expect(c.elements.getElement(h.getId())!.getTagName()).toBe("h4");
    expect(screen.getByRole("button", { name: "H4" })).toHaveAttribute("aria-pressed", "true");
    c.history.flushPending();
    c.history.undo();
    expect(c.elements.getElement(h.getId())!.getTagName()).toBe("h2");
  });

  it("a locked heading keeps its tag", () => {
    const c: Composer = createTestComposer();
    const root = c.elements.createPage("Home").root.id;
    const h = c.elements.createElement("heading" as never, { tagName: "h2" } as never);
    c.elements.addElement(h, root);
    c.elements.getElement(h.getId())!.setLocked(true);
    renderBlock(c, { id: h.getId(), type: "heading" });
    fireEvent.click(screen.getByRole("button", { name: "H5" }));
    expect(c.elements.getElement(h.getId())!.getTagName()).toBe("h2");
  });
});

describe("Text style (owner answer 4 — font-size bound to a Brand type-style token)", () => {
  const textStyle = () => screen.getByLabelText("Text style") as HTMLSelectElement;

  it("lists the Brand type styles by name, largest first", () => {
    mock("heading");
    const names = Array.from(textStyle().options).map((o) => o.textContent);
    expect(names.slice(0, 4)).toEqual(["Custom", "Heading 1", "Heading 2", "Heading 3"]);
    expect(names).toContain("Body text");
  });

  it("picking a style binds font-size to the token's var()", () => {
    const { onChange } = mock("text");
    fireEvent.change(textStyle(), { target: { value: "font-size-2xl" } });
    expect(onChange).toHaveBeenCalledWith("font-size", "var(--buildrick-design-font-size-2xl)");
  });

  it("reads a bound font-size back as that style", () => {
    mock("heading", {}, { "font-size": "var(--buildrick-design-font-size-base)" });
    expect(textStyle().value).toBe("font-size-base");
  });

  it("an unbound size reads Custom; choosing Custom unbinds to the size it stood for", () => {
    const { onChange } = mock("heading", {}, { "font-size": "var(--buildrick-design-font-size-lg)" });
    document.documentElement.style.setProperty("--buildrick-design-font-size-lg", "18px");
    fireEvent.change(textStyle(), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith("font-size", "18px");
    cleanup();
    mock("heading", {}, { "font-size": "32px" });
    expect(textStyle().value).toBe("");
  });
});

describe("Text (board 4) and the other text types", () => {
  it.each(["text", "paragraph", "link", "label"])("%s: Text style + Edit text on canvas, no Level", (type) => {
    mock(type);
    expect(rowLabels()).toEqual(["Text style"]);
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
    expect(within(group).getAllByRole("button").map((b) => b.textContent)).toEqual(["Button", "Submit", "Reset"]);
    expect(within(group).getByRole("button", { name: "Button" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(within(group).getByRole("button", { name: "Submit" }));
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
