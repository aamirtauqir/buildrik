/**
 * 2L9 R08 — after a family is picked, the Font row says what landed and
 * offers "Undo font assignment" (the pick made in Choose font, R02): ONE undo, bound to the step the engine
 * recorded for that write (history.captureUndo), never a guessed revert.
 *
 * @license BSD-3-Clause
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { FontPicker } from "../FontPicker";
import { ChooseFont, clearFontAssignment } from "../ChooseFont";
import { closeSubview, openSubview, useSubview } from "@/editor/inspector/tabs/subviewStore";
import { InspectorFieldContext } from "@/editor/inspector/shared/controls/InspectorFieldContext";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(() => {
  vi.restoreAllMocks();
  clearFontAssignment();
  openSubview(null);
});

let c: Composer;
let el: Element;

beforeEach(() => {
  c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const made = c.elements.createElement("heading" as never, {} as never);
  c.elements.addElement(made, root);
  el = c.elements.getElement(made.getId())!;
  el.setStyle("font-family", "Inter, sans-serif");
  c.history.flushPending();
});

/** The inspector's own wiring: a pick is a discrete step, flushed into history. */
function Harness() {
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    const fn = () => bump();
    c.on("element:updated", fn);
    c.on("history:undo", fn);
    return () => {
      c.off("element:updated", fn);
      c.off("history:undo", fn);
    };
  }, []);
  const current = c.elements.getElement(el.getId())?.getStyles()["font-family"] ?? "";
  const open = useSubview();
  return (
    <InspectorFieldContext.Provider
      value={{
        readOnly: false,
        readOnlyReason: null,
        mixedKeys: new Set(),
        overrides: new Map(),
        overrideLabels: {},
        resetOverride: vi.fn(),
        runDiscrete: (action) => {
          c.history.flushPending();
          action();
          c.history.flushPending();
        },
      }}
    >
      <FontPicker value={current} composer={c} elementId={el.getId()} />
      {open?.kind === "font-picker" ? (
        <ChooseFont
          composer={c}
          elementId={el.getId()}
          value={current}
          onChange={(v) => {
            c.elements.getElement(el.getId())?.setStyle("font-family", v);
            bump();
          }}
          onClose={() => closeSubview("font-picker")}
        />
      ) : null}
    </InspectorFieldContext.Provider>
  );
}

/* The row opens Choose font (R02); a family is picked from its rows. */
const pick = (name: string) => {
  fireEvent.click(screen.getByRole("button", { name: "Font family" }));
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${name} · `) }));
};

describe("FontPicker — Undo font assignment (2L9 R08)", () => {
  it("names what the pick replaced and undoes exactly that step", () => {
    render(<Harness />);
    pick("Georgia");
    expect(c.elements.getElement(el.getId())?.getStyles()["font-family"]).toBe("Georgia, serif");
    expect(screen.getByTestId("font-assignment")).toHaveTextContent("Undo restores the previous Inter stack.");

    fireEvent.click(screen.getByTestId("font-assignment-undo"));
    expect(c.elements.getElement(el.getId())?.getStyles()["font-family"]).toBe("Inter, sans-serif");
    expect(screen.queryByTestId("font-assignment")).toBeNull();
  });

  it("re-picking the family already set records nothing and offers no Undo", () => {
    render(<Harness />);
    pick("Georgia");
    const steps = c.history.getUndoCount();
    pick("Georgia");
    expect(c.history.getUndoCount()).toBe(steps);
  });

  it("an uploaded family says so, and Undo keeps the uploaded font", () => {
    const faces = [{ family: '"Studio Sans"', status: "loaded" }];
    vi.spyOn(document, "fonts", "get").mockReturnValue({
      forEach: (fn: (f: { family: string; status: string }) => void) => faces.forEach(fn),
      load: () => Promise.resolve([]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as never);
    vi.spyOn(c.fonts, "getAllFonts").mockReturnValue([
      { id: "library-studio", family: "Studio Sans", source: "custom", variants: [], loaded: true },
    ] as never);
    render(<Harness />);
    pick("Studio Sans");
    const note = screen.getByTestId("font-assignment");
    expect(screen.getByTestId("font-assignment-status")).toHaveTextContent("Studio Sans loaded · uploaded source ready.");
    expect(note).toHaveTextContent("Undo restores the previous Inter stack without deleting the uploaded font.");
  });

  it("a newer pick replaces the note, naming the family it replaced", () => {
    render(<Harness />);
    pick("Georgia");
    pick("Arial");
    expect(screen.getByTestId("font-assignment")).toHaveTextContent("previous Georgia stack");
  });
});
