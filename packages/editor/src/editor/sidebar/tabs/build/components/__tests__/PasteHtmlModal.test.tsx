// @vitest-environment jsdom
/**
 * PasteHtmlModal — board 6887:78320 (G2-112): the markup is shown before it
 * lands, and the modal says what sanitising will strip.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { PasteHtmlModal, describeStrip } from "../PasteHtmlModal";

describe("describeStrip", () => {
  it("counts script tags and event handlers", () => {
    expect(describeStrip('<p onclick="x()">a</p><script>1</script><script>2</script>')).toBe(
      "2 <script> tags and 1 event handler will be removed",
    );
    expect(describeStrip("<script>1</script>")).toBe("1 <script> tag will be removed");
    expect(describeStrip("<h1>Hi</h1>")).toBeNull();
  });
});

describe("PasteHtmlModal", () => {
  it("prefills the textarea, shows the strip notice, and inserts the edited markup", () => {
    const onInsert = vi.fn();
    render(<PasteHtmlModal open initialHtml={'<h1>Hi</h1><script>x</script>'} onClose={vi.fn()} onInsert={onInsert} />);
    expect(screen.getByText("Paste HTML")).toBeTruthy();
    const area = screen.getByTestId("paste-html-input") as HTMLTextAreaElement;
    expect(area.value).toBe("<h1>Hi</h1><script>x</script>");
    expect(screen.getByTestId("paste-html-strip").textContent).toBe("1 <script> tag will be removed");
    fireEvent.change(area, { target: { value: "<h2>Yo</h2>" } });
    expect(screen.queryByTestId("paste-html-strip")).toBeNull();
    fireEvent.click(screen.getByTestId("paste-html-insert"));
    expect(onInsert).toHaveBeenCalledWith("<h2>Yo</h2>");
  });

  it("Insert is disabled while the field is empty", () => {
    render(<PasteHtmlModal open initialHtml="" onClose={vi.fn()} onInsert={vi.fn()} />);
    expect((screen.getByTestId("paste-html-insert") as HTMLButtonElement).disabled).toBe(true);
  });
});
