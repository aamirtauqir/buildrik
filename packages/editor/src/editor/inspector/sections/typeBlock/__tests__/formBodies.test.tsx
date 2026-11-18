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

  it("2L9 F04: a label change answers '{old label} label changed · All breakpoints' with Undo", () => {
    const c = createTestComposer();
    c.importProject({
      pages: [{ id: "p", name: "Home", slug: "", isHome: true, root: { id: "root", type: "container", tagName: "div", children: [
        { id: "f", type: "form", tagName: "form", children: [
          { id: "lb", type: "text", tagName: "label", attributes: { for: "em" }, content: "Email", children: [] },
          { id: "em", type: "input", tagName: "input", attributes: { id: "em", type: "email", name: "email" }, children: [] },
        ] },
      ] } }],
    } as never);
    renderBlock(c, { id: "em", type: "input" });
    const label = screen.getByLabelText("Label");
    fireEvent.change(label, { target: { value: "Work email" } });
    fireEvent.blur(label);
    expect(screen.getByText("Email label changed · All breakpoints")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("2L9 F08: a legacy Password field warns, not dismissibly, and Change type opens the type card; Password is not offered to others", () => {
    mock({ type: "password" });
    expect(screen.getByTestId("form-field-password-warning")).toHaveTextContent("Existing Password field");
    expect(screen.getByTestId("form-field-password-warning")).toHaveTextContent("Password values are stored and emailed as plain text");
    fireEvent.click(screen.getByRole("button", { name: "Change type ›" }));
    expect(screen.getByRole("menuitem", { name: "Password" })).toBeInTheDocument();
    cleanup();
    mock({ type: "text" });
    fireEvent.click(screen.getByTestId("form-field-type"));
    expect(screen.queryByRole("menuitem", { name: "Password" })).toBeNull();
    expect(screen.queryByTestId("form-field-password-warning")).toBeNull();
  });

  it("2L9 F09: no label — what a screen reader will say, and Add label focuses the Label field", () => {
    mock({ placeholder: "you@example.com" });
    expect(screen.getByTestId("form-field-no-label")).toHaveTextContent("No label — screen readers will announce the placeholder");
    fireEvent.click(screen.getByRole("button", { name: "Add label" }));
    expect(screen.getByLabelText("Label")).toHaveFocus();
  });

  it("Select keeps its options rows (no board — by analogy)", () => {
    const el = makeMockElement({ id: "e1", type: "select" });
    renderBlock(makeMockComposer({ element: el }), { id: "e1", type: "select" });
    const area = screen.getByLabelText("Options (one per line)") as HTMLTextAreaElement;
    fireEvent.change(area, { target: { value: "Red\nBlue" } });
    expect(el.setContent).toHaveBeenCalledWith("<option>Red</option><option>Blue</option>");
  });
});

describe("Select → Text (BD-29, 2L9 F31–F35)", () => {
  function project() {
    const c: Composer = createTestComposer();
    const root = c.elements.createPage("Home").root.id;
    c.importProject({
      pages: [{
        id: "p", name: "Home", slug: "", isHome: true,
        root: { id: root, type: "container", tagName: "div", children: [
          { id: "f", type: "form", tagName: "form", children: [
            { id: "lb", type: "label", tagName: "label", content: "Topic", children: [] },
            { id: "sel", type: "select", tagName: "select", attributes: { name: "topic", required: "" }, styles: { width: "100%" },
              content: "<option>Design</option><option selected>Research</option><option>Studio</option>", children: [] },
          ] },
        ] },
      }],
    } as never);
    c.history.flushPending();
    return c;
  }

  it("F31: the select shows its options and default; F33–F35: Text converts after the confirm, in place, in one Undo", () => {
    const c = project();
    renderBlock(c, { id: "sel", type: "select" });
    expect(screen.getByTestId("form-field-options")).toHaveTextContent("3 options");
    expect(screen.getByText("Research · Default")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("form-field-type"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Text" }));
    expect(screen.getByText("Change Topic to Text?")).toBeInTheDocument();
    expect(screen.getByText("The 3 options—Design, Research and Studio—will be removed. The current default “Research” stays as text.")).toBeInTheDocument();
    /* Cancel is the default and changes nothing. */
    fireEvent.click(screen.getByTestId("form-field-convert-cancel"));
    expect(c.elements.getElement("sel")!.getType()).toBe("select");
    fireEvent.click(screen.getByTestId("form-field-type"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Text" }));
    const before = c.history.getUndoCount();
    fireEvent.click(screen.getByTestId("form-field-convert-confirm"));
    c.history.flushPending();
    const now = c.elements.getElement("sel")!;
    expect(now.getType()).toBe("input");
    expect(now.getAttribute("type")).toBe("text");
    expect(now.getAttribute("value")).toBe("Research");
    expect(now.getAttribute("name")).toBe("topic");
    expect(now.getStyles().width).toBe("100%");
    expect(c.history.getUndoCount()).toBe(before + 1);
    expect(screen.getByText("Topic changed to Text")).toBeInTheDocument();
    c.history.undo();
    const back = c.elements.getElement("sel")!;
    expect(back.getType()).toBe("select");
    expect(back.getContent()).toMatch(/^<option>Design<\/option><option selected[^>]*>Research<\/option><option>Studio<\/option>$/);
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
