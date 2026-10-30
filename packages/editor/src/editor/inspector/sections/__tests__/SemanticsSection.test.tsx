/**
 * Content › Semantics (2L9 boards 161:8480, 247:26594): Tag — a heading's
 * level, written in one transaction (one Undo), refused on a locked heading;
 * any other type's tag, read-only — and ID (single selection), with the
 * all-breakpoints note.
 *
 * @license BSD-3-Clause
 */

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import type { Composer } from "@/engine/Composer";
import { SemanticsSection, tagLabel } from "../SemanticsSection";
import { ToastProvider } from "@/editor/chrome-ui";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

function setup(type: string, opts: Record<string, unknown> = {}) {
  const c: Composer = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const el = c.elements.createElement(type as never, { content: "Hi", ...opts } as never);
  c.elements.addElement(el, root);
  c.history.flushPending();
  return { c, id: el.getId() };
}

function renderSection(c: Composer, id: string, type: string, targetIds: readonly string[] = [id]) {
  return render(<SemanticsSection composer={c} element={{ id, type }} targetIds={targetIds} isOpen onToggle={() => {}} />);
}

describe("Semantics", () => {
  const tagSelect = () => screen.getByLabelText("Tag") as HTMLSelectElement;

  it("a heading's Tag is a select H1–H6 (2L9 247:26594); choosing one writes the tag and ONE Undo restores it", () => {
    const { c, id } = setup("heading", { tagName: "h2" });
    renderSection(c, id, "heading");
    expect(Array.from(tagSelect().options).map((o) => o.textContent)).toEqual(["H1", "H2", "H3", "H4", "H5", "H6", "p — change to paragraph…"]);
    expect(tagSelect().value).toBe("h2");
    fireEvent.change(tagSelect(), { target: { value: "h4" } });
    expect(c.elements.getElement(id)!.getTagName()).toBe("h4");
    c.history.flushPending();
    c.history.undo();
    expect(c.elements.getElement(id)!.getTagName()).toBe("h2");
  });

  it("a locked heading keeps its tag", () => {
    const { c, id } = setup("heading", { tagName: "h2" });
    c.elements.getElement(id)!.setLocked(true);
    renderSection(c, id, "heading");
    fireEvent.change(tagSelect(), { target: { value: "h5" } });
    expect(c.elements.getElement(id)!.getTagName()).toBe("h2");
  });

  it("a text's Tag is a select of text tags, named as the board does (161:8480: 'Paragraph')", () => {
    const { c, id } = setup("paragraph");
    renderSection(c, id, "paragraph");
    expect(tagSelect().selectedOptions[0].textContent).toBe("Paragraph");
    fireEvent.change(tagSelect(), { target: { value: "blockquote" } });
    expect(c.elements.getElement(id)!.getTagName()).toBe("blockquote");
  });

  it("any other type shows its tag by name, read-only", () => {
    const { c, id } = setup("image");
    renderSection(c, id, "image");
    expect(screen.getByTestId("inspector-semantics-tag")).toHaveTextContent("Image");
  });

  it("ID writes the id attribute; the note says it applies to all breakpoints", () => {
    const { c, id } = setup("paragraph");
    renderSection(c, id, "paragraph");
    fireEvent.change(screen.getByPlaceholderText("element-id"), { target: { value: "intro" } });
    expect(c.elements.getElement(id)!.getAttribute("id")).toBe("intro");
    expect(screen.getByTestId("inspector-semantics-note")).toHaveTextContent("Content and semantic changes apply to all breakpoints.");
  });

  it("a multi-selection gets no ID row (one id cannot name two elements)", () => {
    const { c, id } = setup("heading", { tagName: "h2" });
    renderSection(c, id, "heading", [id, "other"]);
    expect(screen.queryByPlaceholderText("element-id")).toBeNull();
    expect(tagSelect()).toBeInTheDocument();
  });

  it("names tags as the board does", () => {
    expect(tagLabel("P")).toBe("Paragraph");
    expect(tagLabel("h3")).toBe("Heading 3");
    expect(tagLabel("nav")).toBe("Navigation");
    expect(tagLabel("time")).toBe("time");
  });

  it("B4-Native: a time / meter / details shows its native attributes, each write one Undo on the node; a wbr says it has no children", () => {
    const { c, id } = setup("text", { tagName: "time" });
    renderSection(c, id, "text");
    const native = screen.getByTestId("inspector-native-attributes");
    fireEvent.change(within(native).getByLabelText("datetime"), { target: { value: "2026-10-21" } });
    expect(c.elements.getElement(id)!.getAttribute("datetime")).toBe("2026-10-21");
    c.history.flushPending();
    c.history.undo();
    expect(c.elements.getElement(id)!.getAttribute("datetime")).toBeUndefined();
    cleanup();
    const meter = setup("container", { tagName: "meter" });
    renderSection(meter.c, meter.id, "container");
    expect(within(screen.getByTestId("inspector-native-attributes")).getByLabelText("Optimum")).toBeInTheDocument();
    cleanup();
    const wbr = setup("text", { tagName: "wbr" });
    renderSection(wbr.c, wbr.id, "text");
    expect(screen.getByTestId("inspector-semantics-void")).toHaveTextContent("No text or children");
  });

  it("A12 / A13: a heading's Tag offers 'change to paragraph…', reviewed; the same node becomes a paragraph in ONE Undo", () => {
    const { c, id } = setup("heading", { tagName: "h2", styles: { color: "red" }, attributes: { id: "our-approach" } });
    render(
      <ToastProvider>
        <SemanticsSection composer={c} element={{ id, type: "heading" }} targetIds={[id]} isOpen onToggle={() => {}} />
      </ToastProvider>,
    );
    fireEvent.change(tagSelect(), { target: { value: "convert:p" } });
    expect(c.elements.getElement(id)!.getType()).toBe("heading");
    expect(screen.getByTestId("inspector-semantics-review")).toHaveTextContent("Heading semantics will change.");
    const before = c.history.getUndoCount();
    fireEvent.click(screen.getByTestId("inspector-semantics-convert"));
    c.history.flushPending();
    const now = c.elements.getElement(id)!;
    expect([now.getType(), now.getTagName(), now.getContent(), now.getAttribute("id"), now.getStyles().color]).toEqual(["paragraph", "p", "Hi", "our-approach", "red"]);
    expect(c.history.getUndoCount()).toBe(before + 1);
    expect(screen.getByText("Heading changed to paragraph.")).toBeInTheDocument();
    c.history.undo();
    expect([c.elements.getElement(id)!.getType(), c.elements.getElement(id)!.getTagName()]).toEqual(["heading", "h2"]);
  });
});
