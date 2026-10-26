/**
 * Boards 4428:141878 (Form › FIELDS) and 4428:142450 (Slider › SLIDES), on the
 * real Composer: rows mirror the children; the type select, "+ Add field",
 * "+ Add slide" and the slide ⋯ edit the tree.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "@/engine/Composer";
import { FormFieldsSection } from "../FormFieldsSection";
import { formFields } from "../formFieldModel";
import { SlidesSection } from "../SlidesSection";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function project(children: unknown[]) {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{ id: "p", name: "Home", slug: "", isHome: true,
      root: { id: "root", type: "container", tagName: "div", children } }],
  } as never);
  return composer;
}

const input = (id: string, type: string, placeholder: string, extra: Record<string, string> = {}) =>
  ({ id, type: "input", tagName: "input", attributes: { type, placeholder, name: id, ...extra }, children: [] });

describe("Form › FIELDS", () => {
  const make = () =>
    project([{ id: "f", type: "form", tagName: "form", children: [
      input("name", "text", "Name", { required: "" }), input("email", "email", "Email"),
      { id: "msg", type: "textarea", tagName: "textarea", attributes: { placeholder: "Message", name: "msg" }, children: [] },
      { id: "go", type: "button", tagName: "button", content: "Send", attributes: { type: "submit" }, children: [] },
    ] }]);

  it("one row per field, 'Label · Type · Required' (board 19); the submit button is not a field", () => {
    render(<FormFieldsSection elementId="f" composer={make()} isOpen />);
    const rows = screen.getAllByTestId("form-field-row");
    expect(rows.map((r) => r.textContent)).toEqual(["Name · Text · Required", "Email · Email", "Message · Textarea"]);
    expect(screen.getByText("Fields")).toBeInTheDocument();
  });

  it("opening a row drills in; the Type select rewrites the input, and swaps it for a textarea", () => {
    const composer = make();
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    fireEvent.click(screen.getAllByTestId("form-field-row")[0]);
    act(() => { fireEvent.change(screen.getByRole("combobox", { name: "Type" }), { target: { value: "tel" } }); });
    expect(composer.elements.getElement("name")?.getAttribute("type")).toBe("tel");
    fireEvent.click(screen.getByTestId("form-field-back"));
    fireEvent.click(screen.getAllByTestId("form-field-row")[1]);
    act(() => { fireEvent.change(screen.getByRole("combobox", { name: "Type" }), { target: { value: "textarea" } }); });
    const fields = formFields(composer.elements.getElement("f")!);
    expect(fields.map((el) => el.getTagName().toLowerCase())).toEqual(["input", "textarea", "textarea"]);
    expect(fields[1].getAttribute("placeholder")).toBe("Email");
    /* the editor follows the swapped field */
    expect(screen.getByRole("combobox", { name: "Type" })).toHaveValue("textarea");
  });

  const commit = (label: string, value: string) => {
    const field = screen.getByLabelText(label);
    fireEvent.change(field, { target: { value } });
    act(() => { fireEvent.keyDown(field, { key: "Enter" }); });
  };

  it("2L9 156:1316 — the field's rows in board order", () => {
    render(<FormFieldsSection elementId="f" composer={make()} isOpen />);
    fireEvent.click(screen.getAllByTestId("form-field-row")[1]);
    const labels = Array.from(screen.getByTestId("form-field-editor").querySelectorAll(".bdi-lb, .bdi-sub-label, label")).map((l) => l.textContent?.trim());
    expect(labels.filter((t, i, all) => t && all.indexOf(t) === i)).toEqual([
      "Field", "Type", "Label", "Placeholder", "Name", "Required", "Default value", "Validation", "Min length", "Max length",
    ]);
    expect(screen.getByTestId("form-field-back")).toHaveTextContent("‹ Form");
    expect(screen.getByTestId("form-field-name-note")).toHaveTextContent("Name is the key stored with each submission.");
  });

  it("Label no longer writes the placeholder: without a <label> it is the accessible name; Placeholder is its own row", () => {
    const composer = make();
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    fireEvent.click(screen.getAllByTestId("form-field-row")[1]);
    commit("Label", "Your email");
    expect(composer.elements.getElement("email")?.getAttribute("aria-label")).toBe("Your email");
    expect(composer.elements.getElement("email")?.getAttribute("placeholder")).toBe("Email");
    commit("Placeholder", "you@example.com");
    expect(composer.elements.getElement("email")?.getAttribute("placeholder")).toBe("you@example.com");
  });

  it("Label edits the field's own <label> when the form has one (Contact form shape)", () => {
    const composer = project([{ id: "f", type: "form", tagName: "form", children: [
      { id: "w", type: "container", tagName: "div", children: [
        { id: "lab", type: "label", tagName: "label", content: "Email", children: [] },
        input("email", "email", "you@example.com"),
      ] },
    ] }]);
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    expect(screen.getAllByTestId("form-field-row")[0]).toHaveTextContent("Email · Email");
    fireEvent.click(screen.getAllByTestId("form-field-row")[0]);
    expect(screen.getByLabelText("Label")).toHaveValue("Email");
    commit("Label", "Work email");
    expect(composer.elements.getElement("lab")?.getContent()).toBe("Work email");
    expect(composer.elements.getElement("email")?.getAttribute("placeholder")).toBe("you@example.com");
  });

  it("Name: a key another field uses is refused with the board's message, the draft kept (156:1911)", () => {
    const composer = make();
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    fireEvent.click(screen.getAllByTestId("form-field-row")[1]);
    commit("Name", "name");
    expect(composer.elements.getElement("email")?.getAttribute("name")).toBe("email");
    expect(screen.getByTestId("form-field-name-error")).toHaveTextContent("“name” is already used. Choose a unique submission key.");
    expect(screen.getByLabelText("Name")).toHaveValue("name");
    commit("Name", "work_email");
    expect(composer.elements.getElement("email")?.getAttribute("name")).toBe("work_email");
    expect(screen.queryByTestId("form-field-name-error")).toBeNull();
  });

  it("Default value and Validation write the field's attributes", () => {
    const composer = make();
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    fireEvent.click(screen.getAllByTestId("form-field-row")[0]);
    commit("Default value", "Ada");
    commit("Max length", "80");
    expect(composer.elements.getElement("name")?.getAttribute("value")).toBe("Ada");
    expect(composer.elements.getElement("name")?.getAttribute("maxlength")).toBe("80");
  });

  it("Label and Required write the field, one undo step each", () => {
    const composer = make();
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    fireEvent.click(screen.getAllByTestId("form-field-row")[1]);
    commit("Label", "Your email");
    expect(composer.elements.getElement("email")?.getAttribute("aria-label")).toBe("Your email");
    composer.history.flushPending?.();
    act(() => { fireEvent.click(screen.getByRole("checkbox", { name: "Required" })); });
    expect(composer.elements.getElement("email")?.getAttribute("required")).toBe("");
    composer.history.flushPending?.();
    act(() => { composer.history.undo(); });
    expect(composer.elements.getElement("email")?.getAttribute("required")).toBeUndefined();
    expect(composer.elements.getElement("email")?.getAttribute("aria-label")).toBe("Your email");
  });

  it("2L9 156:3109 — + Add field lists the board's 13 types, in its order", () => {
    render(<FormFieldsSection elementId="f" composer={make()} isOpen />);
    fireEvent.click(screen.getByTestId("form-add-field"));
    const items = Array.from(screen.getByRole("group", { name: "Add field" }).children).map((b) => b.textContent);
    expect(items).toEqual(["Text", "Email", "Number", "Textarea", "Select", "Checkbox", "Radio", "Switch", "Slider", "Date", "Time", "Color", "Submit"]);
    fireEvent.click(screen.getByTestId("form-add-field-back"));
    expect(screen.getAllByTestId("form-field-row")).toHaveLength(3);
  });

  it("Text adds an input before the submit button, named and labelled as the board's new field, and opens it (156:3684)", () => {
    const composer = make();
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    fireEvent.click(screen.getByTestId("form-add-field"));
    act(() => { fireEvent.click(screen.getByTestId("form-add-field-input")); });
    const kids = composer.elements.getElement("f")!.getChildren();
    expect(kids).toHaveLength(5);
    expect(kids[3].getTagName().toLowerCase()).toBe("input");
    expect(kids[3].getAttribute("name")).toBe("field-4");
    expect(kids[3].getAttribute("placeholder")).toBe("Your answer");
    expect(kids[4].getId()).toBe("go");
    expect(screen.getByLabelText("Label")).toHaveValue("Field 4");
    fireEvent.click(screen.getByTestId("form-field-back"));
    expect(screen.getAllByTestId("form-field-row")).toHaveLength(4);
  });

  it.each([
    ["checkbox", "Checkbox"],
    ["range", "Slider"],
    ["select", "Select"],
    ["time", "Time"],
  ])("%s inserts the Insert panel's block as a field and lists it as %s", (blockId, label) => {
    const composer = make();
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    fireEvent.click(screen.getByTestId("form-add-field"));
    act(() => { fireEvent.click(screen.getByTestId(`form-add-field-${blockId}`)); });
    fireEvent.click(screen.getByTestId("form-field-back"));
    const rows = screen.getAllByTestId("form-field-row");
    expect(rows).toHaveLength(4);
    expect(rows[3].textContent).toContain(label);
    /* still before the submit button */
    const kids = composer.elements.getElement("f")!.getChildren();
    expect(kids[kids.length - 1].getId()).toBe("go");
  });
});

