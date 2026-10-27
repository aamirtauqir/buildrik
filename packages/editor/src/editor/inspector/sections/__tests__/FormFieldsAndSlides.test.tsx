/**
 * 2L9 Form › Fields (156:716) + the selected field's Field block (156:1316),
 * and board 4428:142450 (Slider › SLIDES), on the real Composer: rows mirror
 * the children; the Field rows, "+ Add field", "+ Add slide" and the ⋯
 * menus edit the tree.
 *
 * @license BSD-3-Clause
 */
import { render as rtlRender, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { describe, it, expect, beforeAll } from "vitest";
import { Composer } from "@/engine/Composer";
import { FormFieldsSection } from "../FormFieldsSection";
import { formFields } from "../formFieldModel";
import { SlidesSection } from "../SlidesSection";
import { TypeBlockSection } from "../typeBlock/TypeBlockSection";

/* The Field block's Type change answers with a receipt toast (2L9 F30). */
const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: ToastProvider });

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

describe("Form › FIELDS (2L9 156:716)", () => {
  const make = () =>
    project([{ id: "f", type: "form", tagName: "form", children: [
      input("name", "text", "Name", { required: "" }), input("email", "email", "Email"),
      { id: "msg", type: "textarea", tagName: "textarea", attributes: { placeholder: "Message", name: "msg" }, children: [] },
      { id: "go", type: "button", tagName: "button", content: "Send", attributes: { type: "submit" }, children: [] },
    ] }]);

  const rowTexts = () =>
    screen.getAllByTestId("form-field-row").map((r) => [
      r.querySelector("[data-testid=form-field-name]")?.textContent,
      r.querySelector("[data-testid=form-field-summary]")?.textContent,
    ]);

  it("two lines per field — name, then 'Type · Required' — and the submit button last", () => {
    render(<FormFieldsSection elementId="f" composer={make()} isOpen />);
    expect(rowTexts()).toEqual([
      ["Name", "Text · Required"],
      ["Email", "Email"],
      ["Message", "Textarea"],
      ["Send", "Submit button"],
    ]);
    expect(screen.getByTestId("form-add-field")).toHaveTextContent("+ Add field");
  });

  it("opening a field selects it (its own Content is the Field block — 156:1316)", () => {
    const composer = make();
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    fireEvent.click(screen.getAllByTestId("form-field-row")[1]);
    expect(composer.selection.getSelectedIds()).toEqual(["email"]);
  });

  const commit = (label: string, value: string) => {
    const field = screen.getByLabelText(label);
    fireEvent.change(field, { target: { value } });
    act(() => { fireEvent.keyDown(field, { key: "Enter" }); });
  };

  it("2L9 156:716 — a field's ⋯ moves it up / down and deletes it; the reorder note says so", () => {
    const composer = make();
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    expect(screen.getByTestId("form-fields-reorder-note")).toHaveTextContent("Drag to reorder, or use a field’s menu.");
    fireEvent.click(screen.getByRole("button", { name: "Name actions" }));
    expect(screen.getByRole("menuitem", { name: "Move up" })).toBeDisabled();
    act(() => { fireEvent.click(screen.getByRole("menuitem", { name: "Move down" })); });
    expect(formFields(composer.elements.getElement("f")!).map((el) => el.getId())).toEqual(["email", "name", "msg"]);
    fireEvent.click(screen.getByRole("button", { name: "Name actions" }));
    act(() => { fireEvent.click(screen.getByRole("menuitem", { name: "Move up" })); });
    expect(formFields(composer.elements.getElement("f")!).map((el) => el.getId())).toEqual(["name", "email", "msg"]);
    fireEvent.click(screen.getByRole("button", { name: "Message actions" }));
    expect(screen.getByRole("menuitem", { name: "Move down" })).toBeDisabled();
    act(() => { fireEvent.click(screen.getByRole("menuitem", { name: "Delete" })); });
    expect(composer.elements.getElement("msg")).toBeUndefined();
  });

  it("a field wrapped with its label moves and goes with the label (Contact form shape)", () => {
    const wrap = (id: string, label: string) => ({ id: `w-${id}`, type: "container", tagName: "div", children: [
      { id: `l-${id}`, type: "label", tagName: "label", content: label, children: [] },
      input(id, "text", ""),
    ] });
    const composer = project([{ id: "f", type: "form", tagName: "form", children: [wrap("a", "A"), wrap("b", "B")] }]);
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    fireEvent.click(screen.getByRole("button", { name: "A actions" }));
    act(() => { fireEvent.click(screen.getByRole("menuitem", { name: "Move down" })); });
    expect(composer.elements.getElement("f")!.getChildren().map((el) => el.getId())).toEqual(["w-b", "w-a"]);
    fireEvent.click(screen.getByRole("button", { name: "B actions" }));
    act(() => { fireEvent.click(screen.getByRole("menuitem", { name: "Delete" })); });
    expect(composer.elements.getElement("w-b")).toBeUndefined();
    expect(composer.elements.getElement("l-b")).toBeUndefined();
  });

  it("2L9 156:3109 — + Add field lists the board's 13 types, in its order", () => {
    render(<FormFieldsSection elementId="f" composer={make()} isOpen />);
    fireEvent.click(screen.getByTestId("form-add-field"));
    const items = Array.from(screen.getByRole("group", { name: "Add field" }).children).map((b) => b.textContent);
    expect(items).toEqual(["Text", "Email", "Number", "Textarea", "Select", "Checkbox", "Radio", "Switch", "Slider", "Date", "Time", "Color", "Submit"]);
    fireEvent.click(screen.getByTestId("form-add-field-back"));
    expect(screen.getAllByTestId("form-field-row")).toHaveLength(4);
  });

  it("Text adds an input before the submit button, named and labelled as the board's new field, and selects it (156:3684)", () => {
    const composer = make();
    render(<FormFieldsSection elementId="f" composer={composer} isOpen />);
    fireEvent.click(screen.getByTestId("form-add-field"));
    act(() => { fireEvent.click(screen.getByTestId("form-add-field-input")); });
    const kids = composer.elements.getElement("f")!.getChildren();
    expect(kids).toHaveLength(5);
    expect(kids[3].getAttribute("name")).toBe("field-4");
    expect(kids[3].getAttribute("placeholder")).toBe("Your answer");
    expect(kids[3].getAttribute("aria-label")).toBe("Field 4");
    expect(kids[4].getId()).toBe("go");
    expect(composer.selection.getSelectedIds()).toEqual([kids[3].getId()]);
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
    const rows = rowTexts();
    expect(rows).toHaveLength(5);
    expect(rows[3][1]).toContain(label);
    const kids = composer.elements.getElement("f")!.getChildren();
    expect(kids[kids.length - 1].getId()).toBe("go");
  });

  describe("the Field block of a selected field (2L9 156:1316)", () => {
    const field = (composer: Composer, id: string) =>
      render(
        <TypeBlockSection
          composer={composer}
          element={{ id, type: composer.elements.getElement(id)!.getType() }}
          targetIds={[id]}
          styles={{}}
          onChange={() => {}}
          onBatchChange={() => {}}
          isOpen
          onToggle={() => {}}
        />,
      );

    it("'‹ {form}' above 'Field'; Type · Label · Placeholder · Name + note · Required · Default value", () => {
      const composer = make();
      field(composer, "email");
      expect(screen.getByTestId("field-back-to-form")).toHaveTextContent("‹ Form");
      const text = document.getElementById("inspector-section-type")!.textContent ?? "";
      const at = ["Field", "Type", "Label", "Placeholder", "Name", "Name is the key stored with each submission.", "Required", "Default value"].map((t) => text.indexOf(t));
      expect(at.every((i) => i >= 0)).toBe(true);
      expect([...at].sort((a, b) => a - b)).toEqual(at);
      fireEvent.click(screen.getByTestId("field-back-to-form"));
      expect(composer.selection.getSelectedIds()).toEqual(["f"]);
    });

    it("Label is the accessible name without a <label>; Placeholder is its own row", () => {
      const composer = make();
      field(composer, "email");
      commit("Label", "Your email");
      expect(composer.elements.getElement("email")?.getAttribute("aria-label")).toBe("Your email");
      expect(composer.elements.getElement("email")?.getAttribute("placeholder")).toBe("Email");
      commit("Placeholder", "you@example.com");
      expect(composer.elements.getElement("email")?.getAttribute("placeholder")).toBe("you@example.com");
    });

    it("Label edits the field's own <label> (Contact form shape)", () => {
      const composer = project([{ id: "f", type: "form", tagName: "form", children: [
        { id: "w", type: "container", tagName: "div", children: [
          { id: "lab", type: "label", tagName: "label", content: "Email", children: [] },
          input("email", "email", "you@example.com"),
        ] },
      ] }]);
      field(composer, "email");
      expect(screen.getByLabelText("Label")).toHaveValue("Email");
      commit("Label", "Work email");
      expect(composer.elements.getElement("lab")?.getContent()).toBe("Work email");
    });

    it("Name: a key another field uses is refused with the board's message, the draft kept (156:1911)", () => {
      const composer = make();
      field(composer, "email");
      commit("Name", "name");
      expect(composer.elements.getElement("email")?.getAttribute("name")).toBe("email");
      expect(screen.getByTestId("form-field-name-error")).toHaveTextContent("“name” is already used. Choose a unique submission key.");
      commit("Name", "work_email");
      expect(composer.elements.getElement("email")?.getAttribute("name")).toBe("work_email");
    });

    it("Type swaps an input for a textarea and the selection follows it", () => {
      const composer = make();
      field(composer, "email");
      fireEvent.click(screen.getByTestId("form-field-type"));
      act(() => { fireEvent.click(screen.getByRole("menuitem", { name: "Textarea" })); });
      const fields = formFields(composer.elements.getElement("f")!);
      expect(fields[1].getTagName().toLowerCase()).toBe("textarea");
      expect(fields[1].getAttribute("placeholder")).toBe("Email");
      expect(composer.selection.getSelectedIds()).toEqual([fields[1].getId()]);
    });

    it("2L9 F29/F30: the Field type card lists the types and Cancel; a change applies with 'Field type changed to Text · Undo'", () => {
      const composer = make();
      field(composer, "email");
      fireEvent.click(screen.getByTestId("form-field-type"));
      expect(screen.getByText("Field type", { selector: "div" })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: "Cancel" })).toBeInTheDocument();
      act(() => { fireEvent.click(screen.getByRole("menuitem", { name: "Text" })); });
      expect(composer.elements.getElement("email")?.getAttribute("type")).toBe("text");
      expect(screen.getByText("Field type changed to Text")).toBeInTheDocument();
      act(() => { fireEvent.click(screen.getByRole("button", { name: "Undo" })); });
      expect(composer.elements.getElement("email")?.getAttribute("type")).toBe("email");
    });

    it("Default value and Required write the field, one undo step each", () => {
      const composer = make();
      field(composer, "email");
      commit("Default value", "Ada");
      expect(composer.elements.getElement("email")?.getAttribute("value")).toBe("Ada");
      composer.history.flushPending?.();
      act(() => { fireEvent.click(screen.getByRole("checkbox", { name: "Required" })); });
      expect(composer.elements.getElement("email")?.getAttribute("required")).toBe("");
      composer.history.flushPending?.();
      act(() => { composer.history.undo(); });
      expect(composer.elements.getElement("email")?.getAttribute("required")).toBeUndefined();
      expect(composer.elements.getElement("email")?.getAttribute("value")).toBe("Ada");
    });
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
