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
import { FormFieldsSection, formFields } from "../FormFieldsSection";
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
    expect(rows.map((r) => r.textContent)).toEqual(["Name · Text · Required", "Email · Email", "Message · Long text"]);
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

  it("Label and Required write the field, one undo step each", () => {
    const composer = make();
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    fireEvent.click(screen.getAllByTestId("form-field-row")[1]);
    const label = screen.getByLabelText("Label");
    fireEvent.change(label, { target: { value: "Your email" } });
    act(() => { fireEvent.keyDown(label, { key: "Enter" }); });
    expect(composer.elements.getElement("email")?.getAttribute("placeholder")).toBe("Your email");
    composer.history.flushPending?.();
    act(() => { fireEvent.click(screen.getByRole("checkbox", { name: "Required" })); });
    expect(composer.elements.getElement("email")?.getAttribute("required")).toBe("");
    composer.history.flushPending?.();
    act(() => { composer.history.undo(); });
    expect(composer.elements.getElement("email")?.getAttribute("required")).toBeUndefined();
    expect(composer.elements.getElement("email")?.getAttribute("placeholder")).toBe("Your email");
  });

  it("+ Add field adds an input before the submit button", () => {
    const composer = make();
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    act(() => { fireEvent.click(screen.getByTestId("form-add-field")); });
    const kids = composer.elements.getElement("f")!.getChildren();
    expect(kids).toHaveLength(5);
    expect(kids[3].getTagName().toLowerCase()).toBe("input");
    expect(kids[4].getId()).toBe("go");
    expect(screen.getAllByTestId("form-field-row")).toHaveLength(4);
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
