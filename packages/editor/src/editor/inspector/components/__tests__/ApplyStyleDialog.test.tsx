/**
 * ApplyStyleDialog — board 31 (DD-6b): the title names the count, the kind
 * and the page; Copies / Keeps / Skipped (locked + inside a component); the
 * Brand hint; Cancel / Apply to N; one transaction; the toast's Undo reverts
 * every peer at once.
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
import { ApplyStyleDialog } from "../ApplyStyleDialog";

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
      <ApplyStyleDialog composer={c} elementId={source.getId()} breakpoint="desktop" pseudo="normal" onClose={onClose} />
    </ToastProvider>,
  );
  return onClose;
}

beforeEach(() => {
  c = createTestComposer();
  root = c.elements.createPage("Home").root.id;
});

describe("ApplyStyleDialog (board 31)", () => {
  it("title, Copies / Keeps / Skipped rows, the Brand hint and Apply to N, in the board's order", () => {
    const src = h3();
    h3();
    h3();
    h3().setLocked(true);
    open(src);
    const dialog = screen.getByTestId("inspector-apply-style-dialog");
    expect(screen.getByText("Apply this style to 2 H3 headings on Home?")).toBeTruthy();
    const text = dialog.textContent ?? "";
    const order = [
      "Copies",
      "Typography, fill, border and effects",
      "Keeps",
      "Text, links, CMS bindings and layout",
      "Skipped",
      "1 locked heading",
      "For reuse across pages, save this as a text style in Brand.",
      "Cancel",
      "Apply to 2",
    ].map((s) => text.indexOf(s));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("Skipped counts locked peers and peers inside a component instance; no Skipped row when none are", () => {
    const src = h3();
    h3().setLocked(true);
    h3().setLocked(true);
    const box = add("container");
    vi.spyOn(box, "isComponentInstance").mockReturnValue(true);
    h3(box.getId());
    open(src);
    expect(screen.getByText("2 locked headings · 1 inside a component")).toBeTruthy();
  });

  it("no Skipped row when nothing is skipped; one peer reads singular", () => {
    const src = h3();
    h3();
    open(src);
    expect(screen.getByText("Apply this style to 1 H3 heading on Home?")).toBeTruthy();
    expect(screen.queryByText("Skipped")).toBeNull();
    expect(screen.getByText("Apply to 1")).toBeTruthy();
  });

  it("Apply writes every peer in one transaction; the toast names them and its Undo reverts all at once", () => {
    const src = h3();
    const a = h3();
    const b = h3();
    src.setStyle("color", "#123456");
    src.setStyle("font-size", "32px");
    c.history.flushPending();
    const onClose = open(src);
    fireEvent.click(screen.getByTestId("inspector-apply-style-dialog-confirm"));
    expect(onClose).toHaveBeenCalled();
    for (const el of [a, b]) {
      const live = c.elements.getElement(el.getId())!;
      expect(live.getStyles().color).toBe("#123456");
      expect(live.getStyles()["font-size"]).toBe("32px");
    }
    expect(screen.getByText("Applied to 2 H3 headings")).toBeTruthy();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    });
    for (const el of [a, b]) expect(c.elements.getElement(el.getId())!.getStyles().color).toBeUndefined();
    expect(c.elements.getElement(src.getId())!.getStyles().color).toBe("#123456");
  });

  it("Cancel closes and writes nothing", () => {
    const src = h3();
    const a = h3();
    src.setStyle("color", "#123456");
    const onClose = open(src);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
    expect(c.elements.getElement(a.getId())!.getStyles().color).toBeUndefined();
  });

  it("the Brand text-style hint is for text types only", () => {
    const src = add("button");
    add("button");
    open(src);
    expect(screen.getByText("Apply this style to 1 button on Home?")).toBeTruthy();
    expect(screen.queryByText(/save this as a text style in Brand/)).toBeNull();
  });
});
