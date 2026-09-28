/**
 * Type block — the W1 generic bodies: the defining rows each type carries
 * over from the old Advanced section, their write routing, and what the
 * redesign removed from them (R-DD-9: content textareas, Open In, Rel, link
 * Title). Lanes L2-A / L2-B / L2-C replace the bodies with the board layouts.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TypeBlockSection } from "../TypeBlockSection";
import { AttributesSection, attributesSummary } from "../../attributes/AttributesSection";
import { makeMockElement, makeMockComposer } from "@/editor/inspector/__tests__/harness";
import type { MockElementOptions } from "@/editor/inspector/__tests__/harness";

function setup(type: string, elOpts: Partial<MockElementOptions> = {}, extra: { onOpenIconPicker?: (...args: never[]) => void } = {}) {
  const el = makeMockElement({ id: "e1", type, ...elOpts });
  const composer = makeMockComposer({ element: el });
  const utils = render(
    <TypeBlockSection
      element={{ id: "e1", type }}
      targetIds={["e1"]}
      composer={composer as never}
      styles={{}}
      onChange={() => {}}
      onBatchChange={() => {}}
      isOpen
      onToggle={() => {}}
      onOpenIconPicker={extra.onOpenIconPicker as never}
    />
  );
  return { el, composer, ...utils };
}

const selectWith = (container: HTMLElement, value: string) =>
  Array.from(container.querySelectorAll("select")).find((s) =>
    Array.from(s.options).some((o) => o.value === value)
  ) as HTMLSelectElement;

describe("type block frame", () => {
  it("is titled by the element's true type", () => {
    setup("checkbox");
    expect(screen.getByRole("button", { name: /^Checkbox section/ })).toBeInTheDocument();
    expect(screen.queryByText("Container")).toBeNull();
  });

  it("renders nothing for a type with no defining settings (a plain container)", () => {
    const { container } = setup("container");
    expect(container.innerHTML).toBe("");
  });
});

describe("text family", () => {
  it("Heading: Level writes the tag, and Edit text on canvas is the text door", () => {
    const { el, container } = setup("heading");
    fireEvent.change(selectWith(container, "h3"), { target: { value: "h3" } });
    expect(el.setTagName).toHaveBeenCalledWith("h3");
    expect(screen.getByTestId("inspector-edit-text-on-canvas")).toBeInTheDocument();
  });

  it.each(["heading", "text", "paragraph", "label", "link", "button"])("%s has no content textarea", (type) => {
    const { container } = setup(type);
    expect(container.querySelector("textarea")).toBeNull();
  });

  it.each(["link", "button"])("%s has no Open In / Rel / Title row (R-DD-9)", (type) => {
    setup(type);
    for (const label of [/open in/i, /^rel$/i, /^title$/i]) expect(screen.queryByText(label)).toBeNull();
  });

  it("Button: Type and Disabled", () => {
    const { el, container } = setup("button");
    fireEvent.change(selectWith(container, "submit"), { target: { value: "submit" } });
    expect(el.setAttribute).toHaveBeenCalledWith("type", "submit");
    expect(screen.getByRole("checkbox", { name: "Disabled" })).toBeInTheDocument();
  });
});

describe("form fields", () => {
  it("Input: board 14's six rows, in order", () => {
    const { container } = setup("input");
    const labels = Array.from(container.querySelectorAll("label")).map((l) => l.textContent?.trim());
    expect(labels).toEqual(["Input type", "Name", "Placeholder", "Default", "Required", "Disabled"]);
  });

  it("changing the input type writes the type attribute in one transaction", () => {
    const { el, composer, container } = setup("input");
    fireEvent.change(selectWith(container, "email"), { target: { value: "email" } });
    expect(el.setAttribute).toHaveBeenCalledWith("type", "email");
    expect(composer.beginTransaction).toHaveBeenCalledWith("element-prop-change");
  });

  it("Select: newline-separated options rebuild the <option> markup", () => {
    const { el } = setup("select");
    const row = screen.getByText("Options (one per line)").closest(".bdi-row-ctrl") as HTMLElement;
    fireEvent.change(row.querySelector("textarea") as HTMLTextAreaElement, { target: { value: "Red\nBlue" } });
    expect(el.setContent).toHaveBeenCalledWith("<option>Red</option><option>Blue</option>");
  });
});

describe("media", () => {
  it("Video: no URL row; Autoplay and Poster write their attributes", () => {
    const { el } = setup("video");
    expect(screen.queryByText("Video URL")).toBeNull();
    fireEvent.click(within(screen.getByText("Autoplay").parentElement as HTMLElement).getByRole("checkbox"));
    expect(el.setAttribute).toHaveBeenCalledWith("autoplay", "true");
    const poster = (screen.getByText("Poster image").closest(".bdi-row-ctrl") as HTMLElement).querySelector("input")!;
    fireEvent.change(poster, { target: { value: "https://p.example/p.jpg" } });
    expect(el.setAttribute).toHaveBeenCalledWith("poster", "https://p.example/p.jpg");
  });

  it("Icon: the picker opens with the current icon, and a pick writes it", () => {
    const onOpenIconPicker = vi.fn();
    const { el } = setup("icon", { attrs: { "data-icon-name": "heart" } }, { onOpenIconPicker });
    fireEvent.click(screen.getByTestId("inspector-icon-change"));
    const [current, onSelect] = onOpenIconPicker.mock.calls[0];
    expect(current).toMatchObject({ name: "heart", library: "lucide" });
    onSelect({ library: "lucide", name: "star", size: 48, color: "#ff0000", strokeWidth: 2 });
    expect(el.setAttribute).toHaveBeenCalledWith("data-icon-name", "star");
    expect(el.setStyle).toHaveBeenCalledWith("width", "48px");
  });
});

describe("layout", () => {
  it("Columns: the count adds the missing columns", () => {
    const { el, composer, container } = setup("columns");
    fireEvent.change(selectWith(container, "3"), { target: { value: "3" } });
    expect(composer.elements.createElement).toHaveBeenCalledTimes(3);
    expect(el.addChild).toHaveBeenCalledTimes(3);
  });
});

describe("Attributes", () => {
  it("ID, title, tab index and the type's §17.H rows; a link has no Title", () => {
    const el = makeMockElement({ id: "e1", type: "input" });
    const composer = makeMockComposer({ element: el });
    const { unmount } = render(
      <AttributesSection element={{ id: "e1", type: "input" }} targetIds={["e1"]} composer={composer as never} isOpen onToggle={() => {}} />
    );
    for (const label of ["ID", "Title", "Tab index", "Read only", "Autocomplete"]) expect(screen.getByText(label)).toBeInTheDocument();
    unmount();
    render(<AttributesSection element={{ id: "e1", type: "link" }} targetIds={["e1"]} composer={composer as never} isOpen onToggle={() => {}} />);
    expect(screen.queryByText("Title")).toBeNull();
  });

  it("summarises as the board does: id, then how many attributes", () => {
    const el = makeMockElement({ id: "e1", type: "heading", attrs: { id: "hero-title", title: "Hi" } });
    const composer = makeMockComposer({ element: el });
    expect(attributesSummary(composer as never, { id: "e1", type: "heading" })).toBe("id: hero-title · 1 attribute");
    expect(attributesSummary(makeMockComposer({ element: makeMockElement({ id: "e1" }) }) as never, { id: "e1", type: "heading" })).toBeNull();
  });
});
