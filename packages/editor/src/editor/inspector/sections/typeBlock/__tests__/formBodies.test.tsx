/**
 * Type block — form field bodies (2L9 F02, board 15): the Field block, and the
 * Checkbox block (Q2: titled "Checkbox", never "Container") whose Name,
 * Checked by default and Required write the INNER <input> — the attribute a
 * submitted form actually reads — through the parent's lock gate, one Undo.
 *
 * @license BSD-3-Clause
 */

import { render as rtlRender, screen, fireEvent, cleanup } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { TypeBlockSection } from "../TypeBlockSection";
import { makeMockComposer, makeMockElement } from "@/editor/inspector/__tests__/harness";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import type { Composer } from "@/engine/Composer";

/* The Field block's Type change answers with a receipt toast (2L9 F30). */
const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: ToastProvider });

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

function renderBlock(composer: unknown, element: { id: string; type: string }, targetIds = [element.id]) {
  render(
    <TypeBlockSection
      element={element}
      targetIds={targetIds}
      composer={composer as never}
      styles={{}}
      onChange={() => {}}
      onBatchChange={() => {}}
      isOpen
      onToggle={() => {}}
    />,
  );
}

const blockText = () => document.getElementById("inspector-section-type")?.textContent ?? "";

function inOrder(text: string, parts: string[]) {
  let at = -1;
  for (const p of parts) {
    const i = text.indexOf(p, at + 1);
    expect(i, `"${p}" after position ${at}`).toBeGreaterThan(at);
    at = i;
  }
}

describe("Input (board 14)", () => {
  function mock(attrs: Record<string, string> = {}) {
    const el = makeMockElement({ id: "e1", type: "input", attrs });
    const composer = makeMockComposer({ element: el });
    renderBlock(composer, { id: "e1", type: "input" });
    return { el, composer };
  }

  it("2L9 F02: the Field block — Type, Label, Placeholder, Name + its note, Required, Default value", () => {
    mock();
    expect(document.querySelector("#inspector-section-type")?.textContent).toMatch(/^Field/);
    inOrder(blockText(), ["Type", "Label", "Placeholder", "Name", "Name is the key stored with each submission.", "Required", "Default value"]);
    for (const l of ["Label", "Placeholder", "Name", "Default value"]) expect(screen.getByLabelText(l)).toBeInTheDocument();
    /* Type opens the "Field type" card (2L9 170:121692). */
    expect(screen.getByTestId("form-field-type")).toHaveTextContent("Text");
    /* Disabled is an Advanced attribute now (no board draws it here). */
    expect(screen.queryByRole("checkbox", { name: "Disabled" })).toBeNull();
  });

  it("Required is a box with its label beside it, and writes the field", () => {
    const { el } = mock({ required: "" });
    expect(screen.getByRole("checkbox", { name: "Required" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Required" }));
    expect(el.removeAttribute).toHaveBeenCalledWith("required");
  });

  it("the type writes the type attribute in one transaction", () => {
    const { el, composer } = mock();
    fireEvent.click(screen.getByTestId("form-field-type"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Email" }));
    expect(el.setAttribute).toHaveBeenCalledWith("type", "email");
    expect(composer.beginTransaction).toHaveBeenCalledWith("field-type");
  });

  it("Select keeps its options rows (no board — by analogy)", () => {
    const el = makeMockElement({ id: "e1", type: "select" });
    renderBlock(makeMockComposer({ element: el }), { id: "e1", type: "select" });
    const area = screen.getByLabelText("Options (one per line)") as HTMLTextAreaElement;
    fireEvent.change(area, { target: { value: "Red\nBlue" } });
    expect(el.setContent).toHaveBeenCalledWith("<option>Red</option><option>Blue</option>");
  });
});

describe("Checkbox (board 15)", () => {
  function project(locked = false) {
    const c: Composer = createTestComposer();
    const root = c.elements.createPage("Home").root.id;
    c.importProject({
      pages: [{
        id: "p", name: "Home", slug: "", isHome: true,
        root: { id: root, type: "container", tagName: "div", children: [
          { id: "cb", type: "checkbox", tagName: "label", locked, children: [
            { id: "cb-in", type: "input", tagName: "input", attributes: { type: "checkbox", name: "updates" }, children: [] },
            { id: "cb-t", type: "text", tagName: "span", content: "Send me updates", children: [] },
          ] },
        ] },
      }],
    } as never);
    c.history.flushPending();
    return c;
  }
  const inner = (c: Composer) => c.elements.getElement("cb-in")!;

  it("is titled Checkbox, and reads Edit text on canvas, Name, Checked by default, Required", () => {
    const c = project();
    renderBlock(c, { id: "cb", type: "checkbox" });
    expect(screen.getByRole("button", { name: /^Checkbox section/ })).toBeInTheDocument();
    expect(screen.queryByText("Container")).toBeNull();
    inOrder(blockText(), ["Edit text on canvas", "Name", "Checked by default", "Required"]);
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("updates");
  });

  it("Edit text on canvas edits the text beside the box, not the label wrapping both", () => {
    const c = project();
    const seen: string[] = [];
    c.on("ui:inline-edit-request" as never, ((p: { elementId: string }) => seen.push(p.elementId)) as never);
    renderBlock(c, { id: "cb", type: "checkbox" });
    fireEvent.click(screen.getByRole("button", { name: "Edit text on canvas" }));
    expect(seen).toEqual(["cb-t"]);
  });

  it("writes the inner <input>, not the label — and one Undo restores it", () => {
    const c = project();
    renderBlock(c, { id: "cb", type: "checkbox" });
    fireEvent.click(screen.getByRole("checkbox", { name: "Checked by default" }));
    expect(inner(c).getAttribute("checked")).toBe("true");
    expect(c.elements.getElement("cb")!.getAttribute("checked")).toBeUndefined();
    expect(screen.getByRole("checkbox", { name: "Checked by default" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Required" }));
    expect(inner(c).getAttribute("required")).toBe("true");
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "newsletter" } });
    expect(inner(c).getAttribute("name")).toBe("newsletter");
    c.history.flushPending();
    c.history.undo();
    expect(inner(c).getAttribute("name")).toBe("updates");
  });

  it("a locked checkbox refuses — its lock covers the input it owns", () => {
    const c = project(true);
    renderBlock(c, { id: "cb", type: "checkbox" });
    fireEvent.click(screen.getByRole("checkbox", { name: "Required" }));
    expect(inner(c).getAttribute("required")).toBeUndefined();
  });
});