describe("Slider › SLIDES", () => {
  const slide = (id: string, title: string) =>
    ({ id, type: "container", tagName: "div", classes: ["buildrick-slide"], children: [
      { id: `${id}-h`, type: "heading", tagName: "h3", content: title, children: [] },
    ] });
  const make = () => project([{ id: "s", type: "slider", tagName: "div", children: [slide("a", "Hero dish"), slide("b", "Dining room")] }]);

  it("rows read 'Slide N · <heading>'", () => {
    render(<SlidesSection elementId="s" composer={make()} isOpen />);
    expect(screen.getAllByTestId("slide-row").map((r) => r.textContent)).toEqual(["⠿Slide 1 · Hero dish⋯", "⠿Slide 2 · Dining room⋯"]);
    expect(screen.getByText("Slides · 2")).toBeInTheDocument();
  });

  it("+ Add slide and ⋯ Delete edit the slider's children", () => {
    const composer = make();
    render(<SlidesSection elementId="s" composer={composer} isOpen />);
    act(() => { fireEvent.click(screen.getByRole("button", { name: "+ Add slide" })); });
    expect(composer.elements.getElement("s")!.getChildren()).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Slide 1 · Hero dish actions" }));
    act(() => { fireEvent.click(screen.getByRole("menuitem", { name: "Delete" })); });
    expect(composer.elements.getElement("a")).toBeUndefined();
    expect(screen.getAllByTestId("slide-row")).toHaveLength(2);
  });
});
