/**
 * RichTextEditor — the inline text toolbar (design-2l9 TX02 / TX05 / TX10).
 *
 * Re-baseline 2026-10-30: the 18-control bar became the board's compact row
 * "Heading ▾ · B · I · U · Lists · Align · Color · Link · … · Done", with
 * every old tool kept (rare ones behind "…"). Every control still funnels
 * into `onCommand(command, value?)`; Done sends `commitEdit`.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";
import { RichTextEditor } from "../RichTextEditor";

beforeAll(() => {
  document.execCommand = vi.fn().mockReturnValue(true);
});
afterEach(cleanup);

function renderEditor(props: Partial<React.ComponentProps<typeof RichTextEditor>> = {}) {
  const onCommand = vi.fn();
  render(<RichTextEditor onCommand={onCommand} {...props} />);
  return onCommand;
}

const click = (id: string) => fireEvent.click(screen.getByTestId(id));

describe("RichTextEditor — the compact row (423:97218)", () => {
  it("reads Heading ▾ · B · I · U · Lists · Align · Color · Link · … · Done", () => {
    renderEditor({ blockTag: "h1" });
    const row = screen.getAllByRole("button").map((b) => b.textContent?.trim());
    expect(row).toEqual(["Heading ▾", "B", "I", "U", "Lists", "Align", "Color", "Link", "…", "Done"]);
  });

  it("names the block from the edited tag", () => {
    renderEditor({ blockTag: "p" });
    expect(screen.getByTestId("rte-block")).toHaveTextContent("Paragraph ▾");
  });

  it("B / I / U dispatch their commands, and show their active state", () => {
    const onCommand = renderEditor({ activeStyles: { bold: true } });
    for (const c of ["bold", "italic", "underline"]) {
      click(`rte-${c}`);
      expect(onCommand).toHaveBeenLastCalledWith(c);
    }
    expect(screen.getByTestId("rte-bold")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("rte-italic")).toHaveAttribute("aria-pressed", "false");
  });

  it("Done commits the edit", () => {
    const onCommand = renderEditor();
    click("rte-done");
    expect(onCommand).toHaveBeenCalledWith("commitEdit");
  });
});

describe("RichTextEditor — menus keep every tool (TX05)", () => {
  it("the block menu sets the tag", () => {
    const onCommand = renderEditor();
    click("rte-block");
    click("rte-block-h2");
    expect(onCommand).toHaveBeenCalledWith("formatBlock", "h2");
  });

  it("Lists and Align", () => {
    const onCommand = renderEditor();
    click("rte-lists");
    click("rte-insertOrderedList");
    expect(onCommand).toHaveBeenLastCalledWith("insertOrderedList");
    click("rte-align");
    click("rte-justifyFull");
    expect(onCommand).toHaveBeenLastCalledWith("justifyFull");
  });

  it("… holds Strikethrough, Indent, Outdent, Text highlight, Clear formatting and Text size", () => {
    const onCommand = renderEditor();
    for (const c of ["strikeThrough", "indent", "outdent", "removeFormat"]) {
      click("rte-more");
      click(`rte-${c}`);
      expect(onCommand).toHaveBeenLastCalledWith(c);
    }
    click("rte-more");
    fireEvent.change(screen.getByTestId("rte-fontSize"), { target: { value: "5" } });
    expect(onCommand).toHaveBeenLastCalledWith("fontSize", "5");
  });

  it("Text highlight opens its colour field in place and sends hiliteColor", async () => {
    const onCommand = renderEditor();
    click("rte-more");
    click("rte-highlight");
    const [picker] = await screen.findAllByLabelText("Text highlight");
    fireEvent.change(picker, { target: { value: "#00ff00" } });
    expect(onCommand).toHaveBeenCalledWith("hiliteColor", "#00ff00");
  });

  it("Color sends foreColor", async () => {
    const onCommand = renderEditor();
    click("rte-color");
    const [picker] = await screen.findAllByLabelText("Text color");
    fireEvent.change(picker, { target: { value: "#ff0000" } });
    expect(onCommand).toHaveBeenCalledWith("foreColor", "#ff0000");
  });

  it("Link applies a typed address, refuses an empty one, and removes", () => {
    const onCommand = renderEditor();
    click("rte-link");
    expect(screen.getByTestId("rte-link-apply")).toBeDisabled();
    fireEvent.change(screen.getByTestId("rte-link-url"), { target: { value: "https://example.com" } });
    click("rte-link-apply");
    expect(onCommand).toHaveBeenCalledWith("createLink", "https://example.com");
    click("rte-link");
    click("rte-unlink");
    expect(onCommand).toHaveBeenCalledWith("unlink");
  });
});
