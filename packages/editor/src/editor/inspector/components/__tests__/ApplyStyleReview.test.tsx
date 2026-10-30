/**
 * ApplyStyleReview — 2L9 255:87335 (S11) / S12: the review names the page,
 * layer and the real counts (eligible, locked, inside a component), offers
 * the categories the source sets, applies exactly the chosen ones in one
 * transaction, and the toast's Undo reverts every peer at once.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import * as React from "react";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { ToastProvider } from "@/editor/chrome-ui";
import { ApplyStyleReview } from "../ApplyStyleReview";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let c: Composer;
let root: string;
const add = (type: string, props: Record<string, unknown> = {}, parent = root): Element => {
  const el = c.elements.createElement(type as never, props as never);
  c.elements.addElement(el, parent);
  return c.elements.getElement(el.getId())!;
};
const h3 = (parent = root) => {
  const el = add("heading", {}, parent);
  el.setTagName("h3");
  return el;
};

function open(source: Element, onClose = vi.fn()) {
  render(
    <ToastProvider>
      <ApplyStyleReview composer={c} elementId={source.getId()} breakpoint="desktop" pseudo="normal" onClose={onClose} />
    </ToastProvider>,
  );
  return onClose;
}

beforeEach(() => {
  c = createTestComposer();
  root = c.elements.createPage("Home").root.id;
});

describe("ApplyStyleReview (S11)", () => {
  it("names page and layer, counts eligible and locked from the page, offers the source's categories", () => {
    const src = h3();
    src.setStyle("font-size", "32px");
    src.setStyle("background-color", "rgb(0, 0, 255)");
    h3();
    h3();
    h3().setLocked(true);
    open(src);
    expect(screen.getByText("Apply style to headings")).toBeTruthy();
    expect(screen.getByText("On Home · Desktop · Default state")).toBeTruthy();
    expect(screen.getByTestId("inspector-apply-style-counts")).toHaveTextContent("2 eligible headings · 1 locked heading skipped");
    expect(screen.getByRole("checkbox", { name: "Typography" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Fill" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Fill" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "Spacing" })).toBeDisabled();
    expect(screen.getByText(/^Typography overrides on the 2 eligible headings will be replaced\./)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apply Typography to 2" })).toBeTruthy();
  });

  it("applies only the chosen categories in one step; Undo reverts every peer", () => {
    const src = h3();
    src.setStyle("font-size", "32px");
    src.setStyle("background-color", "rgb(0, 0, 255)");
    const a = h3();
    const b = h3();
    c.history.flushPending();
    const onClose = open(src);
    fireEvent.click(screen.getByRole("button", { name: "Apply Typography to 2" }));
    expect(onClose).toHaveBeenCalled();
    for (const p of [a, b]) {
      expect(c.elements.getElement(p.getId())!.getStyles()["font-size"]).toBe("32px");
      expect(c.elements.getElement(p.getId())!.getStyles()["background-color"]).toBeUndefined();
    }
    c.history.flushPending();
    act(() => screen.getByRole("button", { name: "Undo" }).click());
    for (const p of [a, b]) expect(c.elements.getElement(p.getId())!.getStyles()["font-size"]).toBeUndefined();
  });

  it("two categories read in the label; none chosen disables Apply", () => {
    const src = h3();
    src.setStyle("font-size", "32px");
    src.setStyle("background-color", "rgb(0, 0, 255)");
    h3();
    open(src);
    fireEvent.click(screen.getByRole("checkbox", { name: "Fill" }));
    expect(screen.getByRole("button", { name: "Apply Typography and Fill to 1" })).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Typography" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Fill" }));
    expect(screen.getByRole("button", { name: "Apply style to 1" })).toBeDisabled();
  });
});
